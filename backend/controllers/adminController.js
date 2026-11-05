
const User = require("../models/user");
const Question = require("..//models/question");
const Discussion = require("../models/Discussion");
const Session = require("../models/Session");
const Report = require("../models/Report");

// Admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalQuestions,
      totalDiscussions,
      totalSessions,
      totalReports,
      pendingReports,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Discussion.countDocuments(),
      Session.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      User.countDocuments({ status: "active" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalQuestions,
        totalDiscussions,
        totalSessions,
        totalReports,
        pendingReports,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user account status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["active", "inactive", "suspended"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user status",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status",
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Protect admin accounts from deletion through this route
    if (["admin", "superadmin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be deleted here",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
