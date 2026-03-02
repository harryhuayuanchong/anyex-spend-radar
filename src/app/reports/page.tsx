"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/reports/month-picker";
import { SummaryCards } from "@/components/reports/summary-cards";
import { CategoryChart } from "@/components/reports/category-chart";
import { VendorTable } from "@/components/reports/vendor-table";
import type { ReportData } from "@/lib/types";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [month]);

  const handleExport = (format: "csv" | "markdown") => {
    window.open(`/api/reports/export?month=${month}&format=${format}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monthly Report</h1>
          <p className="text-sm text-gray-500">
            Spending breakdown and trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker month={month} onChange={setMonth} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
          >
            <Download className="mr-1 h-3 w-3" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("markdown")}
          >
            <Download className="mr-1 h-3 w-3" />
            MD
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-400">Loading...</p>
      ) : report ? (
        <div className="space-y-6">
          <SummaryCards data={report} />
          <CategoryChart data={report.by_category} />
          <VendorTable data={report.top_vendors} />
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-gray-400">
          No data available
        </p>
      )}
    </div>
  );
}
