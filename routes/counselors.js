
const express = require("express");
const mongoose = require("mongoose");

const CounselorProfile = require("../models/CounselorProfile");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();


// ======================================
// 1. PUBLIC COUNSELOR DIRECTORY
// ======================================

router.get("/", async (req, res) => {
    try {
        const counselors = await CounselorProfile.find({
            isApproved: true,
            isActive: true
        })
            .populate("user", "name")
            .select("-availability")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: counselors.length,
            counselors
        });

    } catch (error) {
        console.error("Counselor listing error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve counselors"
        });
    }
});


// ======================================
// 2. COUNSELOR VIEW OWN PROFILE
// ======================================

router.get(
    "/me",
    authenticate,
    authorize("counselor"),
    async (req, res) => {
        try {
            const profile = await CounselorProfile.findOne({
                user: req.user._id
            });

            res.status(200).json({
                success: true,
                profile
            });

        } catch (error) {
            console.error("Counselor profile error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve counselor profile"
            });
        }
    }
);


// ======================================
// 3. CREATE COUNSELOR PROFILE
// ======================================

router.post(
    "/me",
    authenticate,
    authorize("counselor"),
    async (req, res) => {
        try {
            const {
                specialization,
                qualification,
                experienceYears,
                bio,
                languages,
                consultationFee,
                sessionDuration,
                consultationMode,
                availability
            } = req.body;

            // Validate required fields
            if (
                !Array.isArray(specialization) ||
                specialization.length === 0 ||
                !qualification ||
                experienceYears === undefined ||
                !bio ||
                consultationFee === undefined
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide all required counselor details"
                });
            }

            // Check for an existing profile
            const existingProfile = await CounselorProfile.findOne({
                user: req.user._id
            });

            if (existingProfile) {
                return res.status(409).json({
                    success: false,
                    message: "Counselor profile already exists"
                });
            }

            // Create profile
            const profile = await CounselorProfile.create({
                user: req.user._id,
                specialization,
                qualification,
                experienceYears,
                bio,
                languages,
                consultationFee,
                sessionDuration,
                consultationMode,
                availability,

                // Requires administrator approval
                isApproved: false
            });

            res.status(201).json({
                success: true,
                message: "Counselor profile submitted for approval",
                profile
            });

        } catch (error) {
            console.error("Create counselor profile error:", error);

            res.status(
                error.name === "ValidationError" ? 400 : 500
            ).json({
                success: false,
                message:
                    error.name === "ValidationError"
                        ? error.message
                        : "Unable to create counselor profile"
            });
        }
    }
);


// ======================================
// 4. UPDATE COUNSELOR PROFILE
// ======================================

router.put(
    "/me",
    authenticate,
    authorize("counselor"),
    async (req, res) => {
        try {
            const allowedFields = [
                "specialization",
                "qualification",
                "experienceYears",
                "bio",
                "languages",
                "consultationFee",
                "sessionDuration",
                "consultationMode",
                "availability"
            ];

            const updates = {};

            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            });

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No valid profile fields provided"
                });
            }

            // Any profile changes require another review
            updates.isApproved = false;

            const profile = await CounselorProfile.findOneAndUpdate(
                { user: req.user._id },
                { $set: updates },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: "Counselor profile not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Profile updated and submitted for approval",
                profile
            });

        } catch (error) {
            console.error("Update counselor profile error:", error);

            res.status(400).json({
                success: false,
                message: error.message || "Unable to update profile"
            });
        }
    }
);


// ======================================
// 5. ADMIN VIEW PENDING PROFILES
// ======================================

router.get(
    "/admin/pending",
    authenticate,
    authorize("admin"),
    async (req, res) => {
        try {
            const profiles = await CounselorProfile.find({
                isApproved: false
            })
                .populate("user", "name email")
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: profiles.length,
                profiles
            });

        } catch (error) {
            console.error("Pending profiles error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to retrieve pending profiles"
            });
        }
    }
);


// ======================================
// 6. ADMIN APPROVE OR REJECT PROFILE
// ======================================

router.patch(
    "/admin/:id/approval",
    authenticate,
    authorize("admin"),
    async (req, res) => {
        try {
            const { isApproved } = req.body;

            if (typeof isApproved !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "isApproved must be true or false"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid counselor profile ID"
                });
            }

            const profile = await CounselorProfile.findByIdAndUpdate(
                req.params.id,
                { $set: { isApproved } },
                { new: true, runValidators: true }
            );

            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: "Counselor profile not found"
                });
            }

            res.status(200).json({
                success: true,
                message: isApproved
                    ? "Counselor approved successfully"
                    : "Counselor approval revoked",
                profile
            });

        } catch (error) {
            console.error("Counselor approval error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to update counselor approval"
            });
        }
    }
);


// ======================================
// 7. VIEW INDIVIDUAL COUNSELOR
// ======================================

router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid counselor ID"
            });
        }

        const counselor = await CounselorProfile.findOne({
            _id: req.params.id,
            isApproved: true,
            isActive: true
        }).populate("user", "name");

        if (!counselor) {
            return res.status(404).json({
                success: false,
                message: "Counselor not found"
            });
        }

        res.status(200).json({
            success: true,
            counselor
        });

    } catch (error) {
        console.error("Counselor details error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve counselor details"
        });
    }
});


module.exports = router;
