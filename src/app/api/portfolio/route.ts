import { admin, syncConfigured } from "@/lib/sync-server";

// GET  -> the stored portfolio document (or null when empty / sync off)
// PUT  -> upsert the full portfolio document
// No login: the deployed URL is the only gate — don't share it publicly.
export async function GET() {
  if (!admin) return Response.json({ data: null, sync: false });
  const { data } = await admin.from("portfolio_doc").select("data").eq("id", "me").maybeSingle();
  return Response.json({ data: data?.data ?? null, sync: true });
}

export async function PUT(req: Request) {
  if (!admin) return Response.json({ ok: false, sync: false }, { status: 501 });
  const body = await req.json();
  const { error } = await admin
    .from("portfolio_doc")
    .upsert({ id: "me", data: body, updated_at: new Date().toISOString() });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export const dynamic = "force-dynamic";
