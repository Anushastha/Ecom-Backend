const express = require('express');
const { getLogs } = require('../controllers/logController');
const router = express.Router();

// Route to get logs
router.get('/logs', getLogs);

module.exports = router;
