// favoriteRoutes.js
const express = require("express");
const router = express.Router();
const saveController = require('../controllers/saveController');
const { authGuard } = require("../middleware/authGuard");

router.post("/add_save", authGuard, saveController.addToSaved);
router.get("/get_saved/:id", authGuard, saveController.getUserSaves)
router.delete("/remove_saved/:id", authGuard, saveController.removeFromSaves)

module.exports = router;