"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}

interface ReminderFormProps {
  categories: Category[];
  onSubmit: (data: {
    vendor: string;
    due_day: number;
    amount?: number;
    currency?: string;
    category_id?: string;
  }) => void;
}

export function ReminderForm({ categories, onSubmit }: ReminderFormProps) {
  const [vendor, setVendor] = useState("");
  const [dueDay, setDueDay] = useState(1);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [categoryId, setCategoryId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor || !dueDay) return;
    onSubmit({
      vendor,
      due_day: dueDay,
      amount: amount ? parseFloat(amount) : undefined,
      currency,
      category_id: categoryId || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Vendor *</label>
          <input
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. Spotify"
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Due Day *</label>
          <input
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Currency</label>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">-- None --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm">
        Add Reminder
      </Button>
    </form>
  );
}
