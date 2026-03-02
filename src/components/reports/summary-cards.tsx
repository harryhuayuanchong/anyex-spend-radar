"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, Tags, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ReportData } from "@/lib/types";

interface SummaryCardsProps {
  data: ReportData;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const avgExpense = data.count > 0 ? data.total / data.count : 0;
  const topCategory = data.by_category[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Total Spent
          </CardTitle>
          <DollarSign className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(data.total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Transactions
          </CardTitle>
          <Receipt className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data.count}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Avg. Expense
          </CardTitle>
          <CreditCard className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(avgExpense)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Top Category
          </CardTitle>
          <Tags className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {topCategory?.category_name || "—"}
          </p>
          {topCategory && (
            <p className="text-xs text-gray-500">
              {formatCurrency(topCategory.total)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
