const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true,
    },
    productPrice: {
        type: Number,
        required: true,
        trim: true,
    },
    productDescription: {
        type: String,
        required: true,
        trim: true,
    },
    productCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    productImageUrl: {
        type: String,
        required: true,
    },
})

const Products = mongoose.model('products', productSchema);
module.exports = Products;