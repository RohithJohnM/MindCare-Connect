const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { authenticate } = require("../middleware/auth");

const router = express.Router();


// Generate JWT Token
const generateToken = (userId) => {

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

};


// Public user details
const getPublicUser = (user) => {

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
    };

};


// USER REGISTRATION
router.post("/register", async (req, res) => {

    try {

        const { name, email, password, phone } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        // Validate input types
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            (phone !== undefined && typeof phone !== "string")
        ) {
            return res.status(400).json({
                message: "Invalid input format"
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length < 2 || cleanName.length > 80) {
            return res.status(400).json({
                message: "Name must contain 2 to 80 characters"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                message: "Enter a valid email address"
            });
        }

        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({
                message: "Password must contain 8 to 128 characters"
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Create new user
        // Role is always user during public registration
        const newUser = new User({
            name: cleanName,
            email: cleanEmail,
            password,
            phone: phone ? phone.trim() : "",
            role: "user"
        });

        await newUser.save();

        // Generate token
        const token = generateToken(newUser._id);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: getPublicUser(newUser)
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        console.error("Registration Error:", error.message);

        res.status(500).json({
            message: "Registration failed"
        });

    }

});


// USER LOGIN
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // Validate fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user including password
        const user = await User.findOne({
            email: cleanEmail
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account is inactive"
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: getPublicUser(user)
        });

    } catch (error) {

        console.error("Login Error:", error.message);

        res.status(500).json({
            message: "Login failed"
        });

    }

});


// GET LOGGED-IN USER PROFILE
router.get("/me", authenticate, async (req, res) => {

    res.status(200).json({
        success: true,
        user: getPublicUser(req.user)
    });

});


module.exports = router;