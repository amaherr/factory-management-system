const Product = require("../models/product.model");
const createError = require("../utils/errorFactory");

const productController = {
    createProduct: async (req, res, next) => {
        try {
            const { code, name, description, color, defaultImage, sku, costPrice, salePrice, status } = req.body;

            const existingProduct = await Product.findOne({ code });
            if (existingProduct) {
                return next(createError("Product with this code already exists", 400));
            }

            const newProduct = new Product({
                code,
                name,
                description,
                color,
                defaultImage,
                sku,
                costPrice,
                salePrice,
                status,
                activatedByUserId: req.user.id,
                activatedAt: Date.now(),
            });

            await newProduct.save();

            res.status(201).json({
                success: true,
                message: "Product created successfully",
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },
};

module.exports = productController;
