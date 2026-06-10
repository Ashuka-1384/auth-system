const { DataTypes } = require("sequelize");
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
    tableName: "users",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["email"] },
      { fields: ["role"] },
      { fields: ["is_active"] },
      { fields: ["created_at"] },
    ],
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ["password"] },
      },
    },
  },
);

// Hash password before create
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Hash password before update
User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Compare password method
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
