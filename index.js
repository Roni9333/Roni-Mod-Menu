const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Welcome to RONI API SYSTEM 🔥");
});

app.get("/verify", (req, res) => {
  const key = req.query.key;
  if (key === "RONI123") {
    res.json({ success: true, message: "Key verified ✅" });
  } else {
    res.json({ success: false, message: "Invalid key ❌" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
