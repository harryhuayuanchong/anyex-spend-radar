import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");
  const format = request.nextUrl.searchParams.get("format") || "csv";

  if (!month) {
    return NextResponse.json({ error: "month parameter required" }, { status: 400 });
  }

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*, category:categories(name)")
    .eq("month", month)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "markdown") {
    let md = `# Expense Report — ${month}\n\n`;
    md += `| Date | Vendor | Amount | Category | Payment | Invoice |\n`;
    md += `|------|--------|--------|----------|---------|--------|\n`;

    for (const e of expenses || []) {
      md += `| ${e.date} | ${e.vendor} | ${formatCurrency(e.amount, e.currency)} | ${e.category?.name || "-"} | ${e.payment_method || "-"} | ${e.invoice_id || "-"} |\n`;
    }

    const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
    md += `\n**Total: ${formatCurrency(total)}**\n`;

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="report-${month}.md"`,
      },
    });
  }

  // CSV
  const header = "Date,Vendor,Amount,Currency,Category,Payment Method,Invoice ID,Notes\n";
  const rows = (expenses || [])
    .map(
      (e) =>
        `${e.date},"${e.vendor}",${e.amount},${e.currency},"${e.category?.name || ""}","${e.payment_method || ""}","${e.invoice_id || ""}","${e.notes || ""}"`
    )
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="report-${month}.csv"`,
    },
  });
}
