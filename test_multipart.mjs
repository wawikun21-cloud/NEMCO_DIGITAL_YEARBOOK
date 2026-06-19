import express from "express";
import http from "node:http";

const app = express();

app.use((req, res, next) => {
  console.log("[DEBUG] Content-Type:", req.headers["content-type"]);
  console.log("[DEBUG] req.is('json'):", req.is("json"));
  console.log("[DEBUG] req.is('multipart/form-data'):", req.is("multipart/form-data"));
  next();
});

app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  console.log("[DEBUG] After json parser, body:", JSON.stringify(req.body).substring(0, 100));
  next();
});

app.post("/test", (req, res) => {
  res.json({ received: true, body: req.body });
});

const server = app.listen(9999, () => {
  console.log("Test server on port 9999");

  const boundary = "----Boundary" + Date.now();
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    Buffer.from("%PDF-1.4 test content"),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const req = http.request({
    hostname: "localhost",
    port: 9999,
    path: "/test",
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": body.length,
    },
  }, (res) => {
    let data = "";
    res.on("data", (c) => data += c);
    res.on("end", () => {
      console.log("[TEST] Response:", data);
      server.close();
      process.exit(0);
    });
  });

  req.on("error", (e) => {
    console.error("[TEST] Error:", e.message);
    server.close();
    process.exit(1);
  });

  req.write(body);
  req.end();
});
