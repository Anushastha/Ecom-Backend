const cloudinary = require("cloudinary");
const Category = require("../models/categoryModel");

// Create a new Category
const createCategory = async (req, res) => {
    // Step 1: Validate incoming data
    const { categoryName } = req.body;

    if (!categoryName) {
        return res.json({
            success: false,
            message: "Please enter category name",
        });
    }

    try {

        const newCategory = new Category({
            categoryName: categoryName,
        });

        await newCategory.save();

        res.json({
            success: true,
            message: "Category added successfully",
            category: newCategory,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get all categories
const getCategories = async (req, res) => {
    try {
        const allCategories = await Category.find({});
        res.json({
            success: true,
            message: "All categories fetched successfully!",
            categories: allCategories,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const getSingleCategory = async (req, res) => {
    const categoryId = req.params.id;
    try {
        const singleCategory = await Category.findById(categoryId);
        if (!singleCategory) {
            return res.json({
                success: false,
                message: "Category not found",
            });
        }
        res.json({
            success: true,
            message: "Category fetched successfully",
            category: singleCategory,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const updateCategory = async (req, res) => {
    const { categoryName } = req.body;

    if (!categoryName) {
        return res.json({
            success: false,
            message: "Required field is missing.",
        });
    }

    try {
        let updatedData = {
            categoryName: categoryName,
        };

        const categoryId = req.params.id;
        await Category.findByIdAndUpdate(categoryId, updatedData);

        res.json({
            success: true,
            message: "Category updated successfully",
            updateCategory: updatedData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const deleteCategory = async (req, res) => {
    const categoryId = req.params.id;
    try {
        await Category.findByIdAndDelete(categoryId);
        res.json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const searchCategory = async (req, res) => {
    const query = req.query.query;
    try {
        const category = await Category.find({
            categoryName: { $regex: query, $options: "i" },
        });
        res.status(200).json({
            success: true,
            category,
        });
    } catch (error) {
        console.error("Error searching category:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


module.exports = {
    createCategory,
    getCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
    searchCategory
};
