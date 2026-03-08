import OpenAI from "openai";
import type { ExtractedData } from "@/lib/types";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

/**
 * Download an image/PDF from a URL and return a base64 data URL.
 * This is more reliable than passing external URLs to OpenAI,
 * which may fail due to CORS, auth, or bucket configuration issues.
 */
async function toBase64DataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.statusText}`);
  const contentType = res.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

const SYSTEM_PROMPT = `You are a document data extractor. Given an image of an invoice, receipt, or bill, extract the following fields as JSON:
{
  "vendor": "Company/merchant name",
  "date": "YYYY-MM-DD",
  "amount": 123.45,
  "currency": "USD",
  "invoice_id": "optional invoice number",
  "payment_method": "optional (credit card, bank transfer, etc.)",
  "notes": "optional brief description",
  "line_items": [{"description": "item", "quantity": 1, "unit_price": 10.00, "amount": 10.00}]
}
Return ONLY valid JSON. If a field is not found, omit it (except vendor, date, amount which are required).`;

const STRIPE_SYSTEM_PROMPT = `You are a document data extractor specializing in Stripe-generated invoices and receipts.

Stripe PDFs use a two-column layout:
- LEFT column: sender/vendor info (company name, address)
- RIGHT column: "Bill to" section (this is the CUSTOMER, NOT the vendor)
- The VENDOR is the company in the LEFT column (the one sending the invoice)

Stripe generates two document types with slightly different fields:

INVOICES:
- "Invoice number" → extract as invoice_id
- "Date of issue" → extract as date in YYYY-MM-DD
- "Date due" → ignore (use date of issue)
- "Amount due" → extract as amount

RECEIPTS:
- "Invoice number" and "Receipt number" → prefer invoice number as invoice_id
- "Date paid" → extract as date in YYYY-MM-DD
- "Amount paid" → extract as amount
- "Payment history" section with payment method details

Common fields:
- Currency symbol ($, €, £) or code → extract as currency
- Line items table with Description, Qty, Unit price, Amount columns
- "Pay online" link may appear — ignore it
- Payment method (e.g. "Visa - 0061") → extract as payment_method if present

IMPORTANT: When extracted from PDF, the two-column text may appear INTERLEAVED (left and right columns mixed together line by line). You must mentally separate the columns to identify the correct vendor vs customer.

Extract as JSON:
{
  "vendor": "Company/merchant name (from LEFT column, the sender)",
  "date": "YYYY-MM-DD",
  "amount": 123.45,
  "currency": "USD",
  "invoice_id": "invoice or receipt number",
  "payment_method": "optional",
  "notes": "optional brief description",
  "line_items": [{"description": "item", "quantity": 1, "unit_price": 10.00, "amount": 10.00}]
}
Return ONLY valid JSON. If a field is not found, omit it (except vendor, date, amount which are required).`;

export async function extractFromVision(
  imageUrl: string
): Promise<ExtractedData> {
  // Download and convert to base64 to avoid OpenAI URL-fetch failures
  const dataUrl = await toBase64DataUrl(imageUrl);

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: dataUrl, detail: "high" },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI Vision");

  return JSON.parse(content) as ExtractedData;
}

export async function extractFromText(text: string): Promise<ExtractedData> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT.replace("an image of an invoice, receipt, or bill", "the text content of a document (invoice, receipt, or bill)") },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  return JSON.parse(content) as ExtractedData;
}

export async function extractFromTextStripe(text: string): Promise<ExtractedData> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: STRIPE_SYSTEM_PROMPT.replace("specializing in Stripe-generated invoices and receipts.", "specializing in Stripe-generated invoices and receipts.\n\nYou are given the raw text extracted from a Stripe PDF. The text may be garbled due to two-column interleaving.") },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI (Stripe extractor)");

  return JSON.parse(content) as ExtractedData;
}

export async function extractFromTextRetry(text: string): Promise<ExtractedData> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT.replace("an image of an invoice, receipt, or bill", "the text content of a document (invoice, receipt, or bill). The text was extracted from a PDF and may have formatting issues or interleaved columns. Do your best to parse it accurately") },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI (retry extractor)");

  return JSON.parse(content) as ExtractedData;
}
