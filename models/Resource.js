
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 150
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Stress Management",
                "Anxiety",
                "Mindfulness",
                "Sleep",
                "Self Care",
                "Emotional Wellness"
            ]
        },

        summary: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        },

        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 20
        },

        tags: {
            type: [String],
            default: []
        },

        isPublished: {
            type: Boolean,
            default: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes for resource filtering and searching
resourceSchema.index({ category: 1, isPublished: 1 });
resourceSchema.index({
    title: "text",
    summary: "text",
    content: "text",
    tags: "text"
});

module.exports = mongoose.model("Resource", resourceSchema);
