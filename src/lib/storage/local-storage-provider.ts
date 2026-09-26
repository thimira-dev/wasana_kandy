import fs from "fs/promises";
import path from "path";
import {
  StorageProvider,
  StorageValidationResult,
  validateStorageFile,
} from "./storage-provider";

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
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

    await this.ensureDir();

    // Sanitize filename and create unique timestamped name
    const ext = path.extname(fileName) || ".jpg";
    const baseName = path
      .basename(fileName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .substring(0, 50);

    const uniqueName = `${baseName}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(filePath, fileBuffer);

    // Return public URL path served by Next.js from public/
    return `/uploads/${uniqueName}`;
  }

  async delete(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith("/uploads/")) return;
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);

    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
