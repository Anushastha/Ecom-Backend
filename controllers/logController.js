const Log = require('../models/logModel');

// Function to create a log entry
const createLog = async (userId, action, details = '') => {
    try {
        const log = new Log({ userId, action, details });
        await log.save();
    } catch (error) {
        console.error('Failed to create log:', error);
    }
};
module.exports = {
    createLog
}