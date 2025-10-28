const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Admin password: set as env var ADMIN_PASSWORD on Render for safety
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "roni6294";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const KEYS_FILE = path.join(__dirname, "keys.json");

// helper: read/write keys (array of objects)
function readKeys() {
  try {
    const raw = fs.readFileSync(KEYS_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}
function writeKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// helper: generate
function makeKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let k = "RONI-";
  for (let i = 0; i < 8; i++) k += chars[Math.floor(Math.random() * chars.length)];
  return k;
}

// Public: verify key
// GET /api/verify?key=RONI-...
app.get("/api/verify", (req, res) => {
  const q = (req.query.key || "").trim();
  if (!q) return res.json({ valid: false, message: "No key provided" });

  const keys = readKeys();
  const row = keys.find(r => r.key === q);
  if (!row) return res.json({ valid: false, message: "❌ Invalid key" });

  // expired?
  if (row.expires) {
    const exp = new Date(row.expires);
    if (isFinite(exp) && exp.getTime() < Date.now()) {
      return res.json({ valid: false, message: "❌ Key expired" });
    }
  }

  if (!row.active) return res.json({ valid: false, message: "❌ Key revoked" });

  return res.json({ valid: true, message: "✅ Key is valid", details: row });
});

// Public: user can request a key (optional)
// POST /api/generate  { name, email }
// returns created key
app.post("/api/generate", (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: "name and email required" });

  const keys = readKeys();
  const newRow = {
    key: makeKey(),
    name,
    email,
    created: new Date().toISOString(),
    active: true,
    expires: null, // can be string ISO or null
    note: ""
  };
  keys.push(newRow);
  writeKeys(keys);
  res.json({ success: true, ...newRow });
});

// ------------ ADMIN AUTH middleware ------------
function checkAdmin(req, res, next) {
  // Accept Authorization: Bearer <password> or header x-admin-pass
  const auth = req.headers.authorization || req.headers["x-admin-pass"] || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (token && token === ADMIN_PASSWORD) return next();
  return res.status(401).json({ error: "Unauthorized. Provide admin password in Authorization: Bearer <PASSWORD>" });
}

// Admin: list all keys
// GET /api/admin/keys
app.get("/api/admin/keys", checkAdmin, (req, res) => {
  const keys = readKeys();
  res.json(keys);
});

// Admin: generate key (single or bulk) with optional expires days
// POST /api/admin/generate { name, email, qty (default 1), expiresDays (optional), note }
app.post("/api/admin/generate", checkAdmin, (req, res) => {
  const { name = "unknown", email = "unknown", qty = 1, expiresDays = null, note = "" } = req.body || {};
  const keys = readKeys();
  const created = [];
  for (let i = 0; i < Math.max(1, Math.min(100, parseInt(qty || 1))); i++) {
    const row = {
      key: makeKey(),
      name,
      email,
      created: new Date().toISOString(),
      active: true,
      expires: expiresDays ? new Date(Date.now() + expiresDays * 24 * 3600 * 1000).toISOString() : null,
      note
    };
    keys.push(row);
    created.push(row);
  }
  writeKeys(keys);
  res.json({ success: true, generated: created });
});

// Admin: toggle active (revoke/reactivate)
// POST /api/admin/toggle { key }
app.post("/api/admin/toggle", checkAdmin, (req, res) => {
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: "key required" });
  const keys = readKeys();
  const row = keys.find(r => r.key === key);
  if (!row) return res.status(404).json({ error: "key not found" });
  row.active = !row.active;
  writeKeys(keys);
  res.json({ success: true, key: row.key, active: row.active });
});

// Admin: set expiry date or remove
// POST /api/admin/expire { key, expiresISO (null to remove) }
// Example expiresISO = "2025-11-01T00:00:00.000Z"
app.post("/api/admin/expire", checkAdmin, (req, res) => {
  const { key, expiresISO } = req.body || {};
  if (!key) return res.status(400).json({ error: "key required" });
  const keys = readKeys();
  const row = keys.find(r => r.key === key);
  if (!row) return res.status(404).json({ error: "key not found" });
  row.expires = expiresISO || null;
  writeKeys(keys);
  res.json({ success: true, key: row.key, expires: row.expires });
});

// Admin: delete key
// POST /api/admin/delete { key }
app.post("/api/admin/delete", checkAdmin, (req, res) => {
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: "key required" });
  let keys = readKeys();
  const exists = keys.some(r => r.key === key);
  keys = keys.filter(r => r.key !== key);
  writeKeys(keys);
  res.json({ success: true, removed: exists ? 1 : 0 });
});

// Serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
