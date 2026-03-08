import { NextRequest, NextResponse } from "next/server";
import { handleCommand } from "@/lib/telegram/commands";
import type { TelegramUpdate } from "@/lib/telegram/bot";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update: TelegramUpdate = await request.json();

  if (update.message?.text) {
    try {
      await handleCommand(update.message);
    } catch (err) {
      console.error("[TG Webhook] Command error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
