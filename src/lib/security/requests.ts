import { NextResponse } from "next/server";

export class RequestSecurityError extends Error {
  constructor(message: string, public readonly status = 400, public readonly retryAfter?: number) { super(message); }
}

export function assertSameOrigin(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.APP_URL) {
    throw new RequestSecurityError("Application origin is not configured.", 503);
  }
  const expected = new URL(process.env.APP_URL || request.url).origin;
  const origin = request.headers.get("origin");
  if (origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestSecurityError("This request must come from this website.", 403);
  }
}

export async function readBoundedBody(request: Request, maxBytes = 32 * 1024): Promise<Uint8Array> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) {
    throw new RequestSecurityError("Request body is too large.", 413);
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestSecurityError("Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function readJson(request: Request, maxBytes = 32 * 1024): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new RequestSecurityError("Expected a JSON request.", 415);
  }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedBody(request, maxBytes))); }
  catch (error) {
    if (error instanceof RequestSecurityError) throw error;
    throw new RequestSecurityError("Invalid JSON request.");
  }
}

export async function readForm(request: Request, maxBytes: number): Promise<FormData> {
  const bytes = await readBoundedBody(request, maxBytes);
  try { return await new Response(bytes as BodyInit, { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData(); }
  catch { throw new RequestSecurityError("Invalid form submission."); }
}

export function securityErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof RequestSecurityError)) return null;
  return NextResponse.json({ error: error.message }, { status: error.status,
    headers: { "Cache-Control": "no-store", ...(error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) } });
}
