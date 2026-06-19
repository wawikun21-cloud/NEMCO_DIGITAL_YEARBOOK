import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require("express");
const multer = require("multer");
const http = require("http");

const app = express();

app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.post("/upload", upload.single("file"), (req, res) => {
  console.log("[HANDLER] File received:", req.file ? req.file.originalname : "none");
  res.json({ success: true, fileName: req.file?.originalname });
});

const server = app.listen(9998, () => {
  console.log("Test server on port 9998");

  const boundary = "----Boundary" + Date.now();
  const fileContent = Buffer.alloc(100 * 1024);
  fileContent.write("%PDF-1.4");
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  console.log(`Uploading ${fileContent.length} bytes...`);
  const start = Date.now();

  const req = http.request({
    hostname: "localhost",
    port: 9998,
    path: "/upload",
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
      server.close();
      process.exit(0);
    });
  });

  req.on("error", (e) => {
    console.error(`Error (${Date.now() - start}ms):`, e.message);
    server.close();
    process.exit(1);
  });

  req.on("timeout", () => {
    console.error(`TIMEOUT after ${Date.now() - start}ms`);
    req.destroy();
    server.close();
    process.exit(1);
  });

  req.setTimeout(15000);
  req.write(body);
  req.end();
});
