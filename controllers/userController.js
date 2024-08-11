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

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(fullName)) {
        return res.json({
            success: false,
            message: "Full name should not contain numbers or special characters.",
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
    // step 1: Check incomming data
    console.log(req.body);

    // destructuring
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
        return res.json({
            success: false,
            message: "Please enter all fields.",
        });
    }
    // try catch block
    try {
        // finding user
        const user = await Users.findOne({ email: email });
        if (!user) {
            return res.json({
                success: false,
                message: "User does not exists.",
            });
        }
        // Comparing password
        const databasePassword = user.password;
        const isMatched = await bcrypt.compare(password, databasePassword);

        if (!isMatched) {
            return res.json({
                success: false,
                message: "Invalid Credentials.",
            });
        }

        // generate token token
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET
        );

        // response
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


const updatePassword = async (req, res) => {
    const { email, password } = req.body;
    // console.log(email, password);

    try {
        // Update the user's password
        const randomSalt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, randomSalt);

        await Users.findOneAndUpdate({ email }, { password: encryptedPassword });

        return res.json({
            success: true,
            message: "Password reset successfully."
        });

    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: 'Server Error: ' + error.message,
        });
    }
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
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
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;

        if (req.files) {
            const uploadedImage = await cloudinary.v2.uploader.upload(
                req.files.profileImage.path,
                {
                    folder: "profile_images",
                    crop: "scale",
                }
            );
            user.profileImage = uploadedImage.secure_url;
        }
        await user.save();

        // Respond with updated user profile
        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
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
    updatePassword,
    getUsers,
    getSingleUser,
    changePassword,
    updateUserProfile,
    getUserProfile,
}