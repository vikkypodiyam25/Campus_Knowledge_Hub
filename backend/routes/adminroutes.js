
const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// All routes require admin authentication
router.use(authMiddleware);
router.use(authorizeRoles("admin", "superadmin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

module.exports = router;
