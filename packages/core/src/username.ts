import { z } from 'zod';

// Mirrors the database's username check. Usernames are stored lowercase, so uniqueness is
// case-insensitive. Periods, hyphens, and underscores can't start, end, or repeat. Reserved names
// are only checked by the database, in complete_onboarding().
export const USERNAME_PATTERN = /^(?![._-])(?!.*[._-]$)(?!.*(\.\.|--|__))[a-z0-9_.-]{3,30}$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    USERNAME_PATTERN,
    '3–30 characters: letters, numbers, periods, hyphens, and underscores. Symbols can’t come first or last, or twice in a row.',
  );
