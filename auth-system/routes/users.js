const express = require("express");
const { Op } = require("sequelize");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

// ============ STATS ============
router.get("/stats/overview", async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const adminCount = await User.count({ where: { role: "admin" } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogins = await User.count({
      where: { last_login: { [Op.gte]: today } },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.count({
      where: { created_at: { [Op.gte]: weekAgo } },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        adminCount,
        todayLogins,
        newUsersThisWeek,
      },
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ success: false, message: "خطا در دریافت آمار" });
  }
});

// ============ LIST USERS ============
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (role) where.role = role;
    if (status === "active") where.is_active = true;
    if (status === "inactive") where.is_active = false;

    const { count: total, rows: users } = await User.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    const formattedUsers = users.map((user) => ({
      _id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List Users Error:", error);
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت لیست کاربران" });
  }
});

// ============ GET ONE USER ============
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد" });
    }

    res.json({
      success: true,
      user: {
        _id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        lastLogin: user.last_login,
        loginCount: user.login_count,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "خطا در دریافت اطلاعات کاربر" });
  }
});

// ============ UPDATE USER ============
router.put("/:id", async (req, res) => {
  try {
    const { fullName, email, role, isActive } = req.body;
    const updateData = {};

    if (fullName) updateData.full_name = fullName;
    if (email) {
      const existing = await User.findOne({
        where: {
          email: email.toLowerCase(),
          id: { [Op.ne]: req.params.id },
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
    if (role) updateData.role = role;
    if (typeof isActive === "boolean") updateData.is_active = isActive;

    const [affectedRows] = await User.update(updateData, {
      where: { id: req.params.id },
    });

    if (affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد" });
    }

    const user = await User.findByPk(req.params.id);

    res.json({
      success: true,
      message: "اطلاعات کاربر بروزرسانی شد",
      user: {
        _id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ success: false, message: "خطا در بروزرسانی" });
  }
});

// ============ DELETE USER ============
router.delete("/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "نمیتوانید حساب خودتان را حذف کنید",
      });
    }

    const deleted = await User.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد" });
    }

    res.json({ success: true, message: "کاربر حذف شد" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: "خطا در حذف کاربر" });
  }
});

module.exports = router;
