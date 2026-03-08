/**
 * Strip null bytes and other control characters that PostgreSQL cannot store.
 * Preserves newlines (\n), carriage returns (\r), and tabs (\t).
 */
function stripNullBytes(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Skip null bytes and other problematic control chars (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F)
    // Keep: \t (0x09), \n (0x0A), \r (0x0D)
    if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      continue;
    }
    result += text[i];
  }
  return result;
}

export async function extractTextFromPdf(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download PDF: ${res.statusText}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return stripNullBytes(result.text).trim();
}
