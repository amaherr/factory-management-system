const Product = require("../models/product.model");
const Inventory = require("../models/inventory.model");
const { PRODUCT_STATUS } = require("../enums/product.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");

const productController = {
    createProduct: async (req, res, next) => {
        try {
            const {
                code,
                name,
                description,
                color,
                defaultImage,
                sku,
                costPrice,
                salePrice,
                season,
            } = req.body;

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
                season,
                activatedByUserId: req.user.id,
                activatedAt: Date.now(),
            });

            await newProduct.save();

            res.status(201).json(response("Product created successfully", newProduct));
        } catch (err) {
            next(err);
        }
    },

    deleteProduct: async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findByIdAndDelete(id);

            if (!product) {
                return next(createError("Product not found", 404));
            }

            res.status(200).json(response("Product deleted successfully", product));
        } catch (err) {
            next(err);
        }
    },

    updateProduct: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Prevent updating code
            if (updates.code) {
                return next(createError("Product code cannot be updated", 400));
            }

            const product = await Product.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true,
            });

            if (!product) {
                return next(createError("Product not found", 404));
            }

            res.status(200).json(response("Product updated successfully", product));
        } catch (err) {
            next(err);
        }
    },

    activateProduct: async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findByIdAndUpdate(
                id,
                {
                    status: PRODUCT_STATUS.ACTIVE,
                    activatedByUserId: req.user.id,
                    activatedAt: Date.now(),
                },
                { new: true, runValidators: true },
            );

            if (!product) {
                return next(createError("Product not found", 404));
            }

            // Create inventory if it doesn't exist
            const existingInventory = await Inventory.findOne({ productId: id });
            if (!existingInventory) {
                const newInventory = new Inventory({
                    productId: id,
                    totalInStock: 0,
                    locations: [],
                });
                await newInventory.save();
            }

            res.status(200).json(response("Product activated successfully", product));
        } catch (err) {
            next(err);
        }
    },

    deactivateProduct: async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findByIdAndUpdate(
                id,
                {
                    status: PRODUCT_STATUS.DEACTIVE, // or DEACTIVE based on enum
                    deactivatedByUserId: req.user.id,
                    deactivatedAt: Date.now(),
                },
                { new: true },
            );

            if (!product) {
                return next(createError("Product not found", 404));
            }

            res.status(200).json(response("Product deactivated successfully", product));
        } catch (err) {
            next(err);
        }
    },

    getAllProducts: async (req, res, next) => {
        try {
            const products = await Product.find();
            res.status(200).json(response("Products retrieved successfully", products));
        } catch (err) {
            next(err);
        }
    },

    getAllActiveProducts: async (req, res, next) => {
        try {
            const products = await Product.find({ status: PRODUCT_STATUS.ACTIVE });
            res.status(200).json(response("Active products retrieved successfully", products));
        } catch (err) {
            next(err);
        }
    },

    getProductById: async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);

            if (!product) {
                return next(createError("Product not found", 404));
            }

            res.status(200).json(response("Product retrieved successfully", product));
        } catch (err) {
            next(err);
        }
    },
};

module.exports = productController;
