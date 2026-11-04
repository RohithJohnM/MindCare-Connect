const express = require("express");

const router = express.Router();

// Test API
router.get("/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "MindCare Connect API is working!"
    });
});

module.exports = router;