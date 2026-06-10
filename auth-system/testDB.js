require("dotenv").config();
const { Sequelize } = require("sequelize");

console.log("\n🔍 Testing PostgreSQL Connection...\n");
console.log("📋 Configuration:");
console.log(`   Host:     ${process.env.DB_HOST}`);
console.log(`   Port:     ${process.env.DB_PORT}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   User:     ${process.env.DB_USER}`);
console.log(
  `   Password: ${"*".repeat(process.env.DB_PASSWORD?.length || 0)}\n`,
);

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  },
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection Successful!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection Failed!");
    console.error(`🔍 Error: ${error.message}\n`);
    console.log("💡 Possible solutions:");
    console.log(
      "   1. Check PostgreSQL is running (Services > postgresql-x64-XX)",
    );
    console.log("   2. Verify DB_PASSWORD in .env file");
    console.log("   3. Verify database name exists");
    console.log("   4. Check host is localhost (not your PC name)\n");
    process.exit(1);
  }
})();
