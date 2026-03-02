import { supabase } from "@/lib/supabase";
import { extractedDataSchema } from "@/lib/schemas";
import { extractTextFromPdf } from "./pdf-extractor";
import { extractFromVision, extractFromText } from "./vision-extractor";
import { categorizeAndPost } from "@/lib/categorization/categorizer";
import type { Document, ExtractedData } from "@/lib/types";

function isPdf(filename: string) {
  return filename.toLowerCase().endsWith(".pdf");
}

export async function processDocument(docId: string) {
  // Mark as processing
  await supabase
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", docId);

  try {
    const { data: doc, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", docId)
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
        // Enough text content — use cheaper text model
        extracted = await extractFromText(text);
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
      .eq("id", docId);

    // Auto-categorize and create expense
    try {
      await categorizeAndPost(docId, validated);
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
      .eq("id", docId);
  }
}
