const User = require("../models/user");
const jwt = require("jsonwebtoken");

const createToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
};

const setTokenCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });
};

// Register
const register = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email or username already exists"
            });
        }

        const user = new User({
            name,
            username,
            email,
            password,
            role: "student"
        });

        await user.save();

        const token = createToken(user._id);

        setTokenCookie(res, token);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is not active"
            });
        }

        const token = createToken(user._id);

        setTokenCookie(res, token);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

// Logout
const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === "true",
        sameSite: "lax"
    });

    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

// Get logged-in user
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Could not fetch user"
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe
};