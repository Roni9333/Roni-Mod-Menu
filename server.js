import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const KEYS_FILE = "keys.json";
const ADMIN_PASSWORD = "roni6294"; // 🔐 apna password yahan change karo

// --- Read/Save Helper Functions ---
function readKeys() {
  if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, "[]");
  return JSON.parse(fs.readFileSync(KEYS_FILE));
}
function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// --- Random Key Generator ---
function generateRandomKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "RONI-";
  for (let i = 0; i < 8; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

// --- Admin Login ---
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  res.json({ success: password === ADMIN_PASSWORD });
});

// --- Get All Keys ---
app.get("/admin/keys", (req, res) => {
  res.json({ keys: readKeys() });
});

// --- Generate Key (for 1 / 5 / 7 days) ---
app.post("/admin/generate", (req, res) => {
  const { days } = req.body; // 1, 5, or 7
  const newKey = generateRandomKey();
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  const keyData = { key: newKey, status: "active", expiry, days };
  const keys = readKeys();
  keys.push(keyData);
  saveKeys(keys);
  res.json({ success: true, key: keyData });
});

// --- Toggle ON/OFF ---
app.post("/admin/toggle", (req, res) => {
  const { key } = req.body;
  const keys = readKeys();
  const k = keys.find(k => k.key === key);
  if (!k) return res.json({ success: false, msg: "Key not found" });
  k.status = k.status === "active" ? "inactive" : "active";
  saveKeys(keys);
  res.json({ success: true, status: k.status });
});

// --- Delete Key ---
app.post("/admin/delete", (req, res) => {
  const { key } = req.body;
  const keys = readKeys().filter(k => k.key !== key);
  saveKeys(keys);
  res.json({ success: true });
});

// --- Verify Key (for app login) ---
app.post("/check", (req, res) => {
  const { key } = req.body;
  const k = readKeys().find(x => x.key === key);
  if (!k) return res.json({ valid: false, msg: "❌ Invalid key" });
  if (Date.now() > k.expiry) return res.json({ valid: false, msg: "⏰ Key expired" });
  if (k.status !== "active") return res.json({ valid: false, msg: "🚫 Key turned off" });
  res.json({ valid: true, msg: "✅ Key is valid" });
});

// --- Serve Admin Panel ---
app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
