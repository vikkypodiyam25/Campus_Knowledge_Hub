const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    tags: [String],
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    status: {
        type: String,
        enum: ["unanswered", "answered", "resolved"],
        default: "unanswered"
    },
    isPinned: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);