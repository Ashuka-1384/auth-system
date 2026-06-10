const { DataTypes, Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/db");

const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: "نام باید بین ۲ تا ۱۰۰ کاراکتر باشد",
        },
        notEmpty: {
          msg: "نام کامل الزامی است",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: "این ایمیل قبلاً ثبت شده است",
      },
      validate: {
        isEmail: {
          msg: "ایمیل معتبر نیست",
        },
        notEmpty: {
          msg: "ایمیل الزامی است",
        },
      },
      set(value) {
        this.setDataValue("email", value.toLowerCase().trim());
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: "رمز عبور باید حداقل ۶ کاراکتر باشد",
        },
      },
    },
    role: {
      type: DataTypes.ENUM("user", "admin", "moderator"),
      defaultValue: "user",
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    // تنظیمات اضافی
    tableName: "users",
    timestamps: true,
    underscored: true,

    // ایندکس‌ها برای عملکرد بهتر
    indexes: [
      { unique: true, fields: ["email"] },
      { fields: ["role"] },
      { fields: ["is_active"] },
      { fields: ["created_at"] },
    ],

    // فیلدهایی که در JSON نمایش داده نشن
    defaultScope: {
      attributes: { exclude: ["password"] },
    },

    // اسکوپ سفارشی برای وقتایی که پسورد لازمه
    scopes: {
      withPassword: {
        attributes: { include: ["password"] },
      },
    },
  },
);

// ============ Hooks ============

// هش کردن رمز عبور قبل از ذخیره
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// ============ Instance Methods ============

// مقایسه رمز عبور
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// تولید initials از نام
User.prototype.getInitials = function () {
  return this.full_name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// خروجی امن (بدون پسورد)
User.prototype.toSafeJSON = function () {
  const values = this.toJSON();
  delete values.password;
  return values;
};

module.exports = User;
