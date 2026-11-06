import { assert, assertEquals, assertLess, assertRejects } from '@std/assert';
import {
  ColorProfile,
  ErrorMetric,
  ImageMagick,
  MagickColor,
  MagickColors,
  MagickFormat,
  MagickGeometry,
  MagickImage,
} from '@imagemagick/magick-wasm';
import {
  type ImageVersion,
  initialize,
  MAX_INPUT_BYTES,
  processImage,
  RejectedImage,
  type RejectionReason,
} from '../process-image/process.ts';
import { srgbProfile } from '../process-image/srgb-profile.ts';

const fixture = (name: string) => Deno.readFile(new URL(`./fixtures/${name}`, import.meta.url));

await initialize();

// Lists a JPEG's segments by marker. Pixel data and the basic JFIF header are allowed; any other
// segment (EXIF, XMP, ICC, IPTC, MPF, comments) is metadata. Also reports bytes after the end
// marker, where iPhones append extra images.
function jpegSegments(data: Uint8Array) {
  assert(data[0] === 0xff && data[1] === 0xd8, 'missing start of image');
  const segments: { marker: number; payload: Uint8Array }[] = [];
  let i = 2;
  while (i < data.length) {
    assertEquals(data[i], 0xff, `expected a marker at byte ${i}`);
    while (data[i + 1] === 0xff) i++; // fill bytes
    const marker = data[i + 1];
    i += 2;
    if (marker === 0xd9) return { segments, trailingBytes: data.length - i };
    const length = (data[i] << 8) | data[i + 1];
    segments.push({ marker, payload: data.subarray(i + 2, i + length) });
    i += length;
    if (marker === 0xda) {
      // Skip the compressed data up to the next marker that isn't a stuffed byte or a restart.
      while (
        i < data.length && !(data[i] === 0xff && data[i + 1] !== 0 && (data[i + 1] & 0xf8) !== 0xd0)
      ) {
        i++;
      }
    }
  }
  throw new Error('missing end of image');
}

const PIXEL_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc4, 0xdb, 0xdd, 0xda]); // SOF0-2, DHT, DQT, DRI, SOS
const JFIF = new TextEncoder().encode('JFIF\0');

function assertNoMetadata(version: ImageVersion) {
  const { segments, trailingBytes } = jpegSegments(version.data);
  for (const { marker, payload } of segments) {
    if (marker === 0xe0) {
      assertEquals(payload.subarray(0, 5), JFIF, `${version.name}: APP0 isn't JFIF`);
    } else {
      assert(
        PIXEL_MARKERS.has(marker),
        `${version.name}: metadata segment 0xff${marker.toString(16)}`,
      );
    }
  }
  assertEquals(trailingBytes, 0, `${version.name}: data after the end of the image`);

  // Belt and braces: strings the fixtures are known to contain.
  const text = new TextDecoder('latin1').decode(version.data);
  for (const needle of ['iPhone', 'Apple', 'riffit', 'Riffit', 'Display P3']) {
    assert(!text.includes(needle), `${version.name}: contains "${needle}"`);
  }
}

function sizes(versions: ImageVersion[]) {
  return versions.map(({ name, width, height }) => `${name} ${width}x${height}`);
}

function makeJpeg(width: number, height: number): Uint8Array {
  return ImageMagick.read(
    MagickColors.Orange,
    width,
    height,
    (image) => image.write(MagickFormat.Jpeg, (data) => data.slice()),
  );
}

// Horizontal 1px black and white stripes, like a fine fabric weave.
function makeStripedJpeg(width: number, height: number): Uint8Array {
  const header = new TextEncoder().encode(`P5\n${width} ${height}\n255\n`);
  const pgm = new Uint8Array(header.length + width * height);
  pgm.set(header);
  for (let y = 0; y < height; y += 2) {
    pgm.fill(255, header.length + y * width, header.length + (y + 1) * width);
  }
  return ImageMagick.read(
    pgm,
    MagickFormat.Pgm,
    (image) => image.write(MagickFormat.Jpeg, (data) => data.slice()),
  );
}

// How different two images look, from 0 (identical) up.
function difference(a: Uint8Array, b: Uint8Array): number {
  const imageA = MagickImage.create(a);
  const imageB = MagickImage.create(b);
  try {
    return imageA.compare(imageB, ErrorMetric.RootMeanSquared);
  } finally {
    imageA.dispose();
    imageB.dispose();
  }
}

async function assertRejected(input: Uint8Array, reason: RejectionReason) {
  const error = await assertRejects(() => processImage(input), RejectedImage);
  assertEquals(error.reason, reason);
}

Deno.test('makes a full-size version and feed sizes', async () => {
  const versions = await processImage(await fixture('upright.jpg'));
  assertEquals(sizes(versions), ['full 2048x1536', 'feed-1024 1024x768', 'feed-512 512x384']);
});

Deno.test('removes all metadata, including the fake GPS, from every version', async () => {
  for (const name of ['upright.jpg', 'rotated.jpg']) {
    const versions = await processImage(await fixture(name));
    versions.forEach(assertNoMetadata);
  }
});

Deno.test('turns sideways photos upright', async () => {
  const input = await fixture('rotated.jpg');
  const versions = await processImage(input);
  assertEquals(sizes(versions), ['full 1536x2048', 'feed-1024 768x1024', 'feed-512 384x512']);

  // The fixture is tagged "Rotate 90 CW", so the result should match rotating the stored pixels
  // clockwise, and not counterclockwise.
  const rotated = (degrees: number) =>
    ImageMagick.read(input, (image) => {
      image.rotate(degrees);
      image.transformColorSpace(new ColorProfile(srgbProfile));
      image.resize(new MagickGeometry(512, 512));
      return image.write(MagickFormat.Jpeg, (data) => data.slice());
    });
  const output = versions[2].data;
  assertLess(difference(output, rotated(90)), difference(output, rotated(-90)) / 4);
});

Deno.test('converts Display P3 colors to sRGB', async () => {
  const input = await fixture('upright.jpg');
  const output = (await processImage(input))[2].data;

  // References at the same size: one converted properly, one with the profile thrown away.
  const reference = (convert: boolean) =>
    ImageMagick.read(input, (image) => {
      if (convert) image.transformColorSpace(new ColorProfile(srgbProfile));
      image.strip();
      image.resize(new MagickGeometry(512, 512));
      return image.write(MagickFormat.Jpeg, (data) => data.slice());
    });
  assertLess(difference(output, reference(true)), difference(output, reference(false)) / 2);
});

Deno.test('never enlarges a small photo', async () => {
  const versions = await processImage(makeJpeg(600, 400));
  assertEquals(sizes(versions), ['full 600x400', 'feed-1024 600x400', 'feed-512 512x341']);
});

Deno.test('keeps the proportions of tightly cropped photos', async () => {
  // Mirror selfies cropped close to the body: tall, narrow, and often under the size limit.
  assertEquals(sizes(await processImage(makeJpeg(900, 2048))), [
    'full 900x2048',
    'feed-1024 450x1024',
    'feed-512 225x512',
  ]);
  assertEquals(sizes(await processImage(makeJpeg(1200, 1800))), [
    'full 1200x1800',
    'feed-1024 683x1024',
    'feed-512 342x512',
  ]);
  assertEquals(sizes(await processImage(makeJpeg(640, 1700))), [
    'full 640x1700',
    'feed-1024 386x1024',
    'feed-512 193x512',
  ]);
});

Deno.test('keeps fine patterns smooth when a cropped photo shrinks unevenly', async () => {
  // Shrunk well, 1px stripes blend into an even grey. A box filter at an uneven ratio (here 1800
  // to 1024) leaves visible bands instead.
  const [, feed] = await processImage(makeStripedJpeg(1200, 1800));
  const grey = ImageMagick.read(
    new MagickColor('#808080'),
    feed.width,
    feed.height,
    (image) => image.write(MagickFormat.Jpeg, (data) => data.slice()),
  );
  assertLess(difference(feed.data, grey), 0.05);
});

Deno.test('rejects photos larger than the limit', async () => {
  await assertRejected(await fixture('too-large.jpg'), 'too-large');
  await assertRejected(makeJpeg(2049, 100), 'too-large');
  await assertRejected(makeJpeg(100, 2049), 'too-large');
});

Deno.test('rejects files over the byte limit before reading them', async () => {
  const input = new Uint8Array(MAX_INPUT_BYTES + 1);
  input.set([0xff, 0xd8, 0xff]);
  await assertRejected(input, 'too-large');
});

Deno.test('rejects anything that is not a JPEG', async () => {
  const png = ImageMagick.read(
    MagickColors.Red,
    10,
    10,
    (image) => image.write(MagickFormat.Png, (data) => data.slice()),
  );
  await assertRejected(png, 'not-jpeg');
  await assertRejected(new TextEncoder().encode('hello'), 'not-jpeg');
  await assertRejected(new Uint8Array(), 'not-jpeg');
});

Deno.test('rejects truncated and damaged JPEGs', async () => {
  const input = await fixture('upright.jpg');
  await assertRejected(input.slice(0, 2000), 'corrupt');
  await assertRejected(input.slice(0, input.length / 2), 'corrupt');

  const damaged = input.slice();
  damaged[40_000] ^= 0xff;
  damaged[40_001] ^= 0xff;
  await assertRejected(damaged, 'corrupt');
});
