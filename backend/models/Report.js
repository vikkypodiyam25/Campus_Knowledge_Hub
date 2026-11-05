const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    contentType: {
        type: String,
        enum: ["question", "answer", "discussion", "comment"],
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    status: {
        type: String,
        enum: ["pending", "under_review", "resolved", "rejected"],
        default: "pending"
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

module.exports = mongoose.model("Report", reportSchema);