const Users = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");
const { resetCode, mailConfig } = require("../utils/resetPassword");
const ResetCode = require("../models/resetCodeModel");

const createUser = async (req, res) => {
    // step 1 : Check if data is coming or not
    console.log(req.body);

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

        // step 7 : save user and response
        await newUser.save();
        res.status(200).json({
            success: true,
            message: "User created successfully.",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json("Server Error");
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
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET
        );

        res.status(200).json({
            success: true,
            message: "Logged in successfully.",
            token: token,
            userData: user,
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Server Error",
            error: error,
        });
    }
};




const resetPassword = async (req, res) => {
    const UserData = req.body;
    console.log(UserData)
    const user = await Users.findOne({ email: UserData?.email });
    const OTP = resetCode;
    console.log(OTP);
    await ResetCode.findOneAndUpdate({
        userId: user.id
    }, {
        resetCode: OTP
    }, { upsert: true })
    console.log(user);
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
        console.log(error)
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
        console.log(error);
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
        console.log(error);
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

        const isReused = await user.isPasswordInHistory(newPassword);
        if (isReused) {
            return res.status(400).json({ message: 'You cannot reuse a recent password. Please choose a different password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Add the current password to the password history
        user.passwordHistory.push(user.password);

        user.password = hashedPassword;
        user.lastPasswordChange = Date.now(); // Update the last password change date
        await user.save();

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

        return res.json({
            success: true,
            message: "Password reset successfully.",
        });

    } catch (error) {
        console.log(error);
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