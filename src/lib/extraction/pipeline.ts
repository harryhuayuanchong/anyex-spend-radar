import { supabase } from "@/lib/supabase";
import { extractedDataSchema } from "@/lib/schemas";
import { extractTextFromPdf } from "./pdf-extractor";
import {
  extractFromVision,
  extractFromText,
  extractFromTextStripe,
  extractFromTextRetry,
} from "./vision-extractor";
import { categorizeAndPost } from "@/lib/categorization/categorizer";
import type { Document, ExtractedData } from "@/lib/types";

function isPdf(filename: string) {
  return filename.toLowerCase().endsWith(".pdf");
}

const STRIPE_FILENAME_RE = /^(Invoice|Receipt)-[A-Z0-9]+-\d+/i;
const STRIPE_TEXT_MARKERS = [
  "Pay online",
  "Date of issue",
  "Date due",
  "Amount due",
  "Unit price",
  "Date paid",
  "Amount paid",
  "Receipt number",
];

function isStripeDocument(text: string, filename: string): boolean {
  if (STRIPE_FILENAME_RE.test(filename)) return true;
  const hits = STRIPE_TEXT_MARKERS.filter((m) =>
    text.toLowerCase().includes(m.toLowerCase())
  );
  return hits.length >= 3;
}

export async function processDocument(docId: string, userId: string) {
  // Mark as processing
  await supabase
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", docId)
    .eq("user_id", userId);

  try {
    const { data: doc, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", docId)
      .eq("user_id", userId)
      .single();

    if (error || !doc) throw new Error("Document not found");

    const document = doc as Document;
    let extracted: ExtractedData;
    let extractedText: string | null = null;

    if (isPdf(document.filename)) {
      // PDF: try text extraction first
      const text = await extractTextFromPdf(document.file_url);
      extractedText = text;

      if (text.length > 50) {
        const stripe = isStripeDocument(text, document.filename);

        // Step 1: primary extraction (Stripe-specific or generic)
        extracted = stripe
          ? await extractFromTextStripe(text)
          : await extractFromText(text);

        // Step 2: validate — if it fails, retry with GPT-4o general prompt
        let parseResult = extractedDataSchema.safeParse(extracted);
        if (!parseResult.success) {
          console.warn(
            `Primary extraction invalid for ${document.filename}, retrying with GPT-4o...`
          );
          extracted = await extractFromTextRetry(text);
          parseResult = extractedDataSchema.safeParse(extracted);
        }

        // Step 3: if still invalid, fall back to vision
        if (!parseResult.success) {
          console.warn(
            `Retry extraction invalid for ${document.filename}, falling back to vision...`
          );
          extracted = await extractFromVision(document.file_url);
          parseResult = extractedDataSchema.safeParse(extracted);
        }

        if (!parseResult.success) {
          throw new Error(
            `Extraction failed after all attempts: ${parseResult.error.message}`
          );
        }
      } else {
        // Scanned PDF — fall back to vision
        extracted = await extractFromVision(document.file_url);
      }
    } else {
      // Image file — use vision
      extracted = await extractFromVision(document.file_url);
    }

    // Validate with zod
    const validated = extractedDataSchema.parse(extracted);

    // Save extraction results
    await supabase
      .from("documents")
      .update({
        status: "extracted",
        extracted_json: validated,
        extracted_text: extractedText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId)
      .eq("user_id", userId);

    // Auto-categorize and create expense
    try {
      await categorizeAndPost(docId, validated, userId);
    } catch (catErr) {
      // Log but don't fail the whole pipeline — extraction succeeded,
      // user can still manually categorize and post from Inbox
      console.error(`Categorization error for ${docId}:`, catErr);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Pipeline error for ${docId}:`, message);
    await supabase
      .from("documents")
      .update({
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId)
      .eq("user_id", userId);
  }
}
