
const express = require("express");
const mongoose = require("mongoose");

const Resource = require("../models/Resource");

const {
    authenticate,
    authorize
} = require("../middleware/auth");

const router = express.Router();

const allowedCategories = [
    "Stress Management",
    "Anxiety",
    "Mindfulness",
    "Sleep",
    "Self Care",
    "Emotional Wellness"
];

// All resource routes require login.
// Users, counselors and admins may read resources.
router.use(authenticate);
router.use(authorize("user", "counselor", "admin"));

// Escape search input before using it in a regular expression.
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Validate MongoDB resource ID.
function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Validate resource fields.
function validateResourceFields(data) {
    if (
        typeof data.title !== "string" ||
        data.title.trim().length < 3 ||
        data.title.trim().length > 150
    ) {
        return "Title must contain between 3 and 150 characters.";
    }

    if (!allowedCategories.includes(data.category)) {
        return "Please select a valid resource category.";
    }

    if (
        typeof data.summary !== "string" ||
        !data.summary.trim() ||
        data.summary.length > 300
    ) {
        return "Summary is required and must not exceed 300 characters.";
    }

    if (
        typeof data.content !== "string" ||
        data.content.trim().length < 20
    ) {
        return "Resource content must contain at least 20 characters.";
    }

    if (
        data.tags !== undefined &&
        (
            !Array.isArray(data.tags) ||
            data.tags.length > 20 ||
            !data.tags.every(
                (tag) => typeof tag === "string" && tag.trim().length > 0
            )
        )
    ) {
        return "Tags must be a list of up to 20 non-empty text values.";
    }

    return null;
}


// ======================================
// 1. GET ALL RESOURCES
// ======================================

router.get("/", async (req, res) => {
    try {
        const filter = {};

        // Normal users and counselors only see published resources.
        if (req.user.role !== "admin") {
            filter.isPublished = true;
        } else if (req.query.published !== undefined) {
            if (!["true", "false"].includes(req.query.published)) {
                return res.status(400).json({
                    success: false,
                    message: "Published filter must be true or false."
                });
            }

            filter.isPublished = req.query.published === "true";
        }

        // Optional category filtering.
        if (req.query.category) {
            if (!allowedCategories.includes(req.query.category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resource category."
                });
            }

            filter.category = req.query.category;
        }

        // Optional title, summary and content search.
        if (req.query.search) {
            const search = String(req.query.search).trim().slice(0, 100);

            if (search) {
                const pattern = new RegExp(escapeRegex(search), "i");

                filter.$or = [
                    { title: pattern },
                    { summary: pattern },
                    { content: pattern },
                    { tags: pattern }
                ];
            }
        }

        const resources = await Resource.find(filter)
            .populate("createdBy", "name")
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: resources.length,
            resources
        });

    } catch (error) {
        console.error("Get resources error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve resources."
        });
    }
});


// ======================================
// 2. GET ONE RESOURCE
// ======================================

router.get("/:id", async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resource ID."
            });
        }

        const filter = {
            _id: req.params.id
        };

        // Non-admin users cannot access unpublished resources.
        if (req.user.role !== "admin") {
            filter.isPublished = true;
        }

        const resource = await Resource.findOne(filter)
            .populate("createdBy", "name");

        if (!resource) {
            return res.status(404).json({
                success: false,
                message: "Resource not found."
            });
        }

        res.status(200).json({
            success: true,
            resource
        });

    } catch (error) {
        console.error("Get resource error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to retrieve resource."
        });
    }
});


// ======================================
// 3. CREATE RESOURCE - ADMIN ONLY
// ======================================

router.post(
    "/",
    authorize("admin"),
    async (req, res) => {
        try {
            const {
                title,
                category,
                summary,
                content,
                tags,
                isPublished
            } = req.body;

            const validationError = validateResourceFields({
                title,
                category,
                summary,
                content,
                tags
            });

            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }

            if (
                isPublished !== undefined &&
                typeof isPublished !== "boolean"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "isPublished must be true or false."
                });
            }

            const resource = await Resource.create({
                title: title.trim(),
                category,
                summary: summary.trim(),
                content: content.trim(),
                tags: (tags || []).map((tag) => tag.trim()),
                isPublished: isPublished ?? true,
                createdBy: req.user._id
            });

            res.status(201).json({
                success: true,
                message: "Resource created successfully.",
                resource
            });

        } catch (error) {
            console.error("Create resource error:", error);

            res.status(
                error.name === "ValidationError" ? 400 : 500
            ).json({
                success: false,
                message:
                    error.name === "ValidationError"
                        ? error.message
                        : "Unable to create resource."
            });
        }
    }
);


// ======================================
// 4. UPDATE RESOURCE - ADMIN ONLY
// ======================================

router.put(
    "/:id",
    authorize("admin"),
    async (req, res) => {
        try {
            if (!isValidId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resource ID."
                });
            }

            const allowedFields = [
                "title",
                "category",
                "summary",
                "content",
                "tags",
                "isPublished"
            ];

            const updates = {};

            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field];
                }
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No valid fields provided for updating."
                });
            }

            if (
                updates.isPublished !== undefined &&
                typeof updates.isPublished !== "boolean"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "isPublished must be true or false."
                });
            }

            if (
                updates.tags !== undefined &&
                (
                    !Array.isArray(updates.tags) ||
                    updates.tags.length > 20 ||
                    !updates.tags.every(
                        (tag) => typeof tag === "string" && tag.trim()
                    )
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Tags must contain up to 20 non-empty text values."
                });
            }

            if (updates.title !== undefined) {
                if (
                    typeof updates.title !== "string" ||
                    updates.title.trim().length < 3 ||
                    updates.title.trim().length > 150
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Title must contain between 3 and 150 characters."
                    });
                }

                updates.title = updates.title.trim();
            }

            if (updates.category !== undefined &&
                !allowedCategories.includes(updates.category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resource category."
                });
            }

            if (updates.summary !== undefined) {
                if (
                    typeof updates.summary !== "string" ||
                    !updates.summary.trim() ||
                    updates.summary.length > 300
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid resource summary."
                    });
                }

                updates.summary = updates.summary.trim();
            }

            if (updates.content !== undefined) {
                if (
                    typeof updates.content !== "string" ||
                    updates.content.trim().length < 20
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "Resource content must contain at least 20 characters."
                    });
                }

                updates.content = updates.content.trim();
            }

            if (updates.tags !== undefined) {
                updates.tags = updates.tags.map((tag) => tag.trim());
            }

            const resource = await Resource.findByIdAndUpdate(
                req.params.id,
                { $set: updates },
                {
                    new: true,
                    runValidators: true
                }
            ).populate("createdBy", "name");

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: "Resource not found."
                });
            }

            res.status(200).json({
                success: true,
                message: "Resource updated successfully.",
                resource
            });

        } catch (error) {
            console.error("Update resource error:", error);

            res.status(
                error.name === "ValidationError" ? 400 : 500
            ).json({
                success: false,
                message:
                    error.name === "ValidationError"
                        ? error.message
                        : "Unable to update resource."
            });
        }
    }
);


// ======================================
// 5. DELETE RESOURCE - ADMIN ONLY
// ======================================

router.delete(
    "/:id",
    authorize("admin"),
    async (req, res) => {
        try {
            if (!isValidId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid resource ID."
                });
            }

            const resource = await Resource.findByIdAndDelete(
                req.params.id
            );

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: "Resource not found."
                });
            }

            res.status(200).json({
                success: true,
                message: "Resource deleted successfully."
            });

        } catch (error) {
            console.error("Delete resource error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to delete resource."
            });
        }
    }
);


module.exports = router;
