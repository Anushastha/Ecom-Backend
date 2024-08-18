const Users = require("../models/userModel");

const sessionExpirationMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await Users.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }

        // Check if session has expired
        const timeElapsed = Date.now() - new Date(user.lastActivity).getTime();
        if (timeElapsed > 60000) { // 1 minute
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        // Update last activity time
        user.lastActivity = new Date();
        await user.save();

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
};

module.exports = {
    sessionExpirationMiddleware,
}