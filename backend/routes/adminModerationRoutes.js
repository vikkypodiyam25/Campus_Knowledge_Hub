
const express = require("express");
const router = express.Router();

const {
  updateQuestionStatus,
  deleteQuestion,
  updateDiscussionStatus,
  deleteDiscussion,
  deleteAnswer,
  deleteComment,
  reviewSession,
  getAllReports,
  reviewReport,
} = require("../controllers/adminModerationController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Admin authentication
router.use(authMiddleware);
router.use(authorizeRoles("admin", "superadmin"));

// Question moderation
router.patch("/questions/:id/status", updateQuestionStatus);
router.delete("/questions/:id", deleteQuestion);

// Discussion moderation
router.patch("/discussions/:id/status", updateDiscussionStatus);
router.delete("/discussions/:id", deleteDiscussion);

// Answer and comment moderation
router.delete("/answers/:id", deleteAnswer);
router.delete("/comments/:id", deleteComment);

// Session moderation
router.patch("/sessions/:id/review", reviewSession);

// Report management
router.get("/reports", getAllReports);
router.patch("/reports/:id/review", reviewReport);

module.exports = router;
