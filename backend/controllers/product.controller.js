const Product = require("../models/product.model");
const { PRODUCT_STATUS, FACTORY_LOCATIONS } = require("../enums/product.enums");

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

            // query product to validate
            const product = await Product.findById(id);

            // validate product
            if (!product) {
                return next(createError("Product not found", 404));
            }
            if (updates.code && product.status !== PRODUCT_STATUS.PENDING) {
                return next(createError("Product code cannot be updated for this product", 409));
            }

            const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true,
            });

            res.status(200).json(response("Product updated successfully", updatedProduct));
        } catch (err) {
            return next(err);
        }
    },

    changeProductActivation: async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { status } = req.body;
            const userId = req.user.id;

            // build updates object
            const now = new Date();
            const update = { status };

            if (status === PRODUCT_STATUS.DEACTIVE) {
                update.deactivatedByUserId = userId;
                update.deactivatedAt = Date.now();

                // clear activation metadata
                update.activatedAt = null;
                update.activatedByUserId = null;
            } else if (status === PRODUCT_STATUS.ACTIVE) {
                update.activatedByUserId = userId;
                update.activatedAt = Date.now();

                // clear deactivation metadata
                update.deactivatedAt = null;
                update.deactivatedByUserId = null;
            }

            // change product activation status
            const product = await Product.findByIdAndUpdate(productId, update, {
                new: true,
                runValidators: true,
            });
            if (!product) {
                return next(createError("Product not found", 404));
            }

            res.status(200).json(response("Changed product status successfully", product));
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
            const { productId } = req.params;
            const { fromLocation, toLocation, quantity } = req.body;

            const product = await Product.findById(productId);
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

    // Manual Physical Stock Adjustment
    manualPhysicalStockAdjustment: async (req, res, next) => {
        try {
            const { productId } = req.params;
            const { location, adjustmentType, quantity } = req.body;

            const product = await Product.findById(productId);
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

            if (adjustmentType === "add") {
                loc.quantityInStock += quantity;
                product.totalPhysicalStock += quantity;
            } else if (adjustmentType === "subtract") {
                if (loc.quantityInStock < quantity) {
                    return next(createError("Insufficient stock in location", 400));
                }
                loc.quantityInStock -= quantity;
                product.totalPhysicalStock -= quantity;
            }

            await product.save();

            res.status(200).json(response("Product stock adjusted manually successfully", product));
        } catch (err) {
            return next(err);
        }
    },

    // function to set the phyiscal stock to a new number
    setPhysicalStock: async (req, res, next) => {
        try {
            const productId = req.params.productId;
            const { location, newQuantity } = req.body;

            const qty = Number(newQuantity);

            const product = await Product.findById(productId);
            if (!product) {
                return next(createError("Product not found", 404));
            }

            // find or create location
            let loc = product.locations.find((l) => l.location === location);
            if (!loc) {
                product.locations.push({ location, quantityInStock: 0 });
                loc = product.locations[product.locations.length - 1];
            }

            const prevQty = Number(loc.quantityInStock || 0);
            const delta = qty - prevQty;

            // apply updates
            loc.quantityInStock = qty;

            // update totalPhysicalStock based on delta
            const nextTotalPhysical = Number(product.totalPhysicalStock || 0) + delta;
            if (nextTotalPhysical < 0) {
                // should never happen, but protects against corrupted data
                return next(createError("totalPhysicalStock cannot become negative", 409));
            }

            product.totalPhysicalStock = nextTotalPhysical;

            await product.save();

            return res.status(200).json(
                response("Physical stock updated successfully", {
                    productId: product._id,
                    location,
                    previousQuantity: prevQty,
                    newQuantity: qty,
                    delta,
                    totalPhysicalStock: product.totalPhysicalStock,
                    locations: product.locations,
                }),
            );
        } catch (err) {
            next(err);
        }
    },
};

module.exports = productController;
