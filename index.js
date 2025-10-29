import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Function to read keys
function readKeys() {
  const data = fs.readFileSync("./keys.json");
  return JSON.parse(data).keys;
}

// Function to write keys
function writeKeys(keys) {
  fs.writeFileSync("./keys.json", JSON.stringify({ keys }, null, 2));
}

// ✅ Verify Key
app.get("/public/connect", (req, res) => {
  const key = req.query.key;
  const keys = readKeys();

  if (!key) return res.json({ success: false, message: "❌ Key missing!" });

  const found = keys.find(k => k.key === key);

  if (!found) return res.json({ success: false, message: "❌ Invalid key — Roni Mod Menu" });

  const now = new Date();
  const expiry = new Date(found.expiry);

  if (!found.active)
    return res.json({ success: false, message: "🔴 Key is OFF — Roni Mod Menu" });

  if (now > expiry)
    return res.json({ success: false, message: "⌛ Key expired — Roni Mod Menu" });

  found.usedOn = now.toISOString().split("T")[0];
  writeKeys(keys);

  res.json({ success: true, message: "✅ Connected successfully — Roni Mod Menu" });
});

// 🧠 Add Key
app.post("/admin/addkey", (req, res) => {
  const { newKey, days, active } = req.body;
  const keys = readKeys();

  const created = new Date();
  const expiry = new Date(created);
  expiry.setDate(created.getDate() + Number(days));

  keys.push({
    key: newKey,
    active,
    created: created.toISOString().split("T")[0],
    expiry: expiry.toISOString().split("T")[0],
    usedOn: null
  });

  writeKeys(keys);
  res.json({ success: true, message: `✅ Key ${newKey} added! Valid till ${expiry.toISOString().split("T")[0]}` });
});

// 🧾 Get All Keys (for Admin Panel)
app.get("/admin/keys", (req, res) => {
  const keys = readKeys();
  res.json(keys);
});

// 📴 Toggle Key ON/OFF
app.post("/admin/toggle", (req, res) => {
  const { key } = req.body;
  const keys = readKeys();
  const found = keys.find(k => k.key === key);
  if (!found) return res.json({ success: false, message: "❌ Key not found" });

  found.active = !found.active;
  writeKeys(keys);
  res.json({ success: true, message: `🔄 Key ${key} is now ${found.active ? "ON ✅" : "OFF ❌"}` });
});

app.listen(PORT, () => console.log(`🚀 Roni Mod Menu API running on port ${PORT}`));
// ✅ Always return JSON for invalid API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/admin") || req.path.startsWith("/public")) {
    return res.status(404).json({ success: false, message: "❌ Invalid API endpoint" });
  } else {
    // Serve frontend (index.html)
    return res.sendFile(path.resolve("public/index.html"));
  }
});
