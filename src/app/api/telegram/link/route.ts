import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { randomBytes } from "crypto";

// POST — Generate a one-time link token for TG binding
export async function POST() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const token = `sr_${randomBytes(16).toString("hex")}`;

  // Upsert: if user already has a row, refresh token
  const { data, error } = await supabase
    .from("telegram_links")
    .upsert(
      {
        user_id: userId,
        link_token: token,
        linked_at: null,
        telegram_chat_id: 0, // placeholder, will be set on link
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "SpendRadarBot";

  return NextResponse.json({
    token,
    link_url: `https://t.me/${botUsername}?start=${token}`,
    existing: data,
  });
}

// GET — Check current TG link status
export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const { data, error } = await supabase
    .from("telegram_links")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    linked: !!(data?.linked_at),
    telegram_username: data?.telegram_username || null,
    linked_at: data?.linked_at || null,
  });
}

// DELETE — Remove TG link
export async function DELETE() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  await supabase
    .from("telegram_links")
    .delete()
    .eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
