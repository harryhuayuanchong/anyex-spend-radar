import OpenAI from "openai";
import type { ExtractedData } from "@/lib/types";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
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

export async function extractFromVision(
  imageUrl: string
): Promise<ExtractedData> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "high" },
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
