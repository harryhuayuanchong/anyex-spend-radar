import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";
import { processDocument } from "@/lib/extraction/pipeline";
import { categorizeAndPost } from "@/lib/categorization/categorizer";
import type { ExtractedData } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const { id } = params;

  // Check if this is a manual save+post from the editor
  let body: { skip_extraction?: boolean; category_id?: string; save_rule?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // No body = normal processing trigger
  }

  if (body.skip_extraction) {
    // Manual post: read existing extracted_json, categorize with override
    const manualPost = async () => {
      const { data: doc } = await supabase
        .from("documents")
        .select("extracted_json")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (!doc?.extracted_json) throw new Error("No extracted data");

      const extracted = doc.extracted_json as ExtractedData;

      // If a manual category + save_rule, create merchant rule
      if (body.category_id && body.save_rule) {
        await supabase.from("merchant_rules").upsert(
          { user_id: userId, vendor_pattern: extracted.vendor.toLowerCase(), category_id: body.category_id },
          { onConflict: "user_id,vendor_pattern" }
        );
      }

      // Override category if provided
      if (body.category_id) {
        const { toMonth } = await import("@/lib/utils");
        await supabase.from("expenses").upsert(
          {
            user_id: userId,
            date: extracted.date,
            month: toMonth(extracted.date),
            vendor: extracted.vendor,
            amount: extracted.amount,
            currency: extracted.currency || "USD",
            category_id: body.category_id,
            payment_method: extracted.payment_method || null,
            source_document_id: id,
            invoice_id: extracted.invoice_id || null,
            notes: extracted.notes || null,
          },
          { onConflict: "source_document_id" }
        );
        await supabase
          .from("documents")
          .update({ status: "posted", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId);
      } else {
        await categorizeAndPost(id, extracted, userId);
      }
    };

    manualPost().catch((err) =>
      console.error("Manual post failed:", err)
    );
  } else {
    // Normal: full extraction pipeline
    processDocument(id, userId).catch((err) =>
      console.error("Background processing failed:", err)
    );
  }

  return NextResponse.json({ status: "processing" });
}
