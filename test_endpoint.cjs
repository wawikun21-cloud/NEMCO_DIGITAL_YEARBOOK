const http = require("http");
const fs = require("fs");

const fileBuffer = fs.readFileSync("C:\\Users\\acer\\AppData\\Local\\Temp\\test.pdf");
const boundary = "----FormBoundary" + Date.now();
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bmN1aWhsdHZtYmlza21qaXJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTY3MjU1NywiZXhwIjoyMDk3MjQ4NTU3fQ.Lnx0WI93zWea4C4rsRQ5XYYmp6Kq7f_4ZnvCd0Cd4Tg";

const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
  fileBuffer,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/admin/upload/pdf",
  method: "POST",
  headers: {
    "Authorization": `Bearer ${serviceKey}`,
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  },
};

console.log("Testing upload endpoint with running server...");
const start = Date.now();

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    console.log(`Status: ${res.statusCode} (${Date.now() - start}ms)`);
    console.log("Response:", data.substring(0, 500));
  });
});

req.on("error", (e) => console.error("Error:", e.message));
req.write(body);
req.end();
