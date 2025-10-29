import express from "express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔑 Function to read keys from file
function getKeys() {
  const data = fs.readFileSync("./keys.json");
  return JSON.parse(data).keys;
}

// 🏠 Default route for homepage
app.get("/", (req, res) => {
  res.send(`
    <center>
      <h1 style="color:#00ff88;">🚀 Roni Mod Menu API Server</h1>
      <p>✅ Server is running successfully!</p>
      <p>Use endpoint: <b>/public/connect?key=yourkey</b></p>
    </center>
  `);
});

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

// 🧠 Admin: Add new key
app.post("/admin/addkey", (req, res) => {
  const { newKey } = req.body;
  const data = JSON.parse(fs.readFileSync("./keys.json"));
  data.keys.push(newKey);
  fs.writeFileSync("./keys.json", JSON.stringify(data, null, 2));
  res.json({ success: true, message: `✅ Key ${newKey} added successfully!` });
});

app.listen(PORT, () => console.log(`🚀 Roni Mod Menu API running on port ${PORT}`));
