const router = require('express').Router();
const orderController = require('../controllers/orderController');

router.post('/create', orderController.createOrderInfo);
router.put('/update_order/:orderId/status', orderController.updateOrderStatus);
router.get('/getOrdersByUser/:userId', orderController.getOrdersByUserId);

module.exports = router;
