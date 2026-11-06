// Makes the image processing test fixtures from full-size iPhone JPEGs. See README.md.
//
//   pnpm exec deno run --config supabase/functions/deno.json --allow-read --allow-write \
//     --allow-run=exiftool supabase/functions/tests/fixtures/make-fixtures.ts <folder>
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
} from '@imagemagick/magick-wasm';
import { fromFileUrl } from '@std/path';

const fixtures = [
  { name: 'upright.jpg', source: 'IMG_1587.jpeg', longSide: 2048 },
  { name: 'rotated.jpg', source: 'IMG_1586.jpeg', longSide: 2048 },
  { name: 'too-large.jpg', source: 'IMG_1588.JPG', longSide: 2049 },
];

// Metadata the server must remove, on top of what the phone already wrote (EXIF, Apple
// MakerNotes, a Display P3 profile). The coordinates are in the middle of the Atlantic.
const extraMetadata = [
  '-GPSLatitude=0.5',
  '-GPSLatitudeRef=N',
  '-GPSLongitude=25.5',
  '-GPSLongitudeRef=W',
  '-XMP-dc:Creator=Riffit test fixture',
  '-IPTC:Keywords=riffit-fixture',
  '-Comment=riffit test fixture',
];

const [sourceDir] = Deno.args;
if (!sourceDir) throw new Error('Usage: make-fixtures.ts <folder with the source photos>');

const wasm = await Deno.readFile(
  new URL(import.meta.resolve('@imagemagick/magick-wasm/magick.wasm')),
);
await initializeImageMagick(wasm);

for (const fixture of fixtures) {
  const outPath = fromFileUrl(new URL(fixture.name, import.meta.url));
  const source = await Deno.readFile(`${sourceDir}/${fixture.source}`);

  // Resize the stored pixels and keep the metadata, as a phone might. No auto-orient, so the
  // orientation tag still describes the pixels.
  const resized = ImageMagick.read(source, (image) => {
    image.resize(new MagickGeometry(fixture.longSide, fixture.longSide));
    image.quality = 90;
    return image.write(MagickFormat.Jpeg, (data) => data.slice());
  });
  await Deno.writeFile(outPath, resized);

  const exiftool = new Deno.Command('exiftool', {
    args: ['-q', '-overwrite_original', ...extraMetadata, outPath],
  });
  const { code, stderr } = await exiftool.output();
  if (code !== 0) throw new Error(new TextDecoder().decode(stderr));
  console.log(`${fixture.name} from ${fixture.source}`);
}
