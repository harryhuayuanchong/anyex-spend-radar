import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import type { ReportData, CategoryBreakdown, PaymentMethodBreakdown, VendorBreakdown, DayBreakdown, DayExpenseItem } from "@/lib/types";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const month = request.nextUrl.searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  // Fetch expenses for the month with category join
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*, category:categories(id, name, color)")
    .eq("user_id", userId)
    .eq("month", month);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expenses || expenses.length === 0) {
    const report: ReportData = {
      month,
      total: 0,
      count: 0,
      by_category: [],
      by_payment_method: [],
      top_vendors: [],
      by_day: [],
    };
    return NextResponse.json(report);
  }

  // Aggregate totals
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // By category
  const catMap = new Map<string, CategoryBreakdown>();
  for (const e of expenses) {
    const catId = e.category_id || "uncategorized";
    const catName = e.category?.name || "Uncategorized";
    const catColor = e.category?.color || "#9CA3AF";
    const existing = catMap.get(catId) || {
      category_id: catId,
      category_name: catName,
      color: catColor,
      total: 0,
      count: 0,
    };
    existing.total += Number(e.amount);
    existing.count += 1;
    catMap.set(catId, existing);
  }

  // By payment method
  const pmMap = new Map<string, PaymentMethodBreakdown>();
  for (const e of expenses) {
    const pm = e.payment_method || "Unknown";
    const existing = pmMap.get(pm) || { payment_method: pm, total: 0, count: 0 };
    existing.total += Number(e.amount);
    existing.count += 1;
    pmMap.set(pm, existing);
  }

  // Top vendors
  const vendorMap = new Map<string, VendorBreakdown>();
  for (const e of expenses) {
    const existing = vendorMap.get(e.vendor) || { vendor: e.vendor, total: 0, count: 0 };
    existing.total += Number(e.amount);
    existing.count += 1;
    vendorMap.set(e.vendor, existing);
  }

  // By day
  const dayMap = new Map<string, DayBreakdown>();
  for (const e of expenses) {
    const existing = dayMap.get(e.date) || { date: e.date, total: 0, count: 0, items: [] as DayExpenseItem[] };
    existing.total += Number(e.amount);
    existing.count += 1;
    existing.items.push({ vendor: e.vendor, amount: Number(e.amount) });
    dayMap.set(e.date, existing);
  }

  const report: ReportData = {
    month,
    total,
    count: expenses.length,
    by_category: Array.from(catMap.values()).sort((a, b) => b.total - a.total),
    by_payment_method: Array.from(pmMap.values()).sort((a, b) => b.total - a.total),
    top_vendors: Array.from(vendorMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10),
    by_day: Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };

  return NextResponse.json(report);
}
