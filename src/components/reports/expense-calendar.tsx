"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DayBreakdown, DayExpenseItem } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function heatClass(amount: number, max: number): string {
  if (amount === 0) return "bg-muted/50";
  const ratio = amount / max;
  if (ratio > 0.75) return "bg-teal-500 text-white";
  if (ratio > 0.5) return "bg-teal-400 text-white";
  if (ratio > 0.25) return "bg-teal-300 text-teal-900";
  return "bg-teal-200 text-teal-900";
}

interface DayCell {
  day: number;
  total: number;
  count: number;
  items: DayExpenseItem[];
}

interface ExpenseCalendarProps {
  month: string; // "YYYY-MM"
  byDay: DayBreakdown[];
}

export function ExpenseCalendar({ month, byDay }: ExpenseCalendarProps) {
  const { days, maxAmount } = useMemo(() => {
    const [year, mon] = month.split("-").map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    const dayTotals = new Map<number, DayBreakdown>();
    for (const d of byDay) {
      const dayNum = new Date(d.date).getUTCDate();
      dayTotals.set(dayNum, d);
    }

    let max = 0;
    const result: DayCell[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const entry = dayTotals.get(d);
      const total = entry?.total ?? 0;
      if (total > max) max = total;
      result.push({ day: d, total, count: entry?.count ?? 0, items: entry?.items ?? [] });
    }

    return { days: result, maxAmount: max };
  }, [month, byDay]);

  // Monday = 0 ... Sunday = 6 (ISO weekday)
  const [year, mon] = month.split("-").map(Number);
  const firstDayOfWeek = ((new Date(year, mon - 1, 1).getDay() + 6) % 7); // 0=Mon
  const leadingBlanks = firstDayOfWeek;

  if (byDay.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No expenses this month
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {wd}
            </div>
          ))}

          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {days.map((d) => (
            <div
              key={d.day}
              className={`group relative rounded-md p-1.5 text-center text-xs cursor-default ${heatClass(d.total, maxAmount)}`}
            >
              <div className="font-medium">{d.day}</div>
              {d.total > 0 && (
                <div className="text-[10px] leading-tight truncate">
                  {formatCurrency(d.total)}
                </div>
              )}

              {d.items.length > 0 && (
                <div className="invisible group-hover:visible absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-50 w-56 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
                  <p className="mb-1.5 text-xs font-semibold text-left">
                    {month}-{String(d.day).padStart(2, "0")}
                  </p>
                  <ul className="space-y-1 text-left">
                    {d.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate">{item.vendor}</span>
                        <span className="shrink-0 font-medium">{formatCurrency(item.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
