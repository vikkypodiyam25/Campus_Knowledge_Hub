const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    meetingLink: {
        type: String,
        default: ""
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: String,
        enum: [
            "pending", "approved", "rejected",
            "upcoming", "ongoing", "completed", "cancelled"
        ],
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);