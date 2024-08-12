// module.exports = router;
const router = require('express').Router();
const cartController = require('../controllers/cartController');

// // Create a cart
router.post('/create_cart', cartController.createCart);
router.get('/get_cart/:id', cartController.getUserCart);
router.delete("/remove_cart/:id", cartController.removeFromCart);
router.put("/update_cart/:id", cartController.updateCartItemQuantity);
router.post('/clear', cartController.clearCart);

module.exports = router;
