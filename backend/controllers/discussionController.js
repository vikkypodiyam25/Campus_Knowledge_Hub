
const Discussion = require("../models/Discussion");

// Create discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const discussion = await Discussion.create({
      title,
      description,
      category,
      tags,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Discussion created successfully",
      data: discussion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all discussions
exports.getAllDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("author", "name username")
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: discussions.length,
      data: discussions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update own discussion
exports.updateDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (discussion.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot update another user's discussion",
      });
    }

    const { title, description, category, tags } = req.body;

    if (title !== undefined) discussion.title = title;
    if (description !== undefined) discussion.description = description;
    if (category !== undefined) discussion.category = category;
    if (tags !== undefined) discussion.tags = tags;

    await discussion.save();

    res.status(200).json({
      success: true,
      message: "Discussion updated successfully",
      data: discussion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete own discussion
exports.deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (discussion.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete another user's discussion",
      });
    }

    await discussion.deleteOne();

    res.status(200).json({
      success: true,
      message: "Discussion deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
