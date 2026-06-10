require("dotenv").config();
const { connectDB, sequelize } = require("./config/db");
const User = require("./models/User");

(async () => {
  try {
    await connectDB();
    await sequelize.sync({ force: false });

    const existing = await User.findOne({
      where: { email: "admin@admin.com" },
    });

    if (existing) {
      console.log("⚠️  Admin already exists!");
      console.log("📧 Email: admin@admin.com\n");
      process.exit(0);
    }

    const admin = await User.create({
      full_name: "مدیر سیستم",
      email: "admin@admin.com",
      password: "Admin@123",
      role: "admin",
    });

    console.log("\n╔══════════════════════════════════════╗");
    console.log("║   ✅ Admin Created Successfully!     ║");
    console.log("╠══════════════════════════════════════╣");
    console.log("║   📧 Email:    admin@admin.com       ║");
    console.log("║   🔑 Password: Admin@123             ║");
    console.log("║   👤 Role:     admin                 ║");
    console.log("╚══════════════════════════════════════╝\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
