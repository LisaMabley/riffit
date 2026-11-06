// POST a JPEG; responds with the versions it made. For now it only reports them: storing them
// comes with image posts (#7).
import { processImage, RejectedImage } from './process.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });

  try {
    const versions = await processImage(new Uint8Array(await request.arrayBuffer()));
    return Response.json({
      versions: versions.map(({ name, width, height, data }) => ({
        name,
        width,
        height,
        bytes: data.length,
      })),
    });
  } catch (error) {
    if (error instanceof RejectedImage) {
      console.warn(error.message);
      return Response.json({ error: error.reason }, { status: 422 });
    }
    throw error;
  }
});
