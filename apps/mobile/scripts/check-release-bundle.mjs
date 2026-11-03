// Builds a release bundle and fails if anything from src/dev got into it.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SEED_EMAIL_DOMAIN, SEED_PASSWORD } from '../src/dev/seedCredentials.ts';

// In the Profile screen. Proves the scan is reading the real app, not an empty bundle.
const EXPECTED = 'Your profile will show up here.';
const FORBIDDEN = [SEED_PASSWORD, SEED_EMAIL_DOMAIN, 'Dev sign-in', 'Dev: sign in as'];

const outputDir = mkdtempSync(join(tmpdir(), 'riffit-release-'));

try {
  // Without --no-bytecode the output is Hermes bytecode, which is harder to search reliably.
  const build = spawnSync(
    `pnpm exec expo export --platform ios --no-bytecode --output-dir "${outputDir}"`,
    { shell: true, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } },
  );
  if (build.status !== 0) {
    console.error('The release bundle failed to build.');
    process.exit(1);
  }

  const bundle = readdirSync(outputDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(js|hbc)$/.test(file))
    .map((file) => readFileSync(join(outputDir, file), 'utf8'))
    .join('\n');

  if (!bundle.includes(EXPECTED)) {
    console.error(`Didn't find "${EXPECTED}" in the bundle, so this check can't be trusted.`);
    process.exit(1);
  }

  const found = FORBIDDEN.filter((text) => bundle.includes(text));
  if (found.length > 0) {
    console.error(`Dev-only code is in the release bundle:\n${found.join('\n')}`);
    process.exit(1);
  }

  console.log('Release bundle has no dev-only code.');
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
