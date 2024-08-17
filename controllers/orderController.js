const Cart = require("../models/cartModel");
const Orders = require("../models/orderModel");
const Users = require("../models/userModel");
const { logUserAction } = require('../services/loggerServices');

// Create a new order
const createOrderInfo = async (req, res) => {
    try {
        const { userId, cartItems, total } = req.body;

        // Validate user
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const newOrder = new Orders({
            userId: userId,
            items: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            })),
            status: "Pending",
            createdAt: new Date(),
        });

        const savedOrder = await newOrder.save();
        console.log("Order saved to database:", savedOrder); // Log the saved order
        res.status(201).json({ success: true, message: "Order placed successfully", order: savedOrder });
    } catch (err) {
        console.error("Error creating order:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};


// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        // Ensure the user is an admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const order = await Orders.findByIdAndUpdate(
            orderId,
            { $set: { status: status } },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, message: "Order status updated", order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Get all orders for a user
const getOrdersByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const orders = await Orders.find({ userId }).populate('items.productId');
        if (!orders.length) {
            return res.status(404).json({ success: false, message: "No orders found for this user" });
        }
        await logUserAction(userId, 'View Order History', `User viewd their order history`);
        res.status(200).json({ success: true, message: "Orders fetched successfully", orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};



module.exports = {
    createOrderInfo,
    updateOrderStatus,
    getOrdersByUserId,
};
