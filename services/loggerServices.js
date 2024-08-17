const Log = require('../models/logModel');

const logUserAction = async (userId, action, details) => {
    try {
        const newLog = new Log({
            userId: userId,
            action: action,
            details: details,
            timestamp: new Date()
        });

        await newLog.save();
        console.log('Log saved successfully');
    } catch (error) {
        console.error('Error saving log:', error);
    }
};

module.exports = { logUserAction };
