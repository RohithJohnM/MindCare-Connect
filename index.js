
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Import API routes
const routes = require("./routes/api");
const authRoutes = require("./routes/auth");
const moodRoutes = require("./routes/mood");
const counselorRoutes = require("./routes/counselors");
const appointmentRoutes = require("./routes/appointments");
const resourceRoutes = require("./routes/resources");
const aiRoutes = require("./routes/ai");

const app = express();

const CLIENT_BUILD_PATH = path.join(
    __dirname,
    "client",
    "dist"
);

const CLIENT_INDEX_PATH = path.join(
    CLIENT_BUILD_PATH,
    "index.html"
);

// ======================================
// BYTE XL API PATH COMPATIBILITY
// ======================================

// Existing frontend pages use:
// /absproxy/5173/api/...
//
// In the production Docker deployment, requests
// are redirected internally to /api/...

app.use((req, res, next) => {
    const byteXLPrefix = "/absproxy/5173";

    if (
        req.url === `${byteXLPrefix}/api` ||
        req.url.startsWith(`${byteXLPrefix}/api/`) ||
        req.url.startsWith(`${byteXLPrefix}/api?`)
    ) {
        req.url = req.url.slice(byteXLPrefix.length);
    }

    next();
});

// ======================================
// MIDDLEWARE
// ======================================

app.disable("x-powered-by");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================================
// API ROUTES
// ======================================

// Authentication
app.use("/api/auth", authRoutes);

// Mood Journal
app.use("/api/mood", moodRoutes);

// Counselor Management
app.use("/api/counselors", counselorRoutes);

// Appointment Booking
app.use("/api/appointments", appointmentRoutes);

// Resource Library
app.use("/api/resources", resourceRoutes);

// AI Wellness Assistant
app.use("/api/ai", aiRoutes);

// General API routes - keep this last
app.use("/api", routes);

// ======================================
// STATIC FRONTEND FILES
// ======================================

// Serve the production React build when available.

app.use(express.static(CLIENT_BUILD_PATH));

// ======================================
// HOME ROUTE
// ======================================

app.get("/", (req, res) => {

    if (fs.existsSync(CLIENT_INDEX_PATH)) {
        return res.sendFile(CLIENT_INDEX_PATH);
    }

    // Development fallback when no production build exists.
    return res.json({
        message: "Welcome to MindCare Connect API",
        status: "Running"
    });
});

// ======================================
// REACT ROUTER FALLBACK
// ======================================

// Supports direct navigation and page refreshes
// on routes such as /dashboard and /ai-assistant.

app.get("*", (req, res, next) => {

    // Never send React HTML for unknown API endpoints.
    if (
        req.path === "/api" ||
        req.path.startsWith("/api/")
    ) {
        return next();
    }

    if (!fs.existsSync(CLIENT_INDEX_PATH)) {
        return next();
    }

    return res.sendFile(CLIENT_INDEX_PATH);
});

// ======================================
// MONGODB CONNECTION
// ======================================

async function startServer() {

    try {

        const {
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_USER,
            DB_PASSWORD
        } = process.env;

        // Check required database variables.
        if (
            !DB_HOST ||
            !DB_PORT ||
            !DB_NAME ||
            !DB_USER ||
            !DB_PASSWORD
        ) {
            throw new Error(
                "Missing MongoDB environment variables."
            );
        }

        // Construct database connection string.
        const mongoURI =
            `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

        await mongoose.connect(mongoURI, {
            user: DB_USER,
            pass: DB_PASSWORD,
            authSource: DB_NAME,
            serverSelectionTimeoutMS: 15000
        });

        console.log("MongoDB connected successfully!");

        // Use the port assigned by the deployment platform.
        const PORT = process.env.PORT || 5000;

        app.listen(PORT, "0.0.0.0", () => {
            console.log(
                `MindCare Connect server running on port ${PORT}`
            );

            console.log(
                fs.existsSync(CLIENT_INDEX_PATH)
                    ? "Production React frontend is available."
                    : "React production build not found. API mode is active."
            );
        });

    } catch (error) {

        console.error(
            "Connection Error:",
            error.message
        );

        process.exit(1);
    }
}

// ======================================
// START APPLICATION
// ======================================

startServer();
