# Image processing fixtures

Test inputs for the `process-image` Edge Function. Each one is what the app could upload in the worst case: a JPEG about 2048px on the long side that still has all of the phone's metadata, plus some it didn't write.

| File | Size | Orientation | Purpose |
|---|---|---|---|
| `upright.jpg` | 2048×1536 | normal | The common case |
| `rotated.jpg` | 2048×1536 stored | Rotate 90 CW | Must come out 1536×2048 and upright |
| `too-large.jpg` | 2049×1537 | Rotate 90 CW | One pixel over the limit, so it must be rejected |

All three:

- come from iPhone 14 photos taken with Location off, as converted to JPEG by iOS
- keep the phone's EXIF, Apple MakerNotes, and Display P3 color profile
- have **fake** GPS added (0°30′N 25°30′W, in the middle of the Atlantic), plus XMP, IPTC, and a JPEG comment

The tests check that none of this survives processing.

## Making them again

Never use photos with a real location. The repo is public, and git history keeps every version of a file.

1. Install ExifTool so `exiftool` is on your `PATH` (on Windows, `winget install OliverBetz.ExifTool`).
2. Put the source photos in a folder outside the repo, or in an untracked one. The file names they need are in `make-fixtures.ts`.
3. From the repo root:

   ```sh
   pnpm exec deno run --config supabase/functions/deno.json --allow-read --allow-write --allow-run=exiftool \
     supabase/functions/tests/fixtures/make-fixtures.ts <folder>
   ```

4. Check each fixture with `exiftool -G0 -s <file>` before committing it, and make sure the GPS is the fake one.
