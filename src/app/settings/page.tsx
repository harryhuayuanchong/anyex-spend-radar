"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TelegramLink } from "@/components/settings/telegram-link";
import { ReminderList } from "@/components/settings/reminder-list";
import { ReminderForm } from "@/components/settings/reminder-form";

interface Category {
  id: string;
  name: string;
}

interface Reminder {
  id: string;
  vendor: string;
  due_day: number;
  amount: number | null;
  currency: string;
  notes: string | null;
  is_active: boolean;
  category?: { id: string; name: string } | null;
}

export default function SettingsPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    const res = await fetch("/api/reminders");
    if (res.ok) setReminders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, [fetchReminders]);

  async function handleCreate(data: {
    vendor: string;
    due_day: number;
    amount?: number;
    currency?: string;
    category_id?: string;
  }) {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowForm(false);
      fetchReminders();
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    fetchReminders();
  }

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    fetchReminders();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Telegram Binding */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Telegram</h2>
        <TelegramLink />
      </section>

      {/* Payment Reminders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Payment Reminders</h2>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add"}
          </Button>
        </div>

        {showForm && (
          <ReminderForm categories={categories} onSubmit={handleCreate} />
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <ReminderList
            reminders={reminders}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        )}
      </section>
    </div>
  );
}
