const SUPABASE_URL = "https://zyncuihltvmbiskmjira.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bmN1aWhsdHZtYmlza21qaXJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY3MjU1NywiZXhwIjoyMDk3MjQ4NTU3fQ.Lnx0WI93zWea4C4rsRQ5XYYmp6Kq7f_4ZnvCd0Cd4Tg";

async function main() {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
