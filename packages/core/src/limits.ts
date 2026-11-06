// Text limits shared with the database check constraints. Placeholders until spec §19
// ("Profile fields", "Text limits") is settled. Change the migration and this file together.
export const DISPLAY_NAME_MAX = 50;
export const BIO_MAX = 300;

// The app resizes photos to fit before uploading, and the process-image Edge Function rejects
// anything larger (spec §9). The function imports this file directly.
export const PHOTO_MAX_LONG_SIDE = 2048;
