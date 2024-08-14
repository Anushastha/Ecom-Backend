// module.exports = router;
const router = require('express').Router();
const cartController = require('../controllers/cartController');
const { authGuard } = require('../middleware/authGuard');

// // Create a cart
router.post('/create_cart', authGuard, cartController.createCart);
router.get('/get_cart/:id', authGuard, cartController.getUserCart);
router.delete("/remove_cart/:id", authGuard, cartController.removeFromCart);
router.put("/update_cart/:id", authGuard, cartController.updateCartItemQuantity);
router.post('/clear', authGuard, cartController.clearCart);

module.exports = router;
