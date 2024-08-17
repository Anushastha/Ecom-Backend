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

const getLogs = async (req, res) => {
    try {
        const logs = await Log.find().populate('userId', 'fullName email');
        res.status(200).json({
            success: true,
            message: "Logs fetched successfully",
            logs,
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch logs",
        });
    }
};

module.exports = {
    createLog,
    getLogs
}