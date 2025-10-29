import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 🔒 Secret key (must match the C++ code)
const SECRET = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";

// 🗝️ Dummy database (keys you will allow)
const VALID_KEYS = [
  "RONI-1234",
  "TEST-1111",
  "6294",
];

// ✅ /public/connect endpoint
app.post("/public/connect", (req, res) => {
  const { user_key, serial, game } = req.body;

  if (!user_key || !serial) {
    return res.json({ status: false, reason: "Missing parameters" });
  }

  // Check if key is valid
  if (!VALID_KEYS.includes(user_key)) {
    return res.json({ status: false, reason: "Invalid key" });
  }

  // 🧠 Generate the same MD5 auth like C++ side
  const authString = `PUBG-${user_key}-${serial}-${SECRET}`;
  const md5 = crypto.createHash("md5").update(authString).digest("hex");

  const rng = Math.floor(Date.now() / 1000); // current time

  return res.json({
    status: true,
    data: {
      token: md5,
      rng: rng
    }
  });
});

// 🧹 Optional — Key delete / manage route (for admin panel later)
app.post("/admin/delete", (req, res) => {
  const { key } = req.body;
  const index = VALID_KEYS.indexOf(key);
  if (index !== -1) {
    VALID_KEYS.splice(index, 1);
    return res.json({ status: true, message: "Key deleted" });
  } else {
    return res.json({ status: false, message: "Key not found" });
  }
});

// 🌐 Test route
app.get("/", (req, res) => {
  res.send("✅ RONI MOD MENU API is live!");
});

// ⚡ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
