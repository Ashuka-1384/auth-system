require("dotenv").config();
const { connectDB, sequelize } = require("./config/db");
const User = require("./models/User");

async function createAdmin() {
  try {
    // اتصال به دیتابیس
    await connectDB();

    // سینک جداول (ساخت اگه وجود نداره)
    await sequelize.sync({ force: false });
    console.log("✅ Tables synced");

    // بررسی وجود ادمین
    const existing = await User.findOne({
      where: { email: "admin@admin.com" },
    });

    if (existing) {
      console.log("⚠️  Admin already exists!");
      console.log("📧 Email: admin@admin.com");
      process.exit(0);
    }

    // ساخت ادمین
    const admin = await User.create({
      full_name: "مدیر سیستم",
      email: "admin@admin.com",
      password: "Admin@123",
      role: "admin",
    });

    console.log("");
    console.log("✅ Admin created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:    admin@admin.com");
    console.log("🔑 Password: Admin@123");
    console.log("👤 Role:     admin");
    console.log("🆔 ID:       " + admin.id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
