const mongoose = require('mongoose');

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
});

const Users = mongoose.model('users', userSchema);
module.exports = Users;
