
const Bookmark = require("../models/bookmark");
const Question = require("../models/question");
const Discussion = require("../models/Discussion");

// Add bookmark
exports.addBookmark = async (req, res) => {
  try {
    const { contentType, contentId } = req.body;

    if (!["question", "discussion"].includes(contentType) || !contentId) {
      return res.status(400).json({
        success: false,
        message: "Valid contentType and contentId are required",
      });
    }

    // Check whether the content exists
    const Model = contentType === "question" ? Question : Discussion;
    const content = await Model.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      contentType,
      contentId,
    });

    if (existingBookmark) {
      return res.status(409).json({
        success: false,
        message: "Already bookmarked",
      });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      contentType,
      contentId,
    });

    res.status(201).json({
      success: true,
      message: "Bookmark added successfully",
      data: bookmark,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get logged-in user's bookmarks
exports.getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    const populatedBookmarks = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const Model =
          bookmark.contentType === "question" ? Question : Discussion;

        const content = await Model.findById(bookmark.contentId)
          .populate("author", "name username");

        return {
          ...bookmark.toObject(),
          content,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: populatedBookmarks.length,
      data: populatedBookmarks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove bookmark
exports.removeBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
