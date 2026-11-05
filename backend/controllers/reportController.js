
const Report = require("../models/Report");

// Create report
exports.createReport = async (req, res) => {
  try {
    const { contentType, contentId, reason, description } = req.body;

    const allowedTypes = [
      "question",
      "answer",
      "discussion",
      "comment",
    ];

    if (
      !allowedTypes.includes(contentType) ||
      !contentId ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid content type, content ID and reason are required",
      });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      contentType,
      contentId,
      reason,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get reports submitted by logged-in user
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({
      reportedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
