import http from "node:http";

const body = JSON.stringify({ email: "admin@example.com", password: "admin123" });

const req = http.request({
  hostname: "localhost",
  port: 5000,
  path: "/api/auth/login",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  },
}, (res) => {
  let data = "";
  res.on("data", (c) => data += c);
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    console.log("Response:", data.substring(0, 1000));
    process.exit(0);
  });
});

req.on("error", (e) => { console.error("Error:", e.message); process.exit(1); });
req.setTimeout(10000);
req.write(body);
req.end();
