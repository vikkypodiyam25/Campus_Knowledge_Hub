require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");


const questionRoutes = require("./routes/questionRoutes");
const answerRoutes = require("./routes/answerRoutes");

app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);



const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");

app.use("/api/discussions", discussionRoutes);
app.use("/api/comments", commentRoutes);


const sessionRoutes = require("./routes/sessionRoutes");

app.use("/api/sessions", sessionRoutes);

const bookmarkRoutes = require("./routes/bookmarkRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notifications", notificationRoutes);

const reportRoutes = require("./routes/reportRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);

const adminRoutes = require("./routes/adminRoutes");

app.use("/api/admin", adminRoutes);

const adminModerationRoutes = require("./routes/adminModerationRoutes");

app.use("/api/admin", adminModerationRoutes);

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    })
);

// Routes
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to LearnConnect Backend"
    });
});

app.use("/api/auth", authRoutes);

// Start server after database connection
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.log("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();