import express from "express";
import fs from "fs";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const KEYS_FILE = "keys.json";
const ADMIN_PASSWORD = "roni6294"; // Change if you want

// Helper: Read + Save keys
function readKeys() {
  if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, "[]");
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8"));
}
function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// ✅ Admin Login
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  res.json({ success: password === ADMIN_PASSWORD });
});

// ✅ Get all keys
app.get("/admin/keys", (req, res) => {
  res.json({ keys: readKeys() });
});

// ✅ Generate new key (default 7 days expiry)
app.post("/admin/generate", (req, res) => {
  const { days = 7 } = req.body;
  const newKey = Math.random().toString(36).substring(2, 12);
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  const keyData = { key: newKey, status: "active", expiry };
  const keys = readKeys();
  keys.push(keyData);
  saveKeys(keys);
  res.json({ success: true, key: keyData });
});

// ✅ Toggle ON/OFF
app.post("/admin/toggle", (req, res) => {
  const { key } = req.body;
  let keys = readKeys();
  const idx = keys.findIndex(k => k.key === key);
  if (idx === -1) return res.json({ success: false });
  keys[idx].status = keys[idx].status === "active" ? "inactive" : "active";
  saveKeys(keys);
  res.json({ success: true, status: keys[idx].status });
});

// ✅ Delete key
app.post("/admin/delete", (req, res) => {
  const { key } = req.body;
  const keys = readKeys().filter(k => k.key !== key);
  saveKeys(keys);
  res.json({ success: true });
});

// ✅ Check key (for app login)
app.post("/check", (req, res) => {
  const { key } = req.body;
  const keys = readKeys();
  const item = keys.find(k => k.key === key);
  if (!item) return res.json({ valid: false, message: "Invalid key" });
  if (Date.now() > item.expiry) return res.json({ valid: false, message: "Expired key" });
  if (item.status !== "active") return res.json({ valid: false, message: "Key disabled" });
  res.json({ valid: true, message: "Key valid" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Roni API System running on port ${PORT}`));
