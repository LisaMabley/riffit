// Turns a photo the app uploaded into the versions we store: re-encoded in sRGB with no metadata,
// at full size and at feed sizes (spec §9). The app has already converted it to a JPEG no larger
// than PHOTO_MAX_LONG_SIDE, so this stays well inside the Edge Function CPU limit (spec §16).
import {
  ColorProfile,
  ColorTransformMode,
  FilterType,
  type IMagickImage,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
  MagickImage,
  MagickImageInfo,
  MagickReadSettings,
} from '@imagemagick/magick-wasm';
import { PHOTO_MAX_LONG_SIDE } from '../../../packages/core/src/limits.ts';
import { srgbProfile } from './srgb-profile.ts';

// A 2048px JPEG from the app is well under 2MB, so anything this big wasn't made by the app.
export const MAX_INPUT_BYTES = 8 * 1024 * 1024;

// Placeholders until the feed is built (#9).
export const FEED_SIZES = [1024, 512] as const;

const QUALITY = 82;

export type RejectionReason = 'not-jpeg' | 'too-large' | 'corrupt';

export class RejectedImage extends Error {
  constructor(readonly reason: RejectionReason, detail?: string) {
    super(detail ? `${reason}: ${detail}` : reason);
  }
}

export type ImageVersion = {
  name: 'full' | `feed-${(typeof FEED_SIZES)[number]}`;
  width: number;
  height: number;
  data: Uint8Array;
};

let ready: Promise<void> | undefined;

// Exported for tests, which also use ImageMagick to build inputs.
export function initialize(): Promise<void> {
  ready ??= Deno.readFile(
    new URL(import.meta.resolve('@imagemagick/magick-wasm/magick.wasm')),
  ).then(initializeImageMagick);
  return ready;
}

export async function processImage(input: Uint8Array): Promise<ImageVersion[]> {
  if (input.length > MAX_INPUT_BYTES) throw new RejectedImage('too-large', `${input.length} bytes`);
  // Every JPEG starts with an SOI marker. Checking it here keeps other formats away from
  // ImageMagick entirely; the reader below is also told to decode only JPEG.
  if (input[0] !== 0xff || input[1] !== 0xd8 || input[2] !== 0xff) {
    throw new RejectedImage('not-jpeg');
  }

  await initialize();
  const settings = new MagickReadSettings({ format: MagickFormat.Jpeg });

  // Read the header only, so an oversized image is rejected before it's decoded.
  let info;
  try {
    info = MagickImageInfo.create(input, settings);
  } catch (error) {
    throw new RejectedImage('corrupt', (error as Error).message);
  }
  if (Math.max(info.width, info.height) > PHOTO_MAX_LONG_SIDE) {
    throw new RejectedImage('too-large', `${info.width}x${info.height}`);
  }

  const image = MagickImage.create();
  try {
    // libjpeg reports truncated or damaged data as warnings and decodes what it can, leaving
    // the rest grey. Reject instead.
    const warnings: string[] = [];
    image.onWarning = (event) => {
      warnings.push(event.error.message);
      return 0;
    };
    try {
      image.read(input, settings);
    } catch (error) {
      throw new RejectedImage('corrupt', (error as Error).message);
    }
    if (warnings.length > 0) throw new RejectedImage('corrupt', warnings.join('; '));

    // Order matters: orientation and the color profile are metadata, so apply them before
    // stripping. Converting to sRGB keeps colors right in viewers that ignore profiles. Quantum
    // mode takes about 0.2 s on a 2048px photo; HighRes takes about 1.7 s, most of the CPU budget.
    image.autoOrient();
    image.transformColorSpace(new ColorProfile(srgbProfile), ColorTransformMode.Quantum);
    image.strip();
    image.quality = QUALITY;
    // Each feed size halves the one before, and for halving, a box filter (averaging 2x2 blocks)
    // looks as good as the default Lanczos at a third of the CPU time.
    image.filterType = FilterType.Box;

    const versions: ImageVersion[] = [encode(image, 'full')];
    for (const size of FEED_SIZES) {
      const geometry = new MagickGeometry(size, size);
      geometry.greater = true; // Only shrink, never enlarge.
      image.resize(geometry);
      versions.push(encode(image, `feed-${size}`));
    }
    return versions;
  } finally {
    image.dispose();
  }
}

function encode(image: IMagickImage, name: ImageVersion['name']): ImageVersion {
  const data = image.write(MagickFormat.Jpeg, (bytes) => bytes.slice());
  return { name, width: image.width, height: image.height, data };
}
