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
    // Fire-and-forget: don't block Telegram's webhook
    handleCommand(update.message).catch((err) =>
      console.error("[TG Webhook] Command error:", err)
    );
  }

  // Always respond 200 to Telegram
  return NextResponse.json({ ok: true });
}
