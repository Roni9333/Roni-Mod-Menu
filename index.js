<!DOCTYPE html>
<html>
<head>
  <title>Roni API System</title>
</head>
<body>
  <h1>Welcome to Roni API System</h1>
  <p>Enter your key to verify:</p>
  <input id="key" placeholder="Enter API key" />
  <button id="check">Verify</button>

  <script>
    document.getElementById("check").addEventListener("click", async () => {
      const key = document.getElementById("key").value.trim();
      const res = await fetch(`/verify?key=${key}`);
      const data = await res.json();
      if (data.valid) alert("✅ Key is valid!");
      else alert("❌ Invalid key!");
    });
  </script>
</body>
</html>
