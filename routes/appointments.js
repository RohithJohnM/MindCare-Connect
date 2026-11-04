
const express = require("express");
const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const CounselorProfile = require("../models/CounselorProfile");

const {
    authenticate,
    authorize
} = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);


// ======================================
// HELPER FUNCTIONS
// ======================================

// Validate YYYY-MM-DD date
function parseAppointmentDate(value) {
    if (typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return date;
}


// Validate HH:mm time
function isValidTime(value) {
    return typeof value === "string" &&
        /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}


// Calculate session end time
function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(":").map(Number);

    const totalMinutes = hours * 60 + minutes + duration;

    // Sessions cannot extend past midnight
    if (totalMinutes >= 1440) {
        return null;
    }

    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    return (
        String(endHours).padStart(2, "0") +
        ":" +
        String(endMinutes).padStart(2, "0")
    );
}


// Get weekday for a calendar date
function getWeekday(date) {
    return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC"
    });
}


// Check whether appointment time is in the future.
// MindCare Connect currently uses India Standard Time.
function isFutureAppointment(date, time) {
    const appointmentStart = new Date(
        `${date}T${time}:00+05:30`
    );

    return appointmentStart > new Date();
}


// ======================================
// 1. USER APPOINTMENT HISTORY
// ======================================

router.get(
    "/my",
    authorize("user"),
    async (req, res) => {
        try {
            const appointments = await Appointment.find({
                user: req.user._id
            })
                .populate("counselor", "name email")
                .populate(
                    "counselorProfile",
                    "specialization consultationFee"
                )
                .sort({
                    appointmentDate: -1,
                    startTime: -1
                });

            res.status(200).json({
                success: true,
                count: appointments.length,
                appointments
            });

        } catch (error) {
            console.error("User appointment error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve appointments"
            });
        }
    }
);


// ======================================
// 2. COUNSELOR APPOINTMENT HISTORY
// ======================================

router.get(
    "/counselor",
    authorize("counselor"),
    async (req, res) => {
        try {
            const appointments = await Appointment.find({
                counselor: req.user._id
            })
                .populate("user", "name email")
                .populate(
                    "counselorProfile",
                    "specialization consultationFee"
                )
                .sort({
                    appointmentDate: 1,
                    startTime: 1
                });

            res.status(200).json({
                success: true,
                count: appointments.length,
                appointments
            });

        } catch (error) {
            console.error("Counselor appointments error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve counselor appointments"
            });
        }
    }
);


// ======================================
// 3. BOOK AN APPOINTMENT
// ======================================

router.post(
    "/",
    authorize("user"),
    async (req, res) => {
        try {
            const {
                counselorProfileId,
                appointmentDate,
                startTime,
                consultationMode,
                reason
            } = req.body;


            // Validate counselor ID
            if (
                !mongoose.Types.ObjectId.isValid(
                    counselorProfileId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid counselor profile ID"
                });
            }


            // Validate appointment date
            const date = parseAppointmentDate(
                appointmentDate
            );

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid appointment date"
                });
            }


            // Validate start time
            if (!isValidTime(startTime)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid start time"
                });
            }


            // Validate appointment mode
            if (
                !["online", "in-person"].includes(
                    consultationMode
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid consultation mode"
                });
            }


            // Validate reason
            if (
                reason !== undefined &&
                (
                    typeof reason !== "string" ||
                    reason.length > 1000
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Reason must be text with a maximum of 1000 characters"
                });
            }


            // Check future appointment
            if (!isFutureAppointment(appointmentDate, startTime)) {
                return res.status(400).json({
                    success: false,
                    message: "Appointment must be scheduled in the future"
                });
            }


            // Find an approved counselor
            const profile = await CounselorProfile.findOne({
                _id: counselorProfileId,
                isApproved: true,
                isActive: true
            });

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: "Approved counselor not found"
                });
            }


            // Check consultation mode
            if (
                profile.consultationMode !== "both" &&
                profile.consultationMode !== consultationMode
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Selected consultation mode is unavailable"
                });
            }


            // Determine session duration
            const duration = profile.sessionDuration || 50;

            const endTime = calculateEndTime(
                startTime,
                duration
            );

            if (!endTime) {
                return res.status(400).json({
                    success: false,
                    message: "Appointment cannot extend past midnight"
                });
            }


            // Check weekly availability
            const weekday = getWeekday(date);

            const availableSlot = profile.availability.find(
                (slot) =>
                    slot.day === weekday &&
                    slot.isAvailable
            );

            if (!availableSlot) {
                return res.status(400).json({
                    success: false,
                    message: "Counselor is unavailable on this day"
                });
            }


            // Check whether requested time fits availability
            if (
                startTime < availableSlot.startTime ||
                endTime > availableSlot.endTime
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Requested time is outside counselor availability"
                });
            }


            // Find overlapping pending or confirmed appointments.
            // Also prevent the user from booking two overlapping sessions.
            const conflicts = await Appointment.find({
                appointmentDate: date,
                status: {
                    $in: ["pending", "confirmed"]
                },
                $or: [
                    { counselor: profile.user },
                    { user: req.user._id }
                ]
            });

            const hasConflict = conflicts.some(
                (existing) =>
                    startTime < existing.endTime &&
                    endTime > existing.startTime
            );

            if (hasConflict) {
                return res.status(409).json({
                    success: false,
                    message: "This time slot conflicts with an existing appointment"
                });
            }


            // Create appointment request
            const appointment = await Appointment.create({

                user: req.user._id,

                counselor: profile.user,

                counselorProfile: profile._id,

                appointmentDate: date,

                startTime,

                endTime,

                durationMinutes: duration,

                consultationMode,

                reason: reason || "",

                status: "pending"

            });


            res.status(201).json({
                success: true,
                message: "Appointment request submitted successfully",
                appointment
            });

        } catch (error) {
            console.error("Appointment booking error:", error);

            res.status(
                error.name === "ValidationError" ? 400 : 500
            ).json({
                success: false,
                message:
                    error.name === "ValidationError"
                        ? error.message
                        : "Unable to create appointment"
            });
        }
    }
);


// ======================================
// 4. COUNSELOR RESPONDS TO REQUEST
// ======================================

router.patch(
    "/:id/respond",
    authorize("counselor"),
    async (req, res) => {
        try {
            const {
                status,
                counselorMessage
            } = req.body;


            if (
                !["confirmed", "rejected"].includes(status)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be confirmed or rejected"
                });
            }


            if (
                counselorMessage !== undefined &&
                (
                    typeof counselorMessage !== "string" ||
                    counselorMessage.length > 500
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Counselor message must not exceed 500 characters"
                });
            }


            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid appointment ID"
                });
            }


            // Counselor can only respond to their own appointments
            const appointment = await Appointment.findOne({
                _id: req.params.id,
                counselor: req.user._id,
                status: "pending"
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: "Pending appointment not found"
                });
            }


            appointment.status = status;
            appointment.counselorMessage =
                counselorMessage || "";

            await appointment.save();


            res.status(200).json({
                success: true,
                message: `Appointment ${status} successfully`,
                appointment
            });

        } catch (error) {
            console.error("Appointment response error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to update appointment"
            });
        }
    }
);


// ======================================
// 5. USER CANCELS APPOINTMENT
// ======================================

router.patch(
    "/:id/cancel",
    authorize("user"),
    async (req, res) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid appointment ID"
                });
            }


            const appointment = await Appointment.findOne({
                _id: req.params.id,
                user: req.user._id,
                status: {
                    $in: ["pending", "confirmed"]
                }
            });


            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: "Active appointment not found"
                });
            }


            appointment.status = "cancelled";

            await appointment.save();


            res.status(200).json({
                success: true,
                message: "Appointment cancelled successfully",
                appointment
            });

        } catch (error) {
            console.error("Appointment cancellation error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to cancel appointment"
            });
        }
    }
);


module.exports = router;
