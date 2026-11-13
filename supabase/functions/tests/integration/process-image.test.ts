// Calls the served process-image function on the local stack. Needs `pnpm db:start`, a fresh
// `pnpm db:reset` (for the seeded users), and `pnpm supabase functions serve`. Run with
// `pnpm test:functions:integration`.
import { assert, assertEquals, assertExists } from '@std/assert';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../packages/supabase/src/database.types.ts';
import { BUCKET, versionPath } from '../../process-image/save.ts';

// The local stack's URL and keys are the same on every machine. Override them through the
// environment if your stack uses different ones (`pnpm supabase status`).
const url = Deno.env.get('SUPABASE_URL') ?? 'http://127.0.0.1:54321';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// These tests sign in with seed.sql's public password, so they only make sense locally.
const { hostname } = new URL(url);
if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
  throw new Error(`integration tests only run against the local stack, not ${url}`);
}

const SEED_PASSWORD = 'riffit-dev-only';
const VERSION_NAMES = ['full', 'feed-1024', 'feed-512'] as const;
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

const admin = createClient<Database>(url, serviceRoleKey, clientOptions);
const photo = await Deno.readFile(new URL('../fixtures/upright.jpg', import.meta.url));

async function signIn(email: string) {
  const client = createClient<Database>(url, anonKey, clientOptions);
  const { data, error } = await client.auth.signInWithPassword({ email, password: SEED_PASSWORD });
  if (error) throw error;
  return { client, id: data.user.id, token: data.session.access_token };
}

const maya = await signIn('maya@example.test');
const jo = await signIn('jo.makes@example.test');

function upload(body: Uint8Array<ArrayBuffer>, token?: string) {
  return fetch(`${url}/functions/v1/process-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
}

// Everything a test might have saved, so the denied cases can check that nothing was.
async function savedState() {
  const { count, error } = await admin
    .from('post_images')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  const { data: folders, error: listError } = await admin.storage.from(BUCKET).list(maya.id);
  if (listError) throw listError;
  return { rows: count, imageFolders: folders.length };
}

async function removeImage(ownerId: string, id: string) {
  await admin.from('post_images').delete().eq('id', id);
  await admin.storage.from(BUCKET).remove(
    VERSION_NAMES.map((name) => versionPath(ownerId, id, name)),
  );
}

async function canDownload(client: SupabaseClient<Database>, path: string) {
  const { data } = await client.storage.from(BUCKET).download(path);
  return data !== null;
}

Deno.test('a signed-in upload saves three versions and an unattached image row', async () => {
  const response = await upload(photo, maya.token);
  assertEquals(response.status, 201);
  const { id } = await response.json();
  assertExists(id);

  try {
    const { data: row, error } = await maya.client
      .from('post_images')
      .select('owner_id, post_id, position, width, height')
      .eq('id', id)
      .single();
    if (error) throw error;
    // upright.jpg is 2048x1536 (see fixtures/README.md).
    assertEquals(row, {
      owner_id: maya.id,
      post_id: null,
      position: null,
      width: 2048,
      height: 1536,
    });

    const { data: files, error: listError } = await admin.storage.from(BUCKET)
      .list(`${maya.id}/${id}`);
    if (listError) throw listError;
    assertEquals(
      files.map((file) => file.name).sort(),
      VERSION_NAMES.map((n) => `${n}.jpg`).sort(),
    );

    for (const name of VERSION_NAMES) {
      assert(await canDownload(maya.client, versionPath(maya.id, id, name)), name);
    }
  } finally {
    await removeImage(maya.id, id);
  }
});

Deno.test("another user can't read an unattached image", async () => {
  const response = await upload(photo, maya.token);
  assertEquals(response.status, 201);
  const { id } = await response.json();

  try {
    const { data: rows, error } = await jo.client.from('post_images').select('id').eq('id', id);
    if (error) throw error;
    assertEquals(rows, []);
    for (const name of VERSION_NAMES) {
      assert(!(await canDownload(jo.client, versionPath(maya.id, id, name))), name);
    }
  } finally {
    await removeImage(maya.id, id);
  }
});

Deno.test('signed-out uploads are refused and save nothing', async (t) => {
  const before = await savedState();

  await t.step('with no token', async () => {
    const response = await upload(photo);
    await response.body?.cancel();
    assertEquals(response.status, 401);
  });

  // The anon key passes the gateway's JWT check, so the function itself has to refuse it.
  await t.step('with the anon key', async () => {
    const response = await upload(photo, anonKey);
    assertEquals(response.status, 401);
    assertEquals(await response.json(), { error: 'not-signed-in' });
  });

  assertEquals(await savedState(), before);
});

Deno.test('a rejected photo saves nothing', async () => {
  const before = await savedState();
  const response = await upload(new TextEncoder().encode('not a photo'), maya.token);
  assertEquals(response.status, 422);
  assertEquals(await response.json(), { error: 'not-jpeg' });
  assertEquals(await savedState(), before);
});

Deno.test("a user who hasn't finished onboarding is refused", async () => {
  const email = 'no-profile@example.test';
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;

  try {
    const before = await savedState();
    const { token } = await signIn(email);
    const response = await upload(photo, token);
    assertEquals(response.status, 403);
    assertEquals(await response.json(), { error: 'no-profile' });
    assertEquals(await savedState(), before);
  } finally {
    await admin.auth.admin.deleteUser(data.user.id);
  }
});
