const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const KEYS_FILE = path.join(__dirname, "keys.json");

// Admin password: change or set environment variable ADMIN_PASSWORD
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "roni6294";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// load keys
let keys = [];
function loadKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const raw = fs.readFileSync(KEYS_FILE, "utf8");
      keys = JSON.parse(raw || "[]");
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
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}
loadKeys();

// helper generate unique key
function makeKey() {
  // RONI- + 8 chars
  return "RONI-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function ensureExpiry(obj) {
  // mark expired if past expiresAt
  if (obj.expiresAt && Date.now() > obj.expiresAt) {
    obj.active = false;
  }
  return obj;
}

// Middleware: admin check using Authorization: Bearer <password>
function adminAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    if (token === ADMIN_PASSWORD) return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// Public endpoints

// Generate one key; optional query days (integer) to set expiry
app.get("/generate", (req, res) => {
  const days = parseInt(req.query.days || "0", 10);
  const newKey = {
    key: makeKey(),
    createdAt: Date.now(),
    expiresAt: days > 0 ? Date.now() + days * 24 * 60 * 60 * 1000 : null,
    active: true,
    lastLogin: null,
    note: req.query.note || null
  };
  keys.push(newKey);
  saveKeys();
  res.json({ success: true, key: newKey.key, meta: newKey });
});

// Verify key
app.get("/verify", (req, res) => {
  const { key } = req.query;
  if (!key) return res.json({ valid: false, message: "No key provided" });

  const obj = keys.find(k => k.key === key);
  if (!obj) return res.json({ valid: false, message: "❌ Invalid key" });

  ensureExpiry(obj);

  if (!obj.active) {
    const expiredMessage = obj.expiresAt && Date.now() > obj.expiresAt
      ? "❌ Key expired"
      : "⛔ Key is deactivated";
    saveKeys();
    return res.json({ valid: false, message: expiredMessage });
  }

  obj.lastLogin = Date.now();
  saveKeys();
  return res.json({ valid: true, message: "✅ Key is valid", meta: obj });
});

// Admin endpoints (protected)
app.post("/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    // For simplicity we return success; admin front-end will use password as bearer token
    return res.json({ success: true });
  }
  return res.json({ success: false, message: "Wrong password" });
});

// get all keys
app.get("/admin/keys", adminAuth, (req, res) => {
  // update expiry flags before sending
  keys.forEach(k => ensureExpiry(k));
  saveKeys();
  res.json({ keys });
});

// admin generate (body: {qty, days, note})
app.post("/admin/generate", adminAuth, (req, res) => {
  const qty = Math.max(1, Math.min(200, parseInt(req.body.qty || 1)));
  const days = parseInt(req.body.days || 0, 10);
  const note = req.body.note || null;
  const gen = [];
  for (let i = 0; i < qty; i++) {
    const newKey = {
      key: makeKey(),
      createdAt: Date.now(),
      expiresAt: days > 0 ? Date.now() + days * 24 * 60 * 60 * 1000 : null,
      active: true,
      lastLogin: null,
      note
    };
    keys.push(newKey);
    gen.push(newKey);
  }
  saveKeys();
  res.json({ success: true, generated: gen });
});

// toggle active on/off (body { key, active })
app.post("/admin/toggle", adminAuth, (req, res) => {
  const { key, active } = req.body || {};
  const obj = keys.find(k => k.key === key);
  if (!obj) return res.status(404).json({ success: false, message: "Not found" });
  obj.active = !!active;
  saveKeys();
  res.json({ success: true, key: obj.key, active: obj.active });
});

// update expiry date (body { key, expiresAt }) - expiresAt: timestamp or null
app.post("/admin/setExpiry", adminAuth, (req, res) => {
  const { key, expiresAt } = req.body || {};
  const obj = keys.find(k => k.key === key);
  if (!obj) return res.status(404).json({ success: false, message: "Not found" });
  obj.expiresAt = expiresAt ? Number(expiresAt) : null;
  ensureExpiry(obj);
  saveKeys();
  res.json({ success: true, key: obj });
});

// delete key
app.post("/admin/delete", adminAuth, (req, res) => {
  const { key } = req.body || {};
  const before = keys.length;
  keys = keys.filter(k => k.key !== key);
  saveKeys();
  res.json({ success: true, removed: before - keys.length });
});

// small root text
app.get("/", (req, res) => {
  res.send("Welcome to Roni API System - root. Use /index.html or /admin.html");
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
