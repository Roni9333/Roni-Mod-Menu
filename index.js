import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Keys read function
function getKeys() {
  const data = fs.readFileSync("./keys.json");
  return JSON.parse(data).keys;
}

// ✅ API verify route
app.get("/public/connect", (req, res) => {
  const key = req.query.key;
  const validKeys = getKeys();

  if (!key) {
    return res.json({ success: false, message: "❌ Key missing!" });
  }

  if (validKeys.includes(key)) {
    res.json({ success: true, message: "✅ Connected successfully — Roni Mod Menu" });
  } else {
    res.json({ success: false, message: "❌ Invalid key — Roni Mod Menu" });
  }
});

// 🧠 Admin: Add key
app.post("/admin/addkey", (req, res) => {
  const { newKey } = req.body;
  const data = JSON.parse(fs.readFileSync("./keys.json"));
  data.keys.push(newKey);
  fs.writeFileSync("./keys.json", JSON.stringify(data, null, 2));
  res.json({ success: true, message: `✅ Key ${newKey} added successfully!` });
});

app.listen(PORT, () => console.log(`🚀 Roni Mod Menu API running on port ${PORT}`));
