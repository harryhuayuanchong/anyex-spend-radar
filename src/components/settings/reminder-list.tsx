"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Reminder {
  id: string;
  vendor: string;
  due_day: number;
  amount: number | null;
  currency: string;
  is_active: boolean;
  category?: { id: string; name: string } | null;
}

interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export function ReminderList({ reminders, onDelete, onToggle }: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payment reminders set. Add one to get notified on due dates.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {reminders.map((r) => (
        <div
          key={r.id}
          className={`flex items-center justify-between rounded-lg border p-3 ${
            r.is_active ? "" : "opacity-50"
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{r.vendor}</span>
              {r.category?.name && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {r.category.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Due: {r.due_day}th of every month
              {r.amount ? ` · $${Number(r.amount).toFixed(2)} ${r.currency}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(r.id, r.is_active)}
              className="text-xs"
            >
              {r.is_active ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(r.id)}
              className="text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
