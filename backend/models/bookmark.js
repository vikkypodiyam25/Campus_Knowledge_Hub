const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    contentType: {
        type: String,
        enum: ["question", "discussion"],
        required: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, { timestamps: true });

bookmarkSchema.index(
    { user: 1, contentType: 1, contentId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Bookmark", bookmarkSchema);