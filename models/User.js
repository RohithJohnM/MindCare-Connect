const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

    // User name
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80
    },

    // Email address
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    // Password
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },

    // User role
    role: {
        type: String,
        enum: ["user", "counselor", "admin"],
        default: "user"
    },

    // Contact number
    phone: {
        type: String,
        default: "",
        trim: true
    },

    // Account status
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});


// Hash password before saving
userSchema.pre("save", async function () {

    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(
        this.password,
        salt
    );
});


// Compare login password
userSchema.methods.comparePassword = async function (enteredPassword) {

    return await bcrypt.compare(
        enteredPassword,
        this.password
    );

};


// Export model
module.exports =
    mongoose.models.User ||
    mongoose.model("User", userSchema);