import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendMessage } from "@/lib/telegram/bot";
import { formatPaymentNotification } from "@/lib/telegram/formatter";

// POST — Cron-triggered daily payment reminder notifications
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dueDay = today.getDate();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  // Find active reminders for today's due_day
  const { data: reminders, error } = await supabase
    .from("payment_reminders")
    .select("*, category:categories(name)")
    .eq("due_day", dueDay)
    .eq("is_active", true);

  if (error || !reminders?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const reminder of reminders) {
    // Get TG chat_id for this user
    const { data: link } = await supabase
      .from("telegram_links")
      .select("telegram_chat_id")
      .eq("user_id", reminder.user_id)
      .not("linked_at", "is", null)
      .single();

    if (!link) continue;

    // Find last payment to this vendor (optional context)
    const { data: lastPayments } = await supabase
      .from("expenses")
      .select("date, amount, currency")
      .eq("user_id", reminder.user_id)
      .ilike("vendor", `%${reminder.vendor}%`)
      .eq("month", lastMonthStr)
      .order("date", { ascending: false })
      .limit(1);

    const lastPayment = lastPayments?.[0] || undefined;

    const text = formatPaymentNotification(reminder, lastPayment);

    try {
      await sendMessage(link.telegram_chat_id, text);
      sent++;
    } catch (err) {
      console.error(`[TG Notify] Failed for user ${reminder.user_id}:`, err);
    }
  }

  return NextResponse.json({ sent, total: reminders.length });
}
