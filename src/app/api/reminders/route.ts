import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

// GET — List all reminders for current user
export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const { data, error } = await supabase
    .from("payment_reminders")
    .select("*, category:categories(id, name)")
    .eq("user_id", userId)
    .order("due_day", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — Create a new reminder
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const body = await request.json();
  const { vendor, due_day, amount, currency, category_id, notes } = body;

  if (!vendor || !due_day || due_day < 1 || due_day > 31) {
    return NextResponse.json({ error: "vendor and due_day (1-31) required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("payment_reminders")
    .insert({
      user_id: userId,
      vendor,
      due_day,
      amount: amount || null,
      currency: currency || "USD",
      category_id: category_id || null,
      notes: notes || null,
    })
    .select("*, category:categories(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
