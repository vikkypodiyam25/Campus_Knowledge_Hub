
const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Public route
router.get("/", getAllCategories);

// Admin/moderator routes
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin", "superadmin", "moderator"),
  createCategory
);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "superadmin", "moderator"),
  updateCategory
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin", "superadmin"),
  deleteCategory
);

module.exports = router;
