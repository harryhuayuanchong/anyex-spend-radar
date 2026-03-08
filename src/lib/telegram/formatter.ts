// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expense = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reminder = Record<string, any>;

export function formatSummary(month: string, expenses: Expense[]): string {
  if (expenses.length === 0) {
    return `📊 <b>${month} 消費摘要</b>\n\n尚無消費記錄。`;
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Group by category
  const catMap = new Map<string, { name: string; total: number; count: number }>();
  for (const e of expenses) {
    const name = e.category?.name || "Uncategorized";
    const existing = catMap.get(name) || { name, total: 0, count: 0 };
    existing.total += Number(e.amount);
    existing.count += 1;
    catMap.set(name, existing);
  }

  const cats = Array.from(catMap.values()).sort((a, b) => b.total - a.total);
  const catLines = cats
    .map((c) => {
      const pct = ((c.total / total) * 100).toFixed(1);
      return `  • ${c.name}  $${c.total.toFixed(2)} (${pct}%)`;
    })
    .join("\n");

  return `📊 <b>${month} 消費摘要</b>

💰 總支出：<b>$${total.toFixed(2)}</b>
📝 筆數：${expenses.length} 筆

📁 分類明細：
${catLines}`;
}

export function formatRecent(expenses: Expense[]): string {
  if (expenses.length === 0) {
    return "📋 尚無消費記錄。";
  }

  const lines = expenses.map((e) => {
    const cat = e.category?.name ? ` [${e.category.name}]` : "";
    return `• ${e.date}  <b>${e.vendor}</b>  $${Number(e.amount).toFixed(2)}${cat}`;
  });

  return `📋 <b>最近 ${expenses.length} 筆消費</b>\n\n${lines.join("\n")}`;
}

export function formatCategory(month: string, expenses: Expense[]): string {
  if (expenses.length === 0) {
    return `📁 <b>${month} 分類統計</b>\n\n尚無消費記錄。`;
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const catMap = new Map<string, number>();
  for (const e of expenses) {
    const name = e.category?.name || "Uncategorized";
    catMap.set(name, (catMap.get(name) || 0) + Number(e.amount));
  }

  const lines = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, amt]) => {
      const pct = ((amt / total) * 100).toFixed(1);
      const bar = "█".repeat(Math.max(1, Math.round((amt / total) * 10)));
      return `${bar} ${name}  $${amt.toFixed(2)} (${pct}%)`;
    });

  return `📁 <b>${month} 分類統計</b>\n\n💰 總計：$${total.toFixed(2)}\n\n${lines.join("\n")}`;
}

export function formatSearch(keyword: string, expenses: Expense[]): string {
  if (expenses.length === 0) {
    return `🔍 找不到「${keyword}」相關記錄。`;
  }

  const lines = expenses.map(
    (e) => `• ${e.date}  <b>${e.vendor}</b>  $${Number(e.amount).toFixed(2)}`
  );

  return `🔍 搜尋「${keyword}」結果（${expenses.length} 筆）\n\n${lines.join("\n")}`;
}

export function formatReminders(reminders: Reminder[]): string {
  if (reminders.length === 0) {
    return "⏰ 尚未設定繳費提醒。\n請至網頁設定頁新增。";
  }

  const lines = reminders.map((r) => {
    const amt = r.amount ? `  $${Number(r.amount).toFixed(2)}` : "";
    const cat = r.category?.name ? `  [${r.category.name}]` : "";
    return `• 每月 ${r.due_day} 號 — <b>${r.vendor}</b>${amt}${cat}`;
  });

  return `⏰ <b>繳費提醒</b>\n\n${lines.join("\n")}`;
}

export function formatPaymentNotification(reminder: Reminder, lastPayment?: Expense): string {
  let text = `⏰ <b>繳費提醒</b>\n\n今天是 <b>${reminder.vendor}</b> 的繳費日！`;

  if (reminder.amount) {
    text += `\n預期金額：$${Number(reminder.amount).toFixed(2)} ${reminder.currency || "USD"}`;
  }
  if (reminder.category?.name) {
    text += `\n分類：${reminder.category.name}`;
  }

  if (lastPayment) {
    text += `\n\n📌 上期繳費：${lastPayment.date} $${Number(lastPayment.amount).toFixed(2)} ✅`;
  }

  return text;
}
