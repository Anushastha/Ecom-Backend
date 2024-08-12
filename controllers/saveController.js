const Save = require("../models/saveModel");
const User = require("../models/userModel");

const addToSaved = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.json({
                success: false,
                message: "User ID and Product ID are required fields",
            });
        }

        let save = await Save.findOne({ user: userId });

        if (!save) {
            save = new Save({ user: userId, savedItems: [] });
        }

        const existingProduct = save.savedItems.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingProduct !== -1) {
            return res.json({
                success: false,
                message: "Product is already saved",
            });
        }

        save.savedItems.push({ product: productId });

        await save.save();
        res.status(201).json({
            success: true,
            message: "Product saved successfully!",
            save,
        });
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Failed to save product" });
    }
};

const getUserSaves = async (req, res) => {
    const userId = req.params.id;

    try {
        const save = await Save.findOne({ user: userId }).populate({
            path: "savedItems.product",
            select: "productName productImageUrl productCategory productPrice",
        });

        if (!save) {
            return res.json({
                success: true,
                message: "User's wishlist is empty",
                save: [],
            });
        }

        res.json({
            success: true,
            message: "User's wishlist fetched successfully",
            save: save.savedItems,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json("Server error");
    }
};

const removeFromSaves = async (req, res) => {
    try {
        const savedItemId = req.params.id;
        const save = await Save.findOneAndUpdate(
            { "savedItems._id": savedItemId },
            { $pull: { savedItems: { _id: savedItemId } } },
            { new: true }
        );

        if (!save) {
            return res.status(404).json({
                success: false,
                message: "Product not found in wishlist",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product removed from wishlist successfully",
            save: save.savedItems,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


module.exports = {
    addToSaved,
    getUserSaves,
    removeFromSaves,
};