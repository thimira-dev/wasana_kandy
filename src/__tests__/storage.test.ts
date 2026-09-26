import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE,
  validateStorageFile,
  LocalStorageProvider,
  SupabaseStorageProvider,
  getStorageProvider,
  resetStorageProvider,
} from "@/lib/storage";

describe("Storage Validation", () => {
  it("allows valid image types under 5MB", () => {
    for (const mimeType of ALLOWED_IMAGE_MIME_TYPES) {
      const result = validateStorageFile(1024 * 1024, mimeType);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it("rejects unsupported MIME types", () => {
    const invalidTypes = ["image/gif", "image/bmp", "application/pdf", "text/plain", "image/svg+xml"];
    for (const mimeType of invalidTypes) {
      const result = validateStorageFile(1024 * 1024, mimeType);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsupported file type");
    }
  });

  it("rejects files exceeding 5MB limit", () => {
    const overLimit = MAX_IMAGE_FILE_SIZE + 1;
    const result = validateStorageFile(overLimit, "image/jpeg");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exceeds the 5MB limit");
  });

  it("accepts a file of exactly 5MB", () => {
    const exactLimit = MAX_IMAGE_FILE_SIZE;
    const result = validateStorageFile(exactLimit, "image/png");
    expect(result.valid).toBe(true);
  });
});

describe("LocalStorageProvider", () => {
  it("implements validateFile adhering to standard rules", () => {
    const provider = new LocalStorageProvider();
    expect(provider.validateFile(1000, "image/jpeg").valid).toBe(true);
    expect(provider.validateFile(MAX_IMAGE_FILE_SIZE + 10, "image/jpeg").valid).toBe(false);
    expect(provider.validateFile(1000, "application/pdf").valid).toBe(false);
  });

  it("uploads buffer to local public uploads and returns path", async () => {
    const provider = new LocalStorageProvider();
    const testBuffer = Buffer.from("test-image-content");
    const url = await provider.upload(testBuffer, "test-cake.jpg", "image/jpeg");

    expect(url).toMatch(/^\/uploads\/test-cake-\d+-[a-z0-9]+\.jpg$/);

    // Clean up
    await provider.delete(url);
  });

  it("safely handles deleting non-local or non-existent files", async () => {
    const provider = new LocalStorageProvider();
    await expect(provider.delete("https://example.com/other.jpg")).resolves.not.toThrow();
    await expect(provider.delete("/uploads/does-not-exist.jpg")).resolves.not.toThrow();
  });
});

describe("SupabaseStorageProvider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws error on instantiation if required environment variables are missing", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => new SupabaseStorageProvider()).toThrow(
      "SupabaseStorageProvider requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  });

  it("implements validateFile adhering to standard rules", () => {
    const mockClient = {
      storage: {
        from: vi.fn(),
      },
    } as unknown as SupabaseClient;

    const provider = new SupabaseStorageProvider({
      supabaseUrl: "https://test.supabase.co",
      supabaseServiceRoleKey: "test-service-key",
      client: mockClient,
    });

    expect(provider.validateFile(1000, "image/webp").valid).toBe(true);
    expect(provider.validateFile(MAX_IMAGE_FILE_SIZE + 1, "image/webp").valid).toBe(false);
    expect(provider.validateFile(1000, "image/gif").valid).toBe(false);
  });

  it("uploads buffer to Supabase Storage bucket and returns public URL", async () => {
    const mockUpload = vi.fn().mockResolvedValue({ data: { path: "cake-123.jpg" }, error: null });
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://xyz.supabase.co/storage/v1/object/public/cake-images/test-cake-123.jpg" },
    });

    const mockClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    } as unknown as SupabaseClient;

    const provider = new SupabaseStorageProvider({
      supabaseUrl: "https://xyz.supabase.co",
      supabaseServiceRoleKey: "secret-key",
      bucketName: "cake-images",
      client: mockClient,
    });

    const buffer = Buffer.from("fake-cake-image");
    const resultUrl = await provider.upload(buffer, "Delicious Cake.png", "image/png");

    expect(mockClient.storage.from).toHaveBeenCalledWith("cake-images");
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^delicious-cake-\d+-[a-z0-9]+\.png$/),
      buffer,
      {
        contentType: "image/png",
        upsert: false,
      }
    );
    expect(resultUrl).toBe("https://xyz.supabase.co/storage/v1/object/public/cake-images/test-cake-123.jpg");
  });

  it("throws error if Supabase upload returns error", async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Bucket not found" },
    });

    const mockClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
        }),
      },
    } as unknown as SupabaseClient;

    const provider = new SupabaseStorageProvider({
      supabaseUrl: "https://xyz.supabase.co",
      supabaseServiceRoleKey: "secret-key",
      client: mockClient,
    });

    const buffer = Buffer.from("fake-cake-image");
    await expect(provider.upload(buffer, "cake.jpg", "image/jpeg")).rejects.toThrow(
      "Supabase Storage upload failed: Bucket not found"
    );
  });

  it("deletes file from Supabase bucket given a public URL", async () => {
    const mockRemove = vi.fn().mockResolvedValue({ data: [], error: null });

    const mockClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockRemove,
        }),
      },
    } as unknown as SupabaseClient;

    const provider = new SupabaseStorageProvider({
      supabaseUrl: "https://xyz.supabase.co",
      supabaseServiceRoleKey: "secret-key",
      bucketName: "cake-images",
      client: mockClient,
    });

    await provider.delete(
      "https://xyz.supabase.co/storage/v1/object/public/cake-images/folder/test-cake.jpg"
    );

    expect(mockClient.storage.from).toHaveBeenCalledWith("cake-images");
    expect(mockRemove).toHaveBeenCalledWith(["folder/test-cake.jpg"]);
  });

  it("safely ignores deletion for non-Supabase external URLs", async () => {
    const mockRemove = vi.fn();
    const mockClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockRemove,
        }),
      },
    } as unknown as SupabaseClient;

    const provider = new SupabaseStorageProvider({
      supabaseUrl: "https://xyz.supabase.co",
      supabaseServiceRoleKey: "secret-key",
      bucketName: "cake-images",
      client: mockClient,
    });

    await provider.delete("https://images.unsplash.com/photo-123");
    expect(mockRemove).not.toHaveBeenCalled();
  });
});

describe("Environment-driven getStorageProvider() Factory", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetStorageProvider();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetStorageProvider();
  });

  it("selects LocalStorageProvider when no Supabase config exists (local dev)", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.STORAGE_PROVIDER;

    const provider = getStorageProvider();
    expect(provider).toBeInstanceOf(LocalStorageProvider);
  });

  it("selects SupabaseStorageProvider when Supabase environment variables exist (deployed staging/prod)", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-role-key";
    delete process.env.STORAGE_PROVIDER;

    const provider = getStorageProvider();
    expect(provider).toBeInstanceOf(SupabaseStorageProvider);
  });

  it("allows forcing LocalStorageProvider with STORAGE_PROVIDER=local even if Supabase env vars exist", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-role-key";
    process.env.STORAGE_PROVIDER = "local";

    const provider = getStorageProvider();
    expect(provider).toBeInstanceOf(LocalStorageProvider);
  });

  it("allows forcing SupabaseStorageProvider with STORAGE_PROVIDER=supabase", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "dummy-service-role-key";
    process.env.STORAGE_PROVIDER = "supabase";

    const provider = getStorageProvider();
    expect(provider).toBeInstanceOf(SupabaseStorageProvider);
  });
});
