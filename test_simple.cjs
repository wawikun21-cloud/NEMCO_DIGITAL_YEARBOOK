const http = require("http");

const boundary = "----Boundary" + Date.now();
const fileContent = Buffer.alloc(100 * 1024);
fileContent.write("%PDF-1.4");
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
  fileContent,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

console.log(`Testing /api/test-upload with ${fileContent.length} bytes...`);
const start = Date.now();

const req = http.request({
  hostname: "localhost",
  port: 5000,
  path: "/api/test-upload",
  method: "POST",
  headers: {
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  },
}, (res) => {
  let data = "";
  res.on("data", (c) => data += c);
  res.on("end", () => {
    console.log(`Status: ${res.statusCode} (${Date.now() - start}ms)`);
    console.log("Response:", data);
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

req.setTimeout(15000);
req.write(body);
req.end();
