import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url({
    protocol: /^https?$/,
    error: 'must be an http or https URL',
  }),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: 'is required' })
    .min(1, { error: 'is required' }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`);
    throw new Error(
      `Invalid environment:\n${problems.join('\n')}\nSee apps/mobile/.env.example, then restart Expo.`,
    );
  }
  return result.data;
}
