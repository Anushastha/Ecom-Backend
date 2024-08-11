// favoriteRoutes.js
const express = require("express");
const router = express.Router();
const {
    addToSaved,
    getUserSaves,
    removeFromSaves,
} = require("../controllers/saveController");

router.post("/add_save", addToSaved);
router.get("/get_saved/:id", getUserSaves)
router.delete("/remove_saved/:id", removeFromSaves)

module.exports = router;