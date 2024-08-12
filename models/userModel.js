const mongoose = require('mongoose');
const bcrypt = require("bcrypt")

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    confirmPassword: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: false,
    },
    profileImage: {
        type: String,
        required: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    userImageUrl: {
        type: String,
        required: false,
    },
    passwordHistory: [
        {
            password: { type: String, required: true },
            createdAt: {
                type: Date,
                default: Date.now,
            }
        }
    ]
});

// Method to compare a new password with history
userSchema.methods.isPasswordInHistory = async function (newPassword) {
    for (let history of this.passwordHistory) {
        const match = await bcrypt.compare(newPassword, history.password);
        if (match) return true;
    }
    return false;
};

// Method to hash and update password history
userSchema.methods.updatePasswordHistory = async function (newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Add new password to history
    this.passwordHistory.push({ password: hashedPassword });

    // Limit history to last 5 passwords
    if (this.passwordHistory.length > 5) {
        this.passwordHistory.pop(); // Remove the oldest password
    }

    // Update current password
    this.password = hashedPassword;
};

const Users = mongoose.model('users', userSchema);
module.exports = Users;
