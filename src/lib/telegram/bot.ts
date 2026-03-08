const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(
  chatId: number | string,
  text: string,
  parseMode: "MarkdownV2" | "HTML" = "HTML"
) {
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.json();
}

export async function setWebhook(url: string, secret: string) {
  const res = await fetch(`${API_BASE}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: secret,
    }),
  });
  return res.json();
}

// Telegram Update types (subset)
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    username?: string;
    first_name: string;
  };
  chat: {
    id: number;
    type: string;
  };
  text?: string;
  date: number;
}
