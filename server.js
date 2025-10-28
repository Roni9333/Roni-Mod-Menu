const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const KEYS_FILE = "keys.json";
const ADMIN_PASSWORD = "roni6294"; // 🔐 Change if you want

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

// Generate new key
app.get("/generate", (req, res) => {
  const newKey = generateKey();
  keys.push(newKey);
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys));
  res.json({ success: true, key: newKey });
});

// Verify key
app.get("/verify", (req, res) => {
  const { key } = req.query;
  if (keys.includes(key)) {
    res.json({ valid: true, message: "✅ Key is valid" });
  } else {
    res.json({ valid: false, message: "❌ Invalid key" });
  }
});

// Admin login
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Wrong password!" });
  }
});

// Get all keys (Admin)
app.get("/admin/keys", (req, res) => {
  res.json({ keys });
});

// Delete a key
app.post("/admin/delete", (req, res) => {
  const { key } = req.body;
  keys = keys.filter(k => k !== key);
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys));
  res.json({ success: true });
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
