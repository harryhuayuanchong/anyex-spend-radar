"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Document, Category, ExtractedData } from "@/lib/types";

interface ExtractionEditorProps {
  document: Document;
  categories: Category[];
  onSaved: () => void;
}

export function ExtractionEditor({
  document: doc,
  categories,
  onSaved,
}: ExtractionEditorProps) {
  const extracted = doc.extracted_json || ({} as Partial<ExtractedData>);

  const [vendor, setVendor] = useState(extracted.vendor || "");
  const [date, setDate] = useState(extracted.date || "");
  const [amount, setAmount] = useState(String(extracted.amount || ""));
  const [currency, setCurrency] = useState(extracted.currency || "USD");
  const [invoiceId, setInvoiceId] = useState(extracted.invoice_id || "");
  const [paymentMethod, setPaymentMethod] = useState(
    extracted.payment_method || ""
  );
  const [notes, setNotes] = useState(extracted.notes || "");
  const [categoryId, setCategoryId] = useState("");
  const [saveAsRule, setSaveAsRule] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!vendor || !date || !amount) {
      toast.error("Vendor, date, and amount are required");
      return;
    }

    setSaving(true);
    try {
      // Update document extracted_json
      const updatedJson: ExtractedData = {
        vendor,
        date,
        amount: parseFloat(amount),
        currency,
        invoice_id: invoiceId || undefined,
        payment_method: paymentMethod || undefined,
        notes: notes || undefined,
      };

      await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted_json: updatedJson,
          status: "extracted",
        }),
      });

      // Trigger re-categorization by processing
      const res = await fetch(`/api/documents/${doc.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skip_extraction: true,
          category_id: categoryId || undefined,
          save_rule: saveAsRule,
        }),
      });

      if (!res.ok) throw new Error("Failed to post");

      toast.success("Saved & posted");
      onSaved();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-white p-6">
      <h3 className="font-semibold">Edit Extraction</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            maxLength={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invoice">Invoice ID</Label>
          <Input
            id="invoice"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="payment">Payment Method</Label>
          <Input
            id="payment"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Auto-detect" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={saveAsRule}
            onChange={(e) => setSaveAsRule(e.target.checked)}
            className="rounded"
          />
          Save vendor → category as rule
        </label>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save & Post"}
      </Button>
    </div>
  );
}
