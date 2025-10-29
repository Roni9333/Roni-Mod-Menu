// 🏠 Default route for homepage
app.get("/", (req, res) => {
  res.send(`
    <center>
      <h1 style="color:#00ff88;">🚀 Roni Mod Menu API Server</h1>
      <p>✅ Server is running successfully!</p>
      <p>Use endpoint: <b>/public/connect?key=yourkey</b></p>
      <p>Admin Panel: <a href="/admin">Click Here</a></p>
    </center>
  `);
});
