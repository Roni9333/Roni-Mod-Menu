const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const KEYS_FILE = path.join(__dirname, "keys.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "roni6294";
// load keys
let keys = [];
function loadKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, "utf8");
      keys = raw ? JSON.parse(raw) : [];
    } else {
      keys = [];
      fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    }
  } catch (e) {
    console.error("Failed to load keys:", e);
    keys = [];
  }
}
function saveKeys() {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
  } catch (e) {
    console.error("Failed to save keys:", e);
  }
}
loadKeys();

// helper to create key object
function makeKeyObject(days) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += chars[Math.floor(Math.random() * chars.length)];

  const key = `RONI-${suffix}`;
  const createdAt = Date.now();
  let expiresAt = null;

  if (days && Number(days) > 0) {
    expiresAt = createdAt + Number(days) * 24 * 60 * 60 * 1000;
  }

  return {
    key,
    createdAt,
    expiresAt,
    lastLogin: null,
    active: true,
    note: "",
  };
}

// ✅ Add this function to generate and save key
app.post("/generate", (req, res) => {
  const { password, days } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Invalid admin password" });
  }

  const newKey = makeKeyObject(days);
  keys.push(newKey);
  saveKeys();

  res.json({ success: true, key: newKey });
});
// verify key (used by app). It updates lastLogin if valid.
app.get("/verify", (req, res) => {
  const { key } = req.query;
  if (!key) return res.json({ valid: false, message: "No key provided" });
  const k = keys.find(x => x.key === key);
  if (!k) return res.json({ valid: false, message: "❌ Invalid key" });
  if (!k.active) return res.json({ valid: false, message: "❌ Key is turned off" });
  if (k.expiresAt && Date.now() > k.expiresAt) {
    return res.json({ valid: false, message: "❌ Key expired" });
  }
  k.lastLogin = Date.now();
  saveKeys();
  return res.json({ valid: true, message: "✅ Key is valid" });
});

// admin: login (simple)
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) return res.json({ success: true });
  return res.json({ success: false, message: "Wrong password" });
});

// admin: list keys
app.get("/admin/keys", (req, res) => {
  // return keys sorted newest first
  const list = keys.slice().sort((a,b)=> b.createdAt - a.createdAt);
  return res.json({ keys: list });
});

// admin: create keys (POST) with body { qty, days, note }
app.post("/admin/create", (req, res) => {
  const { qty = 1, days = 0, note = "" } = req.body;
  const n = Math.max(1, Math.min(500, Number(qty)));
  const created = [];
  for (let i = 0; i < n; i++) {
    const obj = makeKeyObject(days);
    obj.note = note ? String(note).slice(0,200) : "";
    keys.push(obj);
    created.push(obj);
  }
  saveKeys();
  return res.json({ success: true, created });
});

// admin: toggle active (POST) body { key }
app.post("/admin/toggle", (req, res) => {
  const { key } = req.body;
  const k = keys.find(x => x.key === key);
  if (!k) return res.json({ success: false, message: "Not found" });
  k.active = !k.active;
  saveKeys();
  return res.json({ success: true, key: k });
});

// admin: delete
app.post("/admin/delete", (req, res) => {
  const { key } = req.body;
  const before = keys.length;
  keys = keys.filter(x => x.key !== key);
  saveKeys();
  return res.json({ success: true, removed: before - keys.length });
});

// admin: set expiry (POST) body { key, days } days=0 => unlimited, or expiresAt timestamp
app.post("/admin/set-expiry", (req, res) => {
  const { key, days } = req.body;
  const k = keys.find(x => x.key === key);
  if (!k) return res.json({ success: false, message: "Not found" });
  if (days === null || days === undefined || Number(days) <= 0) {
    k.expiresAt = null;
  } else {
    k.expiresAt = Date.now() + Number(days) * 24 * 60 * 60 * 1000;
  }
  saveKeys();
  return res.json({ success: true, key: k });
});

// simple root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
