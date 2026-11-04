
const express = require("express");
const mongoose = require("mongoose");

const MoodEntry = require("../models/MoodEntry");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// All mood routes require authentication
router.use(authenticate);


// GET: Retrieve the logged-in user's mood history
router.get("/", async (req, res) => {
    try {
        const entries = await MoodEntry.find({
            user: req.user._id
        })
            .sort({ entryDate: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: entries.length,
            entries
        });

    } catch (error) {
        console.error("Mood history error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve mood history"
        });
    }
});


// POST: Create a new mood entry
router.post("/", async (req, res) => {
    try {
        const { mood, intensity, note } = req.body;

        const validMoods = [
            "great",
            "good",
            "okay",
            "low",
            "anxious",
            "stressed"
        ];

        if (!validMoods.includes(mood)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid mood"
            });
        }

        if (
            intensity !== undefined &&
            (!Number.isInteger(intensity) ||
             intensity < 1 ||
             intensity > 5)
        ) {
            return res.status(400).json({
                success: false,
                message: "Intensity must be between 1 and 5"
            });
        }

        if (
            note !== undefined &&
            (typeof note !== "string" || note.length > 1000)
        ) {
            return res.status(400).json({
                success: false,
                message: "Note must be text with a maximum of 1000 characters"
            });
        }

        const entry = await MoodEntry.create({
            user: req.user._id,
            mood,
            intensity: intensity ?? 3,
            note: note ?? ""
        });

        res.status(201).json({
            success: true,
            message: "Mood entry saved successfully",
            entry
        });

    } catch (error) {
        console.error("Create mood error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save mood entry"
        });
    }
});


// DELETE: Delete an entry owned by the logged-in user
router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mood entry ID"
            });
        }

        const entry = await MoodEntry.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Mood entry not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Mood entry deleted successfully"
        });

    } catch (error) {
        console.error("Delete mood error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete mood entry"
        });
    }
});

module.exports = router;
