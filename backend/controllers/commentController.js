
const Comment = require("../models/Comment");
const Discussion = require("../models/Discussion");

// Create comment
exports.createComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const { discussionId } = req.params;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const comment = await Comment.create({
      discussion: discussionId,
      author: req.user._id,
      content,
      parentComment: parentComment || null,
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get comments of a discussion
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      discussion: req.params.discussionId,
    })
      .populate("author", "name username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete own comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete another user's comment",
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
