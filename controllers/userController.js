const Users = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
const { resetCode, mailConfig } = require("../utils/resetPassword");
const ResetCode = require("../models/resetCodeModel");
const EmailVerifyCode = require("../models/verifyRegistration");
const { logUserAction } = require('../services/loggerServices');

const createUser = async (req, res) => {
    // step 1 : Check if data is coming or not
    //console.log(req.body);

    // step 2 : Destructure the data
    const { fullName, email, password, confirmPassword, phoneNumber } = req.body;

    // step 3 : validate the incomming data
    if (!fullName || !email || !password || !confirmPassword || !phoneNumber) {
        return res.json({
            success: false,

            message: "Please enter all the fields.",
        });
    }

    // step 4 : try catch block
    try {
        // step 5 : Check existing user
        const existingUser = await Users.findOne({ email: email });
        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists.",
            });
        }

        // password encryption
        const randomSalt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, randomSalt);

        // step 6 : create new user
        const newUser = new Users({
            // fieldname : incomming data name
            fullName: fullName,
            email: email,
            phoneNumber: phoneNumber,
            password: encryptedPassword,
            confirmPassword: encryptedPassword,
        });
        // Generate verification code
        const verificationCode = Math.floor(1000 + Math.random() * 9000);
        const emailVerificationCode = new EmailVerifyCode({
            userId: newUser._id,
            emailVerifyCode: verificationCode
        });

        // Save verification code
        await emailVerificationCode.save();

        // Send email with verification code
        const mailOptions = {
            from: 'LushBeauty',
            to: email,
            subject: 'Email Verification Code',
            text: `Your email verification code is: ${verificationCode}`
        };

        const transporter = mailConfig();
        await transporter.sendMail(mailOptions);


        // step 7 : save user and response
        await newUser.save();
        res.status(200).json({
            success: true,
            message: "Verification code sent. Please check your email.",
        });
    } catch (error) {
        //console.log(error);
        res.status(500).json("Server Error");
    }
};

const verifyEmailCode = async (req, res) => {
    const { verificationCode, email } = req.body;

    try {
        // Find the user by email
        const user = await Users.findOne({ email });
        if (!user) {
            return res.json({
                success: false,
                message: "User not found."
            });
        }
        // Find the verification code associated with the user
        const savedVerificationCode = await EmailVerifyCode.findOne({ userId: user._id });

        // Check if the saved verification code exists and matches the input
        if (!savedVerificationCode || savedVerificationCode.emailVerifyCode !== parseInt(verificationCode, 10)) {
            return res.json({
                success: false,
                message: "Invalid verification code."
            });
        }
        // Mark the email as verified
        user.isEmailVerified = true;
        await user.save();
        // Remove the verification code after successful verification
        await EmailVerifyCode.findOneAndDelete({ userId: user._id });
        await logUserAction(user._id, 'Create New Account', `User created a new account`);
        return res.json({
            success: true,
            message: "Email verified successfully. Registration complete."
        });
    } catch (error) {
        console.error("Error in verifyEmailCode:", error);
        return res.json({
            success: false,
            message: 'Server Error. Please try again later.',
        });
    }
};


//Login User
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({
            success: false,
            message: "Please enter all fields.",
        });
    }

    try {
        const user = await Users.findOne({ email: email });

        if (!user) {
            return res.json({
                success: false,
                message: "User does not exist.",
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
            });
        }

        if (user.isAccountLocked()) {
            return res.json({
                success: false,
                message: "Your account is locked due to multiple failed login attempts. Please try again in 1 minute.",
                lockUntil: user.lockUntil // Send lockUntil for client-side timer
            });
        }

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
            await user.handleFailedLoginAttempt();

            return res.json({
                success: false,
                message: "Invalid Credentials.",
            });
        }

        // If the account was previously locked and is now unlocked, we need to ensure the save operation finishes
        if (user.isLocked || user.failedLoginAttempts > 0) {
            user.failedLoginAttempts = 0;
            user.isLocked = false;
            user.lockUntil = null;
            await user.save(); // Ensure this save operation is awaited
        }

        await user.updateLastActivity();

        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        await logUserAction(user._id, 'Login', `User logged in successfully`);
        res.status(200).json({
            success: true,
            message: "Logged in successfully.",
            token: token,
            userData: user,
        });
    } catch (error) {
        //console.log(error);
        res.json({
            success: false,
            message: "Server Error",
            error: error,
        });
    }
};


const resetPassword = async (req, res) => {
    const UserData = req.body;
    //console.log(UserData)
    const user = await Users.findOne({ email: UserData?.email });
    const OTP = resetCode;
    //console.log(OTP);
    await ResetCode.findOneAndUpdate({
        userId: user.id
    }, {
        resetCode: OTP
    }, { upsert: true })
    //console.log(user);
    const MailConfig = mailConfig();

    const mailOptions = {
        from: 'Lush Beauty',
        to: UserData?.email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${OTP}`
    };

    try {
        await MailConfig.sendMail(mailOptions);
        return res.json({
            success: true,
            message: "Reset code email sent successfully!"
        })
    } catch (error) {
        //console.log(error)
        return res.json({
            success: false,
            message: 'Error sending reset code email:' + error.message,
        })
    }
}

const verifyResetCode = async (req, res) => {

    const { resetCode, email } = req.body;
    try {
        const user = await Users.findOne({ email });
        if (!user) {
            return res.json({
                success: false,
                message: "User not found with the provided email."
            });
        } else {
            const savedResetCode = await ResetCode.findOne({ userId: user._id });
            if (!savedResetCode || savedResetCode.resetCode != resetCode) {
                return res.json({
                    success: false,
                    message: "Invalid reset code."
                });
            } else {
                return res.json({
                    success: true,
                    message: "Reset code verified successfully."
                });
            }
        }
    } catch (error) {
        console.error("Error in verifyResetCode:", error);
        return res.json({
            success: false,
            message: 'Server Error: ' + error.message,
        });
    }    //set opt code null
};



const getUsers = async (req, res) => {
    try {
        const allUsers = await Users.find({});
        res.json({
            success: true,
            message: "All users fetched successfully!",
            products: allUsers,
        });
    } catch (error) {
        //console.log(error);
        res.send("Internal server error");
    }
};
const getSingleUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const singleUser = await Users.findById(userId);
        res.json({
            success: true,
            message: "Single user fetched successfully!",
            product: singleUser,
        });
    } catch (error) {
        //console.log(error);
        res.send("Internal server error");
    }
};

const expiredPasswordChange = async (req, res) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
    }

    try {
        const user = await Users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isPasswordExpired()) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: 'Old password is incorrect' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            user.password = hashedPassword;
            user.lastPasswordChange = Date.now(); // Update the last password change date
            await user.save();

            res.status(200).json({ message: 'Password changed successfully' });
        } else {
            return res.status(400).json({ message: 'Password has not expired. Please use the regular password change.' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};



const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
    }

    try {
        const user = await Users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Check if the new password is in the password history
        const isReused = await user.isPasswordInHistory(newPassword);
        if (isReused) {
            return res.status(400).json({ message: 'You cannot reuse a recent password. Please choose a different password.' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password history
        await user.updatePasswordHistory(newPassword);

        // Save the updated user document
        user.lastPasswordChange = Date.now(); // Update the last password change date
        await user.save();
        await logUserAction(user._id, 'Changed Password', `User changed their password`);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


const updatePassword = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await Users.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found.",
            });
        }

        // Check if the new password is in the user's password history
        const isReused = await user.isPasswordInHistory(password);
        if (isReused) {
            return res.json({
                success: false,
                message: "You cannot reuse a recent password. Please choose a different password.",
            });
        }

        // If not reused, proceed to update the password
        const randomSalt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, randomSalt);

        // Update the user's password and add it to the password history
        user.password = encryptedPassword;
        await user.updatePasswordHistory(password);
        await user.save();

        await logUserAction(user._id, 'Password Reset', `User reset their password`);
        return res.json({
            success: true,
            message: "Password reset successfully.",
        });

    } catch (error) {
        //console.log(error);
        return res.json({
            success: false,
            message: 'Server Error: ' + error.message,
        });
    }
};




const getUserProfile = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decodedToken.id;
        const user = await Users.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        await logUserAction(user._id, 'View Profile', `User viewed their profile`);
        res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            userProfile: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated.",
            });
        }

        // Find user by ID
        const user = await Users.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update user fields
        const { fullName, email, phoneNumber } = req.body;

        // Update user profile fields if they are provided
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        // Check if a profile image is provided
        if (req.files && req.files.profileImage) {
            const uploadedImage = await cloudinary.v2.uploader.upload(
                req.files.profileImage.path,
                {
                    folder: "profile_images",
                    crop: "scale",
                }
            );
            user.profileImage = uploadedImage.secure_url;
        }

        // Save the updated user profile
        await user.save();

        await logUserAction(user._id, 'Profile Update', `User updated their profile`);
        // Respond with the updated user profile
        res.status(200).json({
            success: true,
            message: req.files && req.files.profileImage ? "User profile updated successfully" : "User profile updated successfully",
            userProfile: {
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({
            success: false,
            message: "Error updating user profile",
        });
    }
};


module.exports = {
    createUser,
    verifyEmailCode,
    loginUser,
    resetPassword,
    verifyResetCode,
    expiredPasswordChange,
    updatePassword,
    getUsers,
    getSingleUser,
    changePassword,
    updateUserProfile,
    getUserProfile,
}