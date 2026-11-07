import sharp from "sharp";
import { validateStorageFile } from "./storage-provider";

// Decode and re-encode: remove metadata, appended payloads and unsafe filename extensions.
export async function normalizeImage(input: Buffer, declaredMime: string): Promise<Buffer> {
  const validation = validateStorageFile(input.length, declaredMime);
  if (!validation.valid) throw new Error(validation.error);
  try {
    const image = sharp(input, { limitInputPixels: 25_000_000, failOn: "warning", animated: false });
    const metadata = await image.metadata();
    const mime = ({ jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heif: "image/avif" } as Record<string, string>)[metadata.format];
    if (!mime || mime !== declaredMime || (metadata.pages || 1) > 1 || (metadata.format === "heif" && metadata.compression !== "av1")) throw new Error("Unsupported image");
    const output = await image.rotate().resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer();
    if (!validateStorageFile(output.length, "image/webp").valid) throw new Error("Image is too large");
    return output;
  } catch {
    throw new Error("Please upload a valid, non-animated JPEG, PNG, WebP, or AVIF image (maximum 25 megapixels).");
  }
}
