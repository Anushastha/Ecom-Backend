const mongoose = require('mongoose');

const verifyEmailSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    emailVerifyCode: {
        type: Number,
        required: true,
    },
});

const EmailVerifyCode = mongoose.model('verifyEmailCodes', verifyEmailSchema);
module.exports = EmailVerifyCode;