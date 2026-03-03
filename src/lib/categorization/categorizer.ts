import OpenAI from "openai";
import { supabase } from "@/lib/supabase";
import { toMonth } from "@/lib/utils";
import type { ExtractedData } from "@/lib/types";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

async function matchMerchantRule(
  vendor: string,
  userId: string
): Promise<string | null> {
  const { data: rules } = await supabase
    .from("merchant_rules")
    .select("vendor_pattern, category_id")
    .eq("user_id", userId);

  if (!rules) return null;

  const lower = vendor.toLowerCase();
  for (const rule of rules) {
    if (lower.includes(rule.vendor_pattern.toLowerCase())) {
      return rule.category_id;
    }
  }
  return null;
}

async function classifyWithAI(
  vendor: string,
  notes?: string
): Promise<string | null> {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name");

  if (!categories?.length) return null;

  const categoryList = categories
    .map((c: { id: string; name: string }) => `${c.id}: ${c.name}`)
    .join("\n");

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Classify this expense into one of the categories. Return ONLY the category UUID.\n\nCategories:\n${categoryList}`,
      },
      {
        role: "user",
        content: `Vendor: ${vendor}${notes ? `\nDescription: ${notes}` : ""}`,
      },
    ],
    max_tokens: 100,
  });

  const id = response.choices[0]?.message?.content?.trim();
  // Validate it's a real category ID
  if (id && categories.some((c: { id: string }) => c.id === id)) {
    return id;
  }
  return null;
}

export async function categorizeAndPost(
  docId: string,
  data: ExtractedData,
  userId: string
) {
  // 1. Try merchant rules
  let categoryId = await matchMerchantRule(data.vendor, userId);

  // 2. Fallback to AI classification
  if (!categoryId) {
    categoryId = await classifyWithAI(data.vendor, data.notes);
  }

  // 3. Upsert expense (unique on source_document_id)
  const { error } = await supabase.from("expenses").upsert(
    {
      user_id: userId,
      date: data.date,
      month: toMonth(data.date),
      vendor: data.vendor,
      amount: data.amount,
      currency: data.currency || "USD",
      category_id: categoryId,
      payment_method: data.payment_method || null,
      source_document_id: docId,
      invoice_id: data.invoice_id || null,
      notes: data.notes || null,
    },
    { onConflict: "source_document_id" }
  );

  if (error) {
    throw new Error(`Failed to create expense: ${error.message}`);
  }

  // 4. Mark document as posted
  await supabase
    .from("documents")
    .update({ status: "posted", updated_at: new Date().toISOString() })
    .eq("id", docId)
    .eq("user_id", userId);
}
