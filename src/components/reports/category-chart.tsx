"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { CategoryBreakdown } from "@/lib/types";

interface CategoryChartProps {
  data: CategoryBreakdown[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-gray-400">
            No data for this month
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => formatCurrency(v)}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="category_name"
              width={100}
              fontSize={12}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
