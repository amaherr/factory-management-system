const mongoose = require("mongoose");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const Product = require("../models/product.model");
const { PRODUCT_STATUS, FACTORY_LOCATIONS } = require("../enums/product.enums");
const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../enums/stockMovement.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");
const { createStockMovement } = require("../utils/helpers");

// ------------ Helpers ------------

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

function hashFileName(originalName) {
    const ext = path.extname(originalName || "").toLowerCase();
    const hash = crypto.randomBytes(16).toString("hex");
    return `${hash}${ext}`;
}

function saveUploadedFile(file) {
    if (!file) {
        return null;
    }

    ensureUploadsDir();

    const fileName = hashFileName(file.originalname);
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${fileName}`;
}

function deleteUploadedFile(url) {
    if (!url || typeof url !== "string") {
        return false;
    }

    const normalized = url.replace(/\\/g, "/");
    const uploadsPrefix = "/uploads/";

    if (!normalized.startsWith(uploadsPrefix)) {
        return false;
    }

    const fileName = normalized.slice(uploadsPrefix.length);
    if (!fileName) {
        return false;
    }

    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }

    return false;
}

function findLocation(product, location) {
    return product.locations.find((entry) => entry.location === location);
}

function ensureLocation(product, location) {
    let existingLocation = findLocation(product, location);

    if (!existingLocation) {
        product.locations.push({
            location,
            quantityInStock: 0,
        });
        existingLocation = product.locations[product.locations.length - 1];
    }

    return existingLocation;
}

function buildPhysicalAdjustmentMovement({
    productId,
    location,
    quantity,
    createdByUserId,
    notes,
    delta,
}) {
    const commonPayload = {
        productId,
        quantityChange: quantity,
        createdByUserId,
        notes,
        isExecuted: true,
        physicalExecutedAt: new Date(),
        physicalExecutedByUserId: createdByUserId,
    };

    if (delta > 0) {
        return {
            ...commonPayload,
            from: STOCK_MOVEMENT_TYPE.MANUAL_ADJUSTMENT,
            to: STOCK_MOVEMENT_TYPE.INVENTORY,
            warehouseAction: WAREHOUSE_ACTIONS.RECEIVE,
            destinationLocation: location,
        };
    }

    return {
        ...commonPayload,
        from: STOCK_MOVEMENT_TYPE.INVENTORY,
        to: STOCK_MOVEMENT_TYPE.MANUAL_ADJUSTMENT,
        warehouseAction: WAREHOUSE_ACTIONS.PICK,
        sourceLocation: location,
    };
}

// ------------ Services ------------

const productService = {
    createProduct: async (req, res, next) => {
        try {
            const {
                code,
                name,
                description,
                color,
                defaultImage,
                sku,
                unitCostPrice,
                unitSalePrice,
                season,
            } = req.body;

            const existingProduct = await Product.findOne({ code });
            if (existingProduct) {
                return next(createError("Product with this code already exists", 400));
            }

            const uploadedImageUrl = req.file ? saveUploadedFile(req.file) : null;
            const resolvedImage = uploadedImageUrl || defaultImage;

            const resolvedSku = Number(sku);
            const resolvedCostPrice = Number(unitCostPrice);
            const resolvedSalePrice = Number(unitSalePrice);

            const newProduct = new Product({
                code,
                name,
                description,
                color,
                defaultImage: resolvedImage,
                sku: resolvedSku,
                unitCostPrice: resolvedCostPrice,
                unitSalePrice: resolvedSalePrice,
                lineCostPrice: resolvedSku * resolvedCostPrice,
                lineSalePrice: resolvedSku * resolvedSalePrice,
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
            const updates = { ...req.body };
            const shouldRemoveImage =
                updates.removeImage === true || updates.removeImage === "true";

            // query product to validate
            const product = await Product.findById(id);

            // validate product
            if (!product) {
                return next(createError("Product not found", 404));
            }
            if (updates.code && product.status === PRODUCT_STATUS.ACTIVE) {
                return next(createError("Product code cannot be updated for this product", 409));
            }

            // perform the updates
            if (shouldRemoveImage && product.defaultImage) {
                deleteUploadedFile(product.defaultImage);
                updates.defaultImage = null;
            }

            if (req.file) {
                const uploadedImageUrl = saveUploadedFile(req.file);
                if (uploadedImageUrl) {
                    if (product.defaultImage) {
                        deleteUploadedFile(product.defaultImage);
                    }
                    updates.defaultImage = uploadedImageUrl;
                }
            }

            delete updates.removeImage;

            const nextSku = updates.sku !== undefined ? Number(updates.sku) : Number(product.sku);
            const nextCostPrice =
                updates.unitCostPrice !== undefined
                    ? Number(updates.unitCostPrice)
                    : Number(product.unitCostPrice);
            const nextSalePrice =
                updates.unitSalePrice !== undefined
                    ? Number(updates.unitSalePrice)
                    : Number(product.unitSalePrice);

            if (
                !Number.isFinite(nextSku) ||
                !Number.isFinite(nextCostPrice) ||
                !Number.isFinite(nextSalePrice)
            ) {
                return next(
                    createError(
                        "sku, unitCostPrice, and unitSalePrice must be valid numbers to compute line prices",
                        400,
                    ),
                );
            }

            updates.sku = nextSku;
            updates.unitCostPrice = nextCostPrice;
            updates.unitSalePrice = nextSalePrice;
            updates.lineCostPrice = nextSku * nextCostPrice;
            updates.lineSalePrice = nextSku * nextSalePrice;

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
        const session = await mongoose.startSession();

        try {
            const { productId } = req.params;
            const { fromLocation, toLocation, quantity } = req.body;
            const userId = req.user.id;

            const product = await session.withTransaction(async () => {
                const currentProduct = await Product.findById(productId).session(session);
                if (!currentProduct) {
                    throw createError("Product not found", 404);
                }

                const fromLoc = findLocation(currentProduct, fromLocation);
                if (!fromLoc) {
                    throw createError(`Source location ${fromLocation} not found in product`, 404);
                }

                if (fromLoc.quantityInStock < quantity) {
                    throw createError("Insufficient stock in source location", 400);
                }

                const toLoc = ensureLocation(currentProduct, toLocation);

                fromLoc.quantityInStock -= quantity;
                toLoc.quantityInStock += quantity;

                await currentProduct.save({ session });

                await createStockMovement(
                    {
                        productId: currentProduct._id,
                        quantityChange: quantity,
                        from: STOCK_MOVEMENT_TYPE.INVENTORY,
                        to: STOCK_MOVEMENT_TYPE.INVENTORY,
                        createdByUserId: userId,
                        notes: `Transferred ${quantity} units from ${fromLocation} to ${toLocation}`,
                        warehouseAction: WAREHOUSE_ACTIONS.TRANSFER,
                        isExecuted: true,
                        sourceLocation: fromLocation,
                        destinationLocation: toLocation,
                        physicalExecutedAt: new Date(),
                        physicalExecutedByUserId: userId,
                    },
                    session,
                );

                return currentProduct;
            });

            return res.status(200).json(response("Stock transferred successfully", product));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // Manual Physical Stock Adjustment
    manualPhysicalStockAdjustment: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const { productId } = req.params;
            const { location, adjustmentType, quantity } = req.body;
            const userId = req.user.id;

            const product = await session.withTransaction(async () => {
                const currentProduct = await Product.findById(productId).session(session);
                if (!currentProduct) {
                    throw createError("Product not found", 404);
                }

                let loc = findLocation(currentProduct, location);

                if (!loc) {
                    if (adjustmentType === "subtract") {
                        throw createError(`Location ${location} not found in product`, 404);
                    }

                    loc = ensureLocation(currentProduct, location);
                }

                const totalPhysicalStock = Number(currentProduct.totalPhysicalStock || 0);
                const totalTheoreticalStock = Number(currentProduct.totalTheoreticalStock || 0);

                if (adjustmentType === "add") {
                    loc.quantityInStock += quantity;
                    currentProduct.totalPhysicalStock = totalPhysicalStock + quantity;
                    currentProduct.totalTheoreticalStock = totalTheoreticalStock + quantity;
                } else if (adjustmentType === "subtract") {
                    if (loc.quantityInStock < quantity) {
                        throw createError("Insufficient stock in location", 400);
                    }

                    if (totalPhysicalStock < quantity || totalTheoreticalStock < quantity) {
                        throw createError("Stock totals cannot become negative", 409);
                    }

                    loc.quantityInStock -= quantity;
                    currentProduct.totalPhysicalStock = totalPhysicalStock - quantity;
                    currentProduct.totalTheoreticalStock = totalTheoreticalStock - quantity;
                }

                await currentProduct.save({ session });

                await createStockMovement(
                    buildPhysicalAdjustmentMovement({
                        productId: currentProduct._id,
                        location,
                        quantity,
                        createdByUserId: userId,
                        notes: `Manual physical stock ${adjustmentType} of ${quantity} units at ${location}`,
                        delta: adjustmentType === "add" ? quantity : -quantity,
                    }),
                    session,
                );

                return currentProduct;
            });

            return res
                .status(200)
                .json(response("Product stock adjusted manually successfully", product));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // function to set the phyiscal stock to a new number
    setPhysicalStock: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const productId = req.params.productId;
            const { location, newQuantity } = req.body;
            const userId = req.user.id;

            const qty = Number(newQuantity);

            const result = await session.withTransaction(async () => {
                const product = await Product.findById(productId).session(session);
                if (!product) {
                    throw createError("Product not found", 404);
                }

                const loc = ensureLocation(product, location);
                const prevQty = Number(loc.quantityInStock || 0);
                const delta = qty - prevQty;

                loc.quantityInStock = qty;

                const nextTotalPhysical = Number(product.totalPhysicalStock || 0) + delta;
                const nextTotalTheoretical = Number(product.totalTheoreticalStock || 0) + delta;
                if (nextTotalPhysical < 0) {
                    throw createError("totalPhysicalStock cannot become negative", 409);
                }
                if (nextTotalTheoretical < 0) {
                    throw createError("totalTheoreticalStock cannot become negative", 409);
                }

                product.totalPhysicalStock = nextTotalPhysical;
                product.totalTheoreticalStock = nextTotalTheoretical;

                await product.save({ session });

                if (delta !== 0) {
                    await createStockMovement(
                        buildPhysicalAdjustmentMovement({
                            productId: product._id,
                            location,
                            quantity: Math.abs(delta),
                            createdByUserId: userId,
                            notes: `Physical stock set from ${prevQty} to ${qty} at ${location}`,
                            delta,
                        }),
                        session,
                    );
                }

                return {
                    productId: product._id,
                    location,
                    previousQuantity: prevQty,
                    newQuantity: qty,
                    delta,
                    totalPhysicalStock: product.totalPhysicalStock,
                    totalTheoreticalStock: product.totalTheoreticalStock,
                    locations: product.locations,
                };
            });

            return res.status(200).json(response("Physical stock updated successfully", result));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },
};

module.exports = productService;
