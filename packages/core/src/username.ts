import { z } from 'zod';

// Mirrors the database's username check. Usernames are stored lowercase, so uniqueness is
// case-insensitive. Periods and hyphens can't start, end, or repeat. Reserved names are only
// checked by the database, in complete_onboarding().
export const USERNAME_PATTERN = /^(?![.-])(?!.*[.-]$)(?!.*(\.\.|--))[a-z0-9_.-]{3,30}$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    USERNAME_PATTERN,
    '3–30 characters: letters, numbers, underscores, periods, and hyphens. Periods and hyphens can’t come first or last, or twice in a row.',
  );
