import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  StorageProvider,
  StorageValidationResult,
  validateStorageFile,
} from "./storage-provider";

export interface SupabaseStorageProviderOptions {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  bucketName?: string;
  client?: SupabaseClient;
}

export class SupabaseStorageProvider implements StorageProvider {
  private client: SupabaseClient;
  private bucket: string;

  constructor(options?: SupabaseStorageProviderOptions) {
    const supabaseUrl = options?.supabaseUrl || process.env.SUPABASE_URL;
    const supabaseKey = options?.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = options?.bucketName || process.env.SUPABASE_STORAGE_BUCKET || "cake-images";

    if (options?.client) {
      this.client = options.client;
    } else {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error(
          "SupabaseStorageProvider requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
        );
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  validateFile(size: number, mimeType: string): StorageValidationResult {
    return validateStorageFile(size, mimeType);
  }

  async upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const validation = this.validateFile(fileBuffer.length, mimeType);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid file");
    }

    // Sanitize filename and create unique timestamped name
    const ext = path.extname(fileName) || this.getExtensionFromMimeType(mimeType);
    const baseName = path
      .basename(fileName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .substring(0, 50);

    const uniqueName = `${baseName || "cake"}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = uniqueName;

    const { error: uploadError } = await this.client.storage
      .from(this.bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to retrieve public URL from Supabase Storage");
    }

    return publicUrlData.publicUrl;
  }

  async delete(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
      let pathInBucket = fileUrl;
      const publicPrefix = `/storage/v1/object/public/${this.bucket}/`;
      const publicPrefixIdx = fileUrl.indexOf(publicPrefix);

      if (publicPrefixIdx !== -1) {
        pathInBucket = fileUrl.substring(publicPrefixIdx + publicPrefix.length);
      } else if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
        // External URL not belonging to this Supabase bucket
        return;
      }

      // Strip any query parameters
      pathInBucket = pathInBucket.split("?")[0];
      pathInBucket = decodeURIComponent(pathInBucket);

      if (!pathInBucket) return;

      const { error } = await this.client.storage
        .from(this.bucket)
        .remove([pathInBucket]);

      if (error) {
        console.error("Supabase Storage delete failed:", error.message);
      }
    } catch (err) {
      console.error("Failed to delete file from Supabase Storage:", err);
    }
  }

  private getExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/avif":
        return ".avif";
      case "image/jpeg":
      default:
        return ".jpg";
    }
  }
}
