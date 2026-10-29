const path = require("path");


try {
  process.loadEnvFile(path.join(__dirname, ".env"));
} catch {

}

const express = require("express");
const { connect } = require("./db/connection");
const { loadUser } = require("./middleware/auth");
const { UPLOAD_DIR } = require("./middleware/upload");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use("/uploads", express.static(UPLOAD_DIR, { fallthrough: true, maxAge: "7d" }));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "manna-backend" }));

app.use("/api", loadUser);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/friends", require("./routes/friends"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/albums", require("./routes/albums"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/misc"));

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set. See backend/.env.example.");
  await connect();
  console.log("Connected to MongoDB Atlas.");
  app.listen(PORT, () => console.log(`Manna backend listening on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});
