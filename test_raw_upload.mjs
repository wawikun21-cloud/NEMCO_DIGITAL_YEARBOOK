import { supabaseAdmin } from "./server/src/config/supabase.js";

const fileBuffer = Buffer.from("%PDF-1.4 1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj 2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj 3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n trailer << /Size 4 /Root 1 0 R >> startxref 193 %%EOF");

console.log("Testing raw Supabase upload (no timeout wrapper)...");
const start = Date.now();

const { data, error } = await supabaseAdmin.storage
  .from("flipbook-pdfs")
  .upload(`test-raw-${Date.now()}.pdf`, fileBuffer, {
    contentType: "application/pdf",
    upsert: false,
  });

const elapsed = Date.now() - start;
if (error) {
  console.log(`FAILED after ${elapsed}ms:`, error.message);
} else {
  console.log(`SUCCESS after ${elapsed}ms, key:`, data?.path);
}
