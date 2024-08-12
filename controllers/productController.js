const cloudinary = require("cloudinary");
const Products = require("../models/productModel");
const { default: mongoose } = require("mongoose");

const createProduct = async (req, res) => {
    try {
        const {
            productName,
            productPrice,
            productDescription,
            productCategory,
        } = req.body;
        const { productImage } = req.files;

        // Check required fields
        if (!productName || !productPrice || !productDescription || !productCategory || !productImage) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the required fields",
            });
        }

        const category = new mongoose.Types.ObjectId(productCategory);

        const uploadedImage = await cloudinary.uploader.upload(productImage.path, {
            folder: "products",
            crop: "scale",
        });

        // Save to database
        const newProduct = new Products({
            productName,
            productPrice,
            productDescription,
            productCategory: category,
            productImageUrl: uploadedImage.secure_url,
        });
        await newProduct.save();

        res.json({
            success: true,
            message: "Product added successfully",
            product: newProduct,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const allProducts = await Products.find({})
            .populate('productCategory')
            .exec();

        res.json({
            success: true,
            message: "All products fetched successfully!",
            products: allProducts.map(product => ({
                id: product._id,
                productName: product.productName,
                productPrice: product.productPrice,
                productDescription: product.productDescription,
                productImageUrl: product.productImageUrl,
                productCategory: product.productCategory,
            })),
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



const getSingleProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const singleProduct = await Products.findById(productId);
        if (!singleProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
        res.json({
            success: true,
            message: "Product fetched successfully",
            product: singleProduct,
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const updateProduct = async (req, res) => {
    const {
        productName,
        productPrice,
        productDescription,
        productCategory,
    } = req.body;
    const { productImage } = req.files;

    if (!productName || !productPrice || !productDescription || !productCategory) {
        return res.status(400).json({
            success: false,
            message: "Required fields are missing.",
        });
    }

    try {
        const category = new mongoose.Types.ObjectId(productCategory);

        let updatedData = {
            productName,
            productPrice,
            productDescription,
            productCategory: category,
        };

        if (productImage) {
            const uploadedImage = await cloudinary.uploader.upload(productImage.path, {
                folder: "products",
                crop: "scale",
            });
            updatedData.productImageUrl = uploadedImage.secure_url;
        }

        const productId = req.params.id;
        const updatedProduct = await Products.findByIdAndUpdate(
            productId,
            updatedData,
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json({
            success: true,
            message: "Product updated successfully",
            updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


const deleteProduct = async (req, res) => {
    const productId = req.params.id;

    try {
        const deletedProduct = await Products.findByIdAndDelete(productId);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const searchProducts = async (req, res) => {
    const query = req.query.query;
    try {
        const products = await Products.find({
            productName: { $regex: query, $options: "i" },
        });
        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error("Error searching products:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const getProductsWithCategoryId = async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        // Fetch products that offer the category with the given ID
        const products = await Products.find({ productCategory: categoryId });

        if (!products.length) {
            return res.json({
                success: false,
                message: "No products found under this category",
            });
        }

        res.json({
            success: true,
            message: "Products fetched successfully",
            products: products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};



module.exports = {
    createProduct,
    getProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsWithCategoryId,
}; 