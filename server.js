const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const KEYS_FILE = "keys.json";

// Load keys
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
    return res.json({ valid: true, message: "✅ Key is valid" });
  } else {
    return res.json({ valid: false, message: "❌ Invalid key" });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to Roni API System 💪🔥");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
