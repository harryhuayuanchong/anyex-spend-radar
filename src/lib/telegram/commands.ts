import { supabase } from "@/lib/supabase";
import { sendMessage, type TelegramMessage } from "./bot";
import { formatSummary, formatRecent, formatCategory, formatSearch, formatReminders } from "./formatter";

export async function handleCommand(msg: TelegramMessage) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  // Parse command and args
  const [rawCmd, ...args] = text.split(/\s+/);
  const cmd = rawCmd.toLowerCase().replace(/@\w+$/, ""); // strip bot mention

  switch (cmd) {
    case "/start":
      return handleStart(chatId, args[0], msg);
    case "/summary":
      return handleSummary(chatId, args[0]);
    case "/recent":
      return handleRecent(chatId, parseInt(args[0]) || 5);
    case "/category":
      return handleCategory(chatId, args[0]);
    case "/search":
      return handleSearch(chatId, args.join(" "));
    case "/reminders":
      return handleReminders(chatId);
    case "/unlink":
      return handleUnlink(chatId);
    case "/help":
      return sendMessage(chatId, HELP_TEXT);
    default:
      return sendMessage(chatId, HELP_TEXT);
  }
}

const HELP_TEXT = `<b>Spend Radar Bot</b>

/summary — 本月消費摘要
/summary 2026-02 — 指定月份
/recent — 最近 5 筆消費
/recent 10 — 最近 N 筆
/category — 本月分類統計
/search 關鍵字 — 搜尋供應商
/reminders — 查看繳費提醒
/unlink — 解除綁定`;

// ── /start ───────────────────────────────────────────

async function handleStart(chatId: number, token: string | undefined, msg: TelegramMessage) {
  if (!token) {
    // Check if already linked
    const { data: existing } = await supabase
      .from("telegram_links")
      .select("id")
      .eq("telegram_chat_id", chatId)
      .not("linked_at", "is", null)
      .single();

    if (existing) {
      return sendMessage(chatId, "你已經綁定過了！輸入 /help 查看可用指令。");
    }
    return sendMessage(chatId, "請先從 Spend Radar 網頁取得綁定連結。");
  }

  // Look up the link token
  const { data: link, error } = await supabase
    .from("telegram_links")
    .select("*")
    .eq("link_token", token)
    .is("linked_at", null)
    .single();

  if (error || !link) {
    return sendMessage(chatId, "綁定碼無效或已過期，請重新從網頁產生。");
  }

  // Complete linking
  const { error: updateErr } = await supabase
    .from("telegram_links")
    .update({
      telegram_chat_id: chatId,
      telegram_username: msg.from?.username || null,
      linked_at: new Date().toISOString(),
      link_token: null, // consumed
    })
    .eq("id", link.id);

  if (updateErr) {
    return sendMessage(chatId, "綁定失敗，請稍後再試。");
  }

  return sendMessage(chatId, "✅ 綁定成功！輸入 /help 查看可用指令。");
}

// ── Helper: resolve userId from chatId ───────────────

async function getUserId(chatId: number): Promise<string | null> {
  const { data } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .not("linked_at", "is", null)
    .single();
  return data?.user_id || null;
}

// ── /summary ─────────────────────────────────────────

async function handleSummary(chatId: number, monthArg?: string) {
  const userId = await getUserId(chatId);
  if (!userId) return sendMessage(chatId, "請先綁定帳號。");

  const month = monthArg || currentMonth();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, category:categories(name, color)")
    .eq("user_id", userId)
    .eq("month", month);

  return sendMessage(chatId, formatSummary(month, expenses || []));
}

// ── /recent ──────────────────────────────────────────

async function handleRecent(chatId: number, limit: number) {
  const userId = await getUserId(chatId);
  if (!userId) return sendMessage(chatId, "請先綁定帳號。");

  const safeLimit = Math.min(Math.max(limit, 1), 20);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, category:categories(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(safeLimit);

  return sendMessage(chatId, formatRecent(expenses || []));
}

// ── /category ────────────────────────────────────────

async function handleCategory(chatId: number, monthArg?: string) {
  const userId = await getUserId(chatId);
  if (!userId) return sendMessage(chatId, "請先綁定帳號。");

  const month = monthArg || currentMonth();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, category:categories(name)")
    .eq("user_id", userId)
    .eq("month", month);

  return sendMessage(chatId, formatCategory(month, expenses || []));
}

// ── /search ──────────────────────────────────────────

async function handleSearch(chatId: number, keyword: string) {
  const userId = await getUserId(chatId);
  if (!userId) return sendMessage(chatId, "請先綁定帳號。");

  if (!keyword) return sendMessage(chatId, "請提供搜尋關鍵字，例如：/search Spotify");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, category:categories(name)")
    .eq("user_id", userId)
    .ilike("vendor", `%${keyword}%`)
    .order("date", { ascending: false })
    .limit(10);

  return sendMessage(chatId, formatSearch(keyword, expenses || []));
}

// ── /reminders ───────────────────────────────────────

async function handleReminders(chatId: number) {
  const userId = await getUserId(chatId);
  if (!userId) return sendMessage(chatId, "請先綁定帳號。");

  const { data: reminders } = await supabase
    .from("payment_reminders")
    .select("*, category:categories(name)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("due_day", { ascending: true });

  return sendMessage(chatId, formatReminders(reminders || []));
}

// ── /unlink ──────────────────────────────────────────

async function handleUnlink(chatId: number) {
  const { error } = await supabase
    .from("telegram_links")
    .delete()
    .eq("telegram_chat_id", chatId);

  if (error) return sendMessage(chatId, "解除綁定失敗，請稍後再試。");
  return sendMessage(chatId, "❌ 已解除綁定。如需重新綁定，請至網頁操作。");
}

// ── Utils ────────────────────────────────────────────

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
