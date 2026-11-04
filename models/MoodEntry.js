
const mongoose = require("mongoose");

const moodEntrySchema = new mongoose.Schema(
    {
        // User who created this mood entry
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Selected mood
        mood: {
            type: String,
            required: true,
            enum: [
                "great",
                "good",
                "okay",
                "low",
                "anxious",
                "stressed"
            ]
        },

        // Emotional intensity from 1 to 5
        intensity: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            default: 3
        },

        // Optional personal reflection
        note: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        // Date of the mood entry
        entryDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Efficiently retrieve a user's mood history
moodEntrySchema.index({
    user: 1,
    entryDate: -1
});

module.exports = mongoose.model("MoodEntry", moodEntrySchema);
