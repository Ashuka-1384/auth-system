require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { connectDB } = require("./config/db");

const app = express();

// Connect to PostgreSQL
connectDB();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "تعداد درخواست‌ها بیش از حد مجاز. لطفاً بعداً تلاش کنید",
  },
});

// Static files
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/users", require("./routes/users"));

// HTML Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "مسیر مورد نظر یافت نشد" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: "خطای داخلی سرور" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚀 Server Running on Port ${PORT}        ║
  ║   📱 http://localhost:${PORT}              ║
  ║   📊 http://localhost:${PORT}/dashboard    ║
  ║   🐘 Database: PostgreSQL                ║
  ╚══════════════════════════════════════════╝
  `);
});
