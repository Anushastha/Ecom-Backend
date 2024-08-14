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
    ],
    lastPasswordChange: {
        type: Date,
        default: Date.now,
    },
    passwordExpiry: {
        type: Number,  // Store the expiry in days
        default: 90
    },
    failedLoginAttempts: {
        type: Number,
        default: 0,
      },
      isLocked: {
        type: Boolean,
        default: false,
      },
      lockUntil: {
        type: Date,
      },
});

// Method to compare a new password with history
userSchema.methods.isPasswordInHistory = async function (newPassword) {
    for (let history of this.passwordHistory) {
        const match = await bcrypt.compare(newPassword, history.password);
        if (match) return true;
    }
    return false;
};

userSchema.methods.isPasswordExpired = function () {
    const expiryDate = new Date(this.lastPasswordChange);
    expiryDate.setDate(expiryDate.getDate() + this.passwordExpiry); // Add days to the last password change date
    return new Date() > expiryDate;
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

// Method to check if the account is locked
userSchema.methods.isAccountLocked = function () {
    if (this.isLocked && this.lockUntil > Date.now()) {
        return true;
    } else if (this.isLocked && this.lockUntil <= Date.now()) {
        // Unlock account after lockout period
        this.isLocked = false;
        this.failedLoginAttempts = 0;
        this.lockUntil = null;
        this.save(); // Save the changes
        return false;
    }
    return false;
};

// Method to handle failed login attempts
userSchema.methods.handleFailedLoginAttempt = async function () {
    this.failedLoginAttempts += 1;

    if (this.failedLoginAttempts >= 5) {
        this.isLocked = true;
        this.lockUntil = new Date(Date.now() + 1 * 60 * 1000); // Lock for 1 minute
    }

    await this.save(); // Save the changes
};

const Users = mongoose.model('users', userSchema);
module.exports = Users;
