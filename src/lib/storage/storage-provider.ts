/**
 * Storage Provider Abstraction
 * Supports swappable storage backends (Local Disk in dev, AWS S3 / Cloudflare R2 / GCS in production).
 */

export interface StorageValidationResult {
  valid: boolean;
  error?: string;
}

export interface StorageProvider {
  /**
   * Save a file buffer to storage and return its public URL or path.
   */
  upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;

  /**
   * Delete an existing file from storage by URL/path.
   */
  delete(fileUrl: string): Promise<void>;

  /**
   * Validate file size and MIME type.
   */
  validateFile(size: number, mimeType: string): StorageValidationResult;
}

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateStorageFile(size: number, mimeType: string): StorageValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported file type "${mimeType}". Allowed types: JPEG, PNG, WEBP, AVIF.`,
    };
  }

  if (size > MAX_IMAGE_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the 5MB limit (provided: ${(size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  return { valid: true };
}

