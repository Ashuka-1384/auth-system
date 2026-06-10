const { Sequelize } = require("sequelize");

// ساخت اتصال به PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false, // اگه لاگ کوئری‌ها رو میخای: console.log
    pool: {
      max: 20, // حداکثر اتصال همزمان
      min: 2, // حداقل اتصال
      acquire: 60000, // زمان انتظار برای اتصال
      idle: 10000, // زمان بیکاری قبل از بسته شدن
    },
    define: {
      timestamps: true, // createdAt, updatedAt
      underscored: true, // snake_case برای ستون‌ها
      freezeTableName: true, // اسم جدول تغییر نکنه
    },
    dialectOptions: {
      // اگه SSL لازمه (مثلاً برای سرور ابری)
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false
      // }
    },
  },
);

// تست اتصال
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected Successfully");
    console.log(`📦 Database: ${process.env.DB_NAME}`);
    console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

    // سینک کردن مدل‌ها با دیتابیس (ساخت جداول)
    await sequelize.sync({ alter: false });
    console.log("✅ All tables synced");
  } catch (error) {
    console.error("❌ PostgreSQL Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
