const Product = require("../models/product.model");
const StockMovement = require("../models/stockMovement.model");
const { PRODUCT_STATUS, FACTORY_LOCATIONS } = require("../enums/product.enums");
const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");

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
            return next(err);
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
            return next(err);
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
            return next(err);
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

            res.status(200).json(response("Product activated successfully", product));
        } catch (err) {
            return next(err);
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
            return next(err);
        }
    },

    getAllProducts: async (req, res, next) => {
        try {
            const products = await Product.find();
            res.status(200).json(response("Products retrieved successfully", products));
        } catch (err) {
            return next(err);
        }
    },

    getAllActiveProducts: async (req, res, next) => {
        try {
            const products = await Product.find({ status: PRODUCT_STATUS.ACTIVE });
            res.status(200).json(response("Active products retrieved successfully", products));
        } catch (err) {
            return next(err);
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
            return next(err);
        }
    },

    // Inventory Management Functions

    // Get all products that have stock (physical stock > 0)
    getProductsWithStock: async (req, res, next) => {
        try {
            const products = await Product.find({ totalPhysicalStock: { $gt: 0 } });
            res.status(200).json(response("Products with stock retrieved successfully", products));
        } catch (err) {
            return next(err);
        }
    },

    // Get products by location
    getProductsByLocation: async (req, res, next) => {
        try {
            const { location } = req.params;

            // Validate location
            if (!Object.values(FACTORY_LOCATIONS).includes(location)) {
                return next(createError("Invalid location", 400));
            }

            const products = await Product.find({
                locations: {
                    $elemMatch: {
                        location: location,
                        quantityInStock: { $gt: 0 },
                    },
                },
            });

            res.status(200).json(
                response("Products for location retrieved successfully", products),
            );
        } catch (err) {
            return next(err);
        }
    },

    // Transfer stock between locations
    transferProductStock: async (req, res, next) => {
        try {
            const { id } = req.params; // Product ID
            const { fromLocation, toLocation, quantity } = req.body;

            if (!fromLocation || !toLocation || !quantity) {
                return next(
                    createError("fromLocation, toLocation, and quantity are required", 400),
                );
            }

            if (quantity <= 0) {
                return next(createError("Quantity must be greater than 0", 400));
            }

            // Validate locations
            if (
                !Object.values(FACTORY_LOCATIONS).includes(fromLocation) ||
                !Object.values(FACTORY_LOCATIONS).includes(toLocation)
            ) {
                return next(createError("Invalid location", 400));
            }

            if (fromLocation === toLocation) {
                return next(createError("Cannot transfer to the same location", 400));
            }

            const product = await Product.findById(id);
            if (!product) {
                return next(createError("Product not found", 404));
            }

            // Find source location
            const fromLoc = product.locations.find((loc) => loc.location === fromLocation);
            if (!fromLoc) {
                return next(
                    createError(`Source location ${fromLocation} not found in product`, 404),
                );
            }

            if (fromLoc.quantityInStock < quantity) {
                return next(createError("Insufficient stock in source location", 400));
            }

            // Find or create destination location
            let toLoc = product.locations.find((loc) => loc.location === toLocation);
            if (!toLoc) {
                product.locations.push({
                    location: toLocation,
                    quantityInStock: 0,
                });
                toLoc = product.locations[product.locations.length - 1];
            }

            // Perform transfer
            fromLoc.quantityInStock -= quantity;
            toLoc.quantityInStock += quantity;

            await product.save();

            res.status(200).json(response("Stock transferred successfully", product));
        } catch (err) {
            return next(err);
        }
    },

    // Add stock to a location
    addProductStock: async (req, res, next) => {
        try {
            const { id } = req.params; // Product ID
            const { location, quantity } = req.body;

            if (!location || !quantity) {
                return next(createError("location and quantity are required", 400));
            }

            if (quantity <= 0) {
                return next(createError("Quantity must be greater than 0", 400));
            }

            // Validate location
            if (!Object.values(FACTORY_LOCATIONS).includes(location)) {
                return next(createError("Invalid location", 400));
            }

            const product = await Product.findById(id);
            if (!product) {
                return next(createError("Product not found", 404));
            }

            // Find or create location
            let loc = product.locations.find((l) => l.location === location);
            if (!loc) {
                product.locations.push({
                    location: location,
                    quantityInStock: 0,
                });
                loc = product.locations[product.locations.length - 1];
            }

            // Increase stock
            loc.quantityInStock += quantity;
            product.totalPhysicalStock += quantity;

            await product.save();

            res.status(200).json(response("Stock added successfully", product));
        } catch (err) {
            return next(err);
        }
    },

    // Sell product (direct sale)
    sellProduct: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { location, quantity } = req.body;

            if (!location || !quantity) {
                return next(createError("location and quantity are required", 400));
            }

            if (quantity <= 0) {
                return next(createError("Quantity must be greater than 0", 400));
            }

            // Validate location
            if (!Object.values(FACTORY_LOCATIONS).includes(location)) {
                return next(createError("Invalid location", 400));
            }

            const product = await Product.findById(id);
            if (!product) {
                return next(createError("Product not found", 404));
            }

            // Find location
            const loc = product.locations.find((l) => l.location === location);
            if (!loc) {
                return next(createError(`Location ${location} not found in product`, 404));
            }

            if (loc.quantityInStock < quantity) {
                return next(createError("Insufficient stock in location", 400));
            }

            if (product.totalPhysicalStock < quantity) {
                return next(createError("Insufficient total physical stock", 400));
            }

            // update stocks
            // product.totalSold += quantity;
            product.totalPhysicalStock -= quantity;
            loc.quantityInStock -= quantity;

            await product.save();

            res.status(200).json(response("Sale processed successfully", product));
        } catch (err) {
            return next(err);
        }
    },

    // Manual Stock Adjustment
    manualStockAdjustment: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { location, adjustmentType, quantity, notes } = req.body;

            if (!location || !adjustmentType || !quantity) {
                return next(
                    createError("Location, adjustmentType, and quantity are required", 400),
                );
            }

            if (!["add", "subtract"].includes(adjustmentType)) {
                return next(createError("Adjustment type must be 'add' or 'subtract'", 400));
            }

            if (quantity <= 0) {
                return next(createError("Quantity must be greater than 0", 400));
            }

            // Validate location
            if (!Object.values(FACTORY_LOCATIONS).includes(location)) {
                return next(createError("Invalid location", 400));
            }

            const product = await Product.findById(id);
            if (!product) {
                return next(createError("Product not found", 404));
            }

            // Find or create location
            let loc = product.locations.find((l) => l.location === location);

            if (!loc) {
                if (adjustmentType === "subtract") {
                    return next(createError(`Location ${location} not found in product`, 404));
                }
                // If 'add', create the location
                product.locations.push({
                    location: location,
                    quantityInStock: 0,
                });
                loc = product.locations[product.locations.length - 1];
            }

            let quantityChange = 0;

            if (adjustmentType === "add") {
                loc.quantityInStock += quantity;
                product.totalPhysicalStock += quantity;
                quantityChange = quantity;
            } else if (adjustmentType === "subtract") {
                if (loc.quantityInStock < quantity) {
                    return next(createError("Insufficient stock in location", 400));
                }
                loc.quantityInStock -= quantity;
                product.totalPhysicalStock -= quantity;
                quantityChange = -quantity;
            }

            await product.save();

            // Create Stock Movement
            const stockMovement = new StockMovement({
                productId: product._id,
                quantityChange: quantityChange,
                movementType: STOCK_MOVEMENT_TYPE.MANUAL_ADJUSTMENT,
                movementTime: Date.now(),
                notes: notes || `Manual adjustment: ${adjustmentType} ${quantity} at ${location}`,
                userId: req.user.id,
            });

            await stockMovement.save();

            res.status(200).json(
                response("Product stock adjusted manually successfully", {
                    product,
                    stockMovement,
                }),
            );
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = productController;
