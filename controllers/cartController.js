
const Cart = require("../models/cartModel");
const User = require("../models/userModel");

const createCart = async (req, res) => {
    try {
        const { userId, quantity, productId } = req.body;
        // Validation
        if (!userId || !quantity || !productId) {
            return res.json({
                success: false,
                message: "User ID, quantity and quantity are required fields",
            });
        }
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, cartItems: [] });
        }
        // Check if the product is already in the cart
        const existingItemIndex = cart.cartItems.findIndex(
            (item) => item.product.toString() === productId
        );
        if (existingItemIndex !== -1) {
            // If the product is in the cart, inform the user
            return res.json({
                success: false,
                message: "Product is already added to the cart",
            });
        }
        // If the product is not in the cart, add a new item
        cart.cartItems.push({ product: productId, quantity });

        await cart.save();
        res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            cart,
        });
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Failed to add product to cart" });
    }
};

const getUserCart = async (req, res) => {
    const userId = req.params.id;
    try {
        const cart = await Cart.findOne({ user: userId }).populate({
            path: "cartItems.product",
            select: "productName productCategory productPrice productImageUrl",
        });
        if (!cart) {
            return res.json({
                success: true,
                message: "User cart is empty",
                cart: [],
            });
        }
        res.json({
            success: true,
            message: "User cart fetched successfully",
            cart: cart.cartItems,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json("Server error");
    }
};

const removeFromCart = async (req, res) => {
    try {
        const cartItemId = req.params.id; // Corrected parameter name
        // Find and remove the cart item by its ID
        const cart = await Cart.findOneAndUpdate(
            { "cartItems._id": cartItemId }, // Find cart item by its ID
            { $pull: { cartItems: { _id: cartItemId } } }, // Remove the cart item
            { new: true } // Return the updated cart
        );
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart",
            });
        }
        res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            cart: cart.cartItems, // Return updated cart items
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const updateCartItemQuantity = async (req, res) => {
    const cartItemId = req.params.id;
    const { newQuantity } = req.body;
    try {
        const cart = await Cart.findOneAndUpdate(
            { "cartItems._id": cartItemId },
            { $set: { "cartItems.$.quantity": newQuantity } },
            { new: true }
        );
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Quantity updated successfully",
            cartItem: cart.cartItems.id(cartItemId),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to update quantity",
        });
    }
};

const clearCart = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const updatedCart = await Cart.updateOne(
            { user: userId },
            { $set: { cartItems: [] } }  // Clear the cart items
        );

        if (updatedCart.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Cart not found or already empty" });
        }

        res.status(200).json({ success: true, message: "Cart cleared successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = {
    createCart,
    getUserCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart
};

const mongoose = require("mongoose");
