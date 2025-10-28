const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const KEYS_FILE = "keys.json";
const ADMIN_PASSWORD = "roni6294"; // Change if you want

// Load saved keys
let keys = [];
if (fs.existsSync(KEYS_FILE)) {
  keys = JSON.parse(fs.readFileSync(KEYS_FILE));
}

// Generate random key
function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "RONI-";
  for (let i = 0; i < 8; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

// Helper: save keys to file
function saveKeys() {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Clean expired keys automatically (optional)
function removeExpiredKeys() {
  const now = new Date();
  keys = keys.filter(k => new Date(k.expiresAt) > now);
  saveKeys();
}
setInterval(removeExpiredKeys, 3600000); // every 1 hour

// Generate new key (auto expires in 7 days)
app.get("/generate", (req, res) => {
  const newKey = {
    key: generateKey(),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active"
  };
  keys.push(newKey);
  saveKeys();
  res.json({ success: true, key: newKey });
});

// Verify key validity
app.get("/verify", (req, res) => {
  const { key } = req.query;
  const found = keys.find(k => k.key === key);
  if (!found) return res.json({ valid: false, message: "❌ Invalid key" });

  const now = new Date();
  const expired = new Date(found.expiresAt) <= now;
  if (expired || found.status === "off") {
    return res.json({ valid: false, message: "⚠️ Key expired or deactivated" });
  }

  res.json({ valid: true, message: "✅ Key is valid" });
});

// Admin login
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  res.json({ success: password === ADMIN_PASSWORD });
});

// Admin – get all keys
app.get("/admin/keys", (req, res) => {
  res.json({ keys });
});

// Admin – toggle key ON/OFF
app.post("/admin/toggle", (req, res) => {
  const { key } = req.body;
  const found = keys.find(k => k.key === key);
  if (found) {
    found.status = found.status === "active" ? "off" : "active";
    saveKeys();
    return res.json({ success: true, status: found.status });
  }
  res.json({ success: false });
});

// Admin – delete key
app.post("/admin/delete", (req, res) => {
  const { key } = req.body;
  keys = keys.filter(k => k.key !== key);
  saveKeys();
  res.json({ success: true });
});

app.get("/", (req, res) => {
  res.send("🔥 Welcome to Roni API System with Expiry 🔥");
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
