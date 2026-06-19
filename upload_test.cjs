import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const token = fs.readFileSync("C:\\Users\\acer\\AppData\\Local\\Temp\\test_token.txt", "utf-8").trim();
const filePath = process.argv[2] || "C:\\Users\\acer\\AppData\\Local\\Temp\\test.pdf";
const fileBuffer = fs.readFileSync(filePath);

const boundary = "----FormBoundary" + Date.now();
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(filePath)}"\r\nContent-Type: application/pdf\r\n\r\n`),
  fileBuffer,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

console.log(`Uploading ${fileBuffer.length} bytes to http://localhost:5000/api/admin/upload/pdf`);
const start = Date.now();

const req = http.request({
  hostname: "localhost",
  port: 5000,
  path: "/api/admin/upload/pdf",
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  },
}, (res) => {
  let data = "";
  res.on("data", (c) => data += c);
  res.on("end", () => {
    console.log(`Status: ${res.statusCode} (${Date.now() - start}ms)`);
    console.log("Response:", data.substring(0, 500));
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error(`Error (${Date.now() - start}ms):`, e.message);
  process.exit(1);
});

req.on("timeout", () => {
  console.error(`TIMEOUT after ${Date.now() - start}ms`);
  req.destroy();
  process.exit(1);
});

req.setTimeout(30000);
req.write(body);
req.end();
