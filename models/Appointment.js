
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        // User requesting the appointment
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Counselor receiving the appointment
        counselor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Counselor professional profile
        counselorProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CounselorProfile",
            required: true
        },

        // Appointment date
        appointmentDate: {
            type: Date,
            required: true
        },

        // Appointment time in HH:mm format
        startTime: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        },

        endTime: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):([0-5]\d)$/
        },

        // Session duration in minutes
        durationMinutes: {
            type: Number,
            required: true,
            min: 15,
            default: 50
        },

        // Consultation type
        consultationMode: {
            type: String,
            enum: ["online", "in-person"],
            required: true
        },

        // Reason for appointment
        reason: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        // Appointment status
        status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "rejected",
                "cancelled",
                "completed"
            ],
            default: "pending"
        },

        // Optional counselor response
        counselorMessage: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        }
    },
    {
        timestamps: true
    }
);


// User appointment history
appointmentSchema.index({
    user: 1,
    appointmentDate: -1
});

// Counselor appointment schedule
appointmentSchema.index({
    counselor: 1,
    appointmentDate: 1,
    startTime: 1
});

module.exports = mongoose.model(
    "Appointment",
    appointmentSchema
);
