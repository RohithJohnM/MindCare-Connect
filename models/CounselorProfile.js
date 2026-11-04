
const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
    {
        day: {
            type: String,
            required: true,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ]
        },

        startTime: {
            type: String,
            required: true
        },

        endTime: {
            type: String,
            required: true
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    { _id: false }
);


const counselorProfileSchema = new mongoose.Schema(
    {
        // Link profile to an existing counselor account
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        specialization: {
            type: [String],
            required: true
        },

        qualification: {
            type: String,
            required: true,
            trim: true
        },

        experienceYears: {
            type: Number,
            required: true,
            min: 0
        },

        bio: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1500
        },

        languages: {
            type: [String],
            default: []
        },

        consultationFee: {
            type: Number,
            required: true,
            min: 0
        },

        sessionDuration: {
            type: Number,
            default: 50,
            min: 15
        },

        consultationMode: {
            type: String,
            enum: ["online", "in-person", "both"],
            default: "online"
        },

        availability: {
            type: [availabilitySchema],
            default: []
        },

        profileImage: {
            type: String,
            default: ""
        },

        // Only approved counselors appear in public listings
        isApproved: {
            type: Boolean,
            default: false
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// Find approved, active counselors efficiently
counselorProfileSchema.index({
    isApproved: 1,
    isActive: 1
});

module.exports = mongoose.model(
    "CounselorProfile",
    counselorProfileSchema
);
