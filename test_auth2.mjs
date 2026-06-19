import { supabaseAdmin } from "./server/src/config/supabase.js";

// The client sends the Supabase anon JWT (from supabase.auth.getSession())
// But the server validates it using supabaseAdmin (service role)
// Let's test with the anon key token (what the client actually gets)
const anonToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bmN1aWhsdHZtYmlza21qaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NzI1NTcsImV4cCI6MjA5NzI0ODU1N30.btrYJy2rs2YQuxrQ6oLTSkr20yH7P9NGlUeIA9mqs58";

console.log("Testing auth.getUser with anon token via supabaseAdmin...");
const start = Date.now();

try {
  const { data, error } = await supabaseAdmin.auth.getUser(anonToken);
  const elapsed = Date.now() - start;
  if (error) {
    console.log(`Auth failed after ${elapsed}ms:`, error.message);
  } else {
    console.log(`Auth success after ${elapsed}ms, user:`, data?.user?.email);
  }
} catch (err) {
  const elapsed = Date.now() - start;
  console.error(`Auth threw after ${elapsed}ms:`, err.message);
}
