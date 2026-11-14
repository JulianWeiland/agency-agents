import { head, put } from "@vercel/blob";

/**
 * Lana's chosen kingdom — best-effort delivery to Julian.
 *
 * POST {id, choice}  → stores a tiny JSON in Vercel Blob when BLOB_READ_WRITE_TOKEN is set → {stored:true}
 *                      otherwise 503 {stored:false} (the client then keeps the choice locally and offers "Share").
 * GET  ?key=OWNER_KEY → the latest stored choice (401 on a wrong key, 404 when OWNER_KEY is not configured).
 *
 * This route never throws to the client.
 */

export const runtime = "nodejs";

type Kingdom = "sea" | "balance";

interface ChoiceRecord {
  choice: Kingdom;
  id: string;
  at: string;
}

const LATEST = "choices/latest.json";
const NO_STORE = { "Cache-Control": "no-store" } as const;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

function isKingdom(v: unknown): v is Kingdom {
  return v === "sea" || v === "balance";
}

/** opaque client id: 1–64 chars, safe as a blob path segment */
function isValidId(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown;
    try {
      const raw = await request.text();
      if (raw.length > 2048) return json({ stored: false, error: "too_large" }, 413);
      body = JSON.parse(raw);
    } catch {
      return json({ stored: false, error: "invalid_json" }, 400);
    }
    const { id, choice } = (body ?? {}) as { id?: unknown; choice?: unknown };
    if (!isValidId(id) || !isKingdom(choice)) {
      return json({ stored: false, error: "invalid_payload" }, 400);
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return json({ stored: false }, 503);

    const record: ChoiceRecord = { choice, id, at: new Date().toISOString() };
    const payload = JSON.stringify(record);
    const options = {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
      token,
    } as const;

    const results = await Promise.allSettled([
      put(`choices/${id}.json`, payload, options),
      put(LATEST, payload, options),
    ]);
    const stored = results.some((r) => r.status === "fulfilled");
    if (!stored) {
      console.error("[api/choice] blob put failed", results);
      return json({ stored: false }, 503);
    }
    return json({ stored: true });
  } catch (err) {
    console.error("[api/choice] POST failed", err);
    return json({ stored: false }, 503);
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const ownerKey = process.env.OWNER_KEY;
    if (!ownerKey) return json({ error: "not_found" }, 404);

    const key = new URL(request.url).searchParams.get("key") ?? "";
    if (!safeEqual(key, ownerKey)) return json({ error: "unauthorized" }, 401);

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return json({ latest: null, configured: false });

    try {
      const meta = await head(LATEST, { token });
      const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return json({ latest: null, configured: true });
      const data = (await res.json()) as Partial<ChoiceRecord>;
      if (!isKingdom(data.choice)) return json({ latest: null, configured: true });
      return json({
        latest: { choice: data.choice, id: String(data.id ?? ""), at: String(data.at ?? "") },
        configured: true,
      });
    } catch {
      // nothing stored yet (BlobNotFoundError) or a transient blob error
      return json({ latest: null, configured: true });
    }
  } catch (err) {
    console.error("[api/choice] GET failed", err);
    return json({ latest: null, error: "unavailable" }, 503);
  }
}
