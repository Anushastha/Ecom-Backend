const router = require('express').Router();
const orderController = require('../controllers/orderController');
const { authGuard } = require('../middleware/authGuard');

router.post('/create', authGuard, orderController.createOrderInfo);
router.put('/update_order/:orderId/status', authGuard, orderController.updateOrderStatus);
router.get('/getOrdersByUser/:userId', authGuard, orderController.getOrdersByUserId);

module.exports = router;
