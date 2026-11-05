const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
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
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["active", "hidden"],
        default: "active"
    }
}, { timestamps: true });

module.exports = mongoose.model("Discussion", discussionSchema);