// Text limits shared with the database check constraints. Placeholders until spec §19
// ("Profile fields", "Text limits") is settled. Change the migration and this file together.
export const DISPLAY_NAME_MAX = 50;
export const BIO_MAX = 300;

// Posts (spec §3, §9). Text limits are placeholders until §19 is settled (#37).
export const POST_BODY_MAX = 2000;
export const ALT_TEXT_MAX = 1000;
export const POST_IMAGES_MAX = 6;

// The app resizes photos to fit before uploading, and the process-image Edge Function rejects
// anything larger (spec §9). The function imports this file directly.
export const PHOTO_MAX_LONG_SIDE = 2048;
