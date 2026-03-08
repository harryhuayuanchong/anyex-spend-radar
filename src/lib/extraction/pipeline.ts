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

/**
 * Strip null bytes and control characters that PostgreSQL cannot store.
 */
function sanitizeForDb(value: string): string {
  let result = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      continue;
    }
    result += value[i];
  }
  return result;
}

function sanitizeExtractedData<T>(data: T): T {
  return JSON.parse(sanitizeForDb(JSON.stringify(data)));
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

    // Track whether the text-based path already validated successfully
    let alreadyValidated = false;

    if (isPdf(document.filename)) {
      // PDF: try text extraction first
      let text = "";
      try {
        text = await extractTextFromPdf(document.file_url);
        extractedText = text;
      } catch (pdfErr) {
        console.warn(
          `PDF text extraction failed for ${document.filename}, falling back to vision:`,
          pdfErr
        );
        // Will fall through to vision path below since text is ""
      }

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

        // Step 4: if vision also invalid, retry vision once
        if (!parseResult.success) {
          console.warn(
            `Vision extraction invalid for ${document.filename}, retrying vision...`
          );
          extracted = await extractFromVision(document.file_url);
          parseResult = extractedDataSchema.safeParse(extracted);
        }

        if (!parseResult.success) {
          throw new Error(
            `Extraction failed after all attempts: ${parseResult.error.message}`
          );
        }
        alreadyValidated = true;
      } else {
        // Scanned PDF or text extraction failed — fall back to vision
        extracted = await extractFromVision(document.file_url);
      }
    } else {
      // Image file — use vision
      extracted = await extractFromVision(document.file_url);
    }

    // Validate vision-only results (images & scanned PDFs) with retry
    if (!alreadyValidated) {
      const visionParseResult = extractedDataSchema.safeParse(extracted);
      if (!visionParseResult.success) {
        console.warn(
          `Vision extraction invalid for ${document.filename}, retrying...`
        );
        extracted = await extractFromVision(document.file_url);
      }
    }

    // Final validation — throws if still invalid
    const validated = extractedDataSchema.parse(extracted);

    // Sanitize data for PostgreSQL (strip null bytes that jsonb cannot store)
    const sanitizedJson = sanitizeExtractedData(validated);
    const sanitizedText = extractedText ? sanitizeForDb(extractedText) : null;

    // Save extraction results
    const { error: saveError } = await supabase
      .from("documents")
      .update({
        status: "extracted",
        extracted_json: sanitizedJson,
        extracted_text: sanitizedText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId)
      .eq("user_id", userId);

    if (saveError) {
      throw new Error(`Failed to save extraction results: ${saveError.message}`);
    }

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
