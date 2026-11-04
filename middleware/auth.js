const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify user authentication
const authenticate = async (req, res, next) => {

    try {

        // Get token from request header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Authentication configuration error"
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user in database
        const user = await User.findById(decoded.userId)
            .select("-password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                message: "Invalid or inactive account"
            });
        }

        // Store user information
        req.user = user;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
};


// Check user role
const authorize = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};


module.exports = {
    authenticate,
    authorize
};