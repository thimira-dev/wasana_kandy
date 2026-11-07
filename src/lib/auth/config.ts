export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || /^(your-|change[_-]?me|wasana-dev-secret)/i.test(secret)) {
    throw new Error("Configure AUTH_SECRET with a random secret of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export function validateDeploymentConfig() {
  getAuthSecret();
  if (process.env.NODE_ENV !== "production") return;
  const value = process.env.APP_URL;
  if (!value) throw new Error("APP_URL is required in production.");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("APP_URL must be a canonical HTTPS origin.");
  }
}
