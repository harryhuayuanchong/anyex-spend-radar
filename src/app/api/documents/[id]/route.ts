import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const { data, error } = await supabase
    .from("documents")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data: doc, error: fetchErr } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 404 });
  }

  // Delete linked expense first (FK constraint)
  await supabase.from("expenses").delete().eq("source_document_id", id);

  // Delete document row
  const { error: delErr } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // Delete from storage (best-effort)
  try {
    const url = new URL(doc.file_url);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
    if (match) {
      await supabase.storage.from("documents").remove([decodeURIComponent(match[1])]);
    }
  } catch {
    // ignore storage cleanup errors
  }

  return NextResponse.json({ ok: true });
}
