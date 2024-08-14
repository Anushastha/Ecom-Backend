const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authGuardAdmin } = require('../middleware/authGuard');
const router = express.Router();

// Course routes
router.get('/get_categories', categoryController.getCategories);
router.get('/get_category/:id', categoryController.getSingleCategory);

router.post('/create_category', authGuardAdmin, categoryController.createCategory);
router.put('/update_category/:id', authGuardAdmin, categoryController.updateCategory);
router.delete('/delete_category/:id', authGuardAdmin, categoryController.deleteCategory);
router.get('/search', authGuardAdmin, categoryController.searchCategory);


module.exports = router;
