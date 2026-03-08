import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

// PATCH — Update a reminder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const body = await request.json();

  const { data, error } = await supabase
    .from("payment_reminders")
    .update(body)
    .eq("id", params.id)
    .eq("user_id", userId)
    .select("*, category:categories(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE — Remove a reminder
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const { error } = await supabase
    .from("payment_reminders")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
