
const Session = require("../models/Session");

// Create a session
exports.createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      startTime,
      duration,
      meetingLink,
    } = req.body;

    if (!title || !description || !date || !startTime || !duration) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const session = await Session.create({
      title,
      description,
      category,
      date,
      startTime,
      duration,
      meetingLink,
      host: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all sessions
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("host", "name username")
      .populate("category", "name")
      .populate("participants", "name username")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("host", "name username")
      .populate("category", "name")
      .populate("participants", "name username");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Register for a session
exports.registerSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.host.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Host cannot register for their own session",
      });
    }

    const alreadyRegistered = session.participants.some(
      (participantId) =>
        participantId.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "You are already registered",
      });
    }

    session.participants.push(req.user._id);
    await session.save();

    res.status(200).json({
      success: true,
      message: "Registered for session successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Unregister from a session
exports.unregisterSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    session.participants = session.participants.filter(
      (participantId) =>
        participantId.toString() !== req.user._id.toString()
    );

    await session.save();

    res.status(200).json({
      success: true,
      message: "Unregistered from session successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update session status (only host can update)
exports.updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "approved",
      "rejected",
      "upcoming",
      "ongoing",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session status",
      });
    }

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the host can update session status",
      });
    }

    session.status = status;
    await session.save();

    res.status(200).json({
      success: true,
      message: "Session status updated successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
