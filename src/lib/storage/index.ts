import { StorageProvider } from "./storage-provider";
import { LocalStorageProvider } from "./local-storage-provider";
import { SupabaseStorageProvider } from "./supabase-storage-provider";

let storageProviderInstance: StorageProvider | null = null;

/**
 * Returns the environment-configured StorageProvider instance.
 *
 * Selection behavior:
 * - If STORAGE_PROVIDER="supabase": explicitly use SupabaseStorageProvider.
 * - If STORAGE_PROVIDER="local": explicitly use LocalStorageProvider.
 * - If SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are defined: use SupabaseStorageProvider (staging/production).
 * - Otherwise: fallback to LocalStorageProvider (local development).
 */
export function getStorageProvider(): StorageProvider {
  if (!storageProviderInstance) {
    const hasSupabaseStorageConfig = Boolean(
      process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    );

    if (process.env.STORAGE_PROVIDER === "supabase") {
      storageProviderInstance = new SupabaseStorageProvider();
    } else if (process.env.STORAGE_PROVIDER === "local") {
      storageProviderInstance = new LocalStorageProvider();
    } else if (hasSupabaseStorageConfig) {
      storageProviderInstance = new SupabaseStorageProvider();
    } else {
      storageProviderInstance = new LocalStorageProvider();
    }
  }
  return storageProviderInstance;
}

/**
 * Override or inject a specific StorageProvider instance (useful for unit testing).
 */
export function setStorageProvider(provider: StorageProvider | null): void {
  storageProviderInstance = provider;
}

/**
 * Reset the cached storage provider instance so it will be re-evaluated on next getStorageProvider call.
 */
export function resetStorageProvider(): void {
  storageProviderInstance = null;
}

export * from "./storage-provider";
export * from "./local-storage-provider";
export * from "./supabase-storage-provider";
