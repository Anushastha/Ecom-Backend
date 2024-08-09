const express = require('express');
const categoryController = require('../controllers/categoryController');
const router = express.Router();

// Course routes
router.get('/get_categories', categoryController.getCategories);
router.get('/get_category/:id', categoryController.getSingleCategory);

router.post('/create_category', categoryController.createCategory);
router.put('/update_category/:id', categoryController.updateCategory);
router.delete('/delete_category/:id', categoryController.deleteCategory);
router.get('/search', categoryController.searchCategory);


module.exports = router;
