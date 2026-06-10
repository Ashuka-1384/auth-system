const express = require("express");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ============ REGISTER ============
router.post(
  "/register",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("نام باید بین ۲ تا ۱۰۰ کاراکتر باشد"),
    body("email").isEmail().withMessage("ایمیل معتبر نیست").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("رمز عبور باید حداقل ۶ کاراکتر باشد")
      .matches(/\d/)
      .withMessage("رمز عبور باید حداقل یک عدد داشته باشد"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { fullName, email, password } = req.body;

      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "این ایمیل قبلاً ثبت شده است",
        });
      }

      const user = await User.create({
        full_name: fullName,
        email,
        password,
      });

      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: "ثبت نام با موفقیت انجام شد",
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error("Register Error:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: "این ایمیل قبلاً ثبت شده است",
        });
      }

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message,
        });
      }

      res.status(500).json({
        success: false,
        message: "خطا در سرور. لطفاً دوباره تلاش کنید",
      });
    }
  },
);

// ============ LOGIN ============
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("ایمیل معتبر نیست"),
    body("password").notEmpty().withMessage("رمز عبور الزامی است"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { email, password } = req.body;

      const user = await User.scope("withPassword").findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "ایمیل یا رمز عبور اشتباه است",
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: "حساب کاربری شما غیرفعال شده است",
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "ایمیل یا رمز عبور اشتباه است",
        });
      }

      await user.update({
        last_login: new Date(),
        login_count: user.login_count + 1,
      });

      const token = generateToken(user.id);

      res.json({
        success: true,
        message: "ورود موفقیت‌آمیز",
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({
        success: false,
        message: "خطا در سرور",
      });
    }
  },
);

// ============ GET CURRENT USER ============
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "کاربر یافت نشد",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        lastLogin: user.last_login,
        loginCount: user.login_count,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطا در دریافت اطلاعات",
    });
  }
});

// ============ UPDATE PROFILE ============
router.put(
  "/update-profile",
  protect,
  [
    body("fullName").optional().trim().isLength({ min: 2, max: 100 }),
    body("email").optional().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    try {
      const { fullName, email } = req.body;
      const updateData = {};

      if (fullName) updateData.full_name = fullName;

      if (email) {
        const existing = await User.findOne({
          where: {
            email: email.toLowerCase(),
            id: { [Op.ne]: req.user.id },
          },
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: "این ایمیل قبلاً استفاده شده است",
          });
        }
        updateData.email = email;
      }

      await User.update(updateData, { where: { id: req.user.id } });
      const updatedUser = await User.findByPk(req.user.id);

      res.json({
        success: true,
        message: "پروفایل بروزرسانی شد",
        user: {
          id: updatedUser.id,
          fullName: updatedUser.full_name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی",
      });
    }
  },
);

// ============ CHANGE PASSWORD ============
router.put(
  "/change-password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("رمز فعلی الزامی است"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("رمز جدید باید حداقل ۶ کاراکتر باشد"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.scope("withPassword").findByPk(req.user.id);

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "رمز عبور فعلی اشتباه است",
        });
      }

      user.password = newPassword;
      await user.save();

      const token = generateToken(user.id);

      res.json({
        success: true,
        message: "رمز عبور تغییر کرد",
        token,
      });
    } catch (error) {
      console.error("Change Password Error:", error);
      res.status(500).json({
        success: false,
        message: "خطا در تغییر رمز عبور",
      });
    }
  },
);

module.exports = router;
