import { admin } from "@/lib/sync-server";

// GET  -> the stored portfolio document plus the version token to write against
// PUT  -> { data, baseUpdatedAt } — writes only if the stored version still
//         matches, so a device holding a stale document can't erase a newer one.
// No login: the deployed URL is the only gate — don't share it publicly.

const DOC_ID = "me";

async function current() {
  const { data } = await admin!
    .from("portfolio_doc")
    .select("data, updated_at")
    .eq("id", DOC_ID)
    .maybeSingle();
  return { data: data?.data ?? null, updatedAt: data?.updated_at ?? null };
}

export async function GET() {
  if (!admin) return Response.json({ data: null, sync: false });
  return Response.json({ ...(await current()), sync: true });
}

export async function PUT(req: Request) {
  if (!admin) return Response.json({ ok: false, sync: false }, { status: 501 });

  const body = await req.json().catch(() => null);
  const doc = body?.data;
  // Unauthenticated endpoint — reject anything that isn't a portfolio document
  // rather than letting a malformed body overwrite the real one.
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.snapshots)) {
    return Response.json({ ok: false, error: "not a portfolio document" }, { status: 400 });
  }

  // An empty document must never replace a real one — that is how a live
  // portfolio gets erased by a device that started from a blank slate.
  if (doc.snapshots.length === 0) {
    const stored = await current();
    if (stored.data?.snapshots?.length) {
      return Response.json({ ok: false, conflict: true, ...stored }, { status: 409 });
    }
  }

  const updatedAt = new Date().toISOString();
  const base: string | null = body.baseUpdatedAt ?? null;

  // ponytail: updated_at doubles as the version token — it round-trips through
  // PostgREST as the same instant. A monotonic `rev` column if that ever bites.
  const { data: written, error } = base
    ? await admin
        .from("portfolio_doc")
        .update({ data: doc, updated_at: updatedAt })
        .eq("id", DOC_ID)
        .eq("updated_at", base)
        .select("id")
    : await admin.from("portfolio_doc").insert({ id: DOC_ID, data: doc, updated_at: updatedAt }).select("id");

  if (!error && written?.length) return Response.json({ ok: true, updatedAt });

  // Nothing written: the row moved on under us, or the insert hit an existing
  // row. Hand back what's stored so the caller can adopt it instead of retrying.
  const stored = await current();
  if (error && !stored.updatedAt) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: false, conflict: true, ...stored }, { status: 409 });
}

export const dynamic = "force-dynamic";
