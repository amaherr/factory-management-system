const Inventory = require("../models/inventory.model");
const Product = require("../models/product.model");
const StockMovement = require("../models/stockMovement.model");
const createError = require("../utils/errorFactory");
const { FACTORY_LOCATIONS } = require("../enums/inventory.enums");
const STOCK_MOVEMENT_TYPE = require("../enums/stockMovement.enums");

const inventoryController = {

    // 1. Create inventory instance (admin, inventory)
    createInventory: async (req, res, next) => {
        try {
            const { productId, totalInStock, quantitySold, locations } = req.body;

            // Check if product exists
            const product = await Product.findById(productId);
            if (!product) {
                return next(createError("Product not found", 404));
            }

            // Check if inventory already exists for this product
            const existingInventory = await Inventory.findOne({ productId });
            if (existingInventory) {
                return next(createError("Inventory already exists for this product", 400));
            }

            const newInventory = new Inventory({
                productId,
                totalInStock: totalInStock || 0,
                quantitySold: quantitySold || 0,
                locations: locations || [],
            });

            await newInventory.save();

            res.status(201).json({
                success: true,
                message: "Inventory created successfully",
                data: newInventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 2. Update inventory instance (admin, inventory)
    updateInventory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Prevent updating productId
            if (updates.productId) {
                return next(createError("Product ID cannot be updated", 400));
            }

            const inventory = await Inventory.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true,
            });

            if (!inventory) {
                return next(createError("Inventory not found", 404));
            }

            res.status(200).json({
                success: true,
                message: "Inventory updated successfully",
                data: inventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 3. Delete inventory instance (admin, inventory)
    deleteInventory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const inventory = await Inventory.findByIdAndDelete(id);

            if (!inventory) {
                return next(createError("Inventory not found", 404));
            }

            res.status(200).json({
                success: true,
                message: "Inventory deleted successfully",
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 4. Get all inventory items (authenticated user any role)
    getAllInventory: async (req, res, next) => {
        try {
            const inventory = await Inventory.find().populate("productId");

            res.status(200).json({
                success: true,
                data: inventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 5. Get all inventory items that has stock (authenticated user any role)
    getAllInventoryWithStock: async (req, res, next) => {
        try {
            const inventory = await Inventory.find({ totalInStock: { $gt: 0 } }).populate("productId");

            res.status(200).json({
                success: true,
                data: inventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 6. Get inventory by location (admin, inventory)
    getInventoryByLocation: async (req, res, next) => {
        try {
            const { location } = req.params;

            // Validate location
            if (!Object.values(FACTORY_LOCATIONS).includes(location)) {
                return next(createError("Invalid location", 400));
            }

            const inventory = await Inventory.find({
                "locations.location": location,
            }).populate("productId");

            // Filter to show only the requested location's stock
            const filteredInventory = inventory.map((item) => {
                const locationData = item.locations.find((loc) => loc.location === location);
                return {
                    _id: item._id,
                    productId: item.productId,
                    totalInStock: item.totalInStock,
                    quantitySold: item.quantitySold,
                    location: locationData,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                };
            });

            res.status(200).json({
                success: true,
                data: filteredInventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 7. Transfer inventory from one location to another (admin, inventory)
    transferInventory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { fromLocation, toLocation, quantity } = req.body;

            if (!fromLocation || !toLocation || !quantity) {
                return next(createError("fromLocation, toLocation, and quantity are required", 400));
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

            const inventory = await Inventory.findById(id);
            if (!inventory) {
                return next(createError("Inventory not found", 404));
            }

            // Find source location
            const fromLoc = inventory.locations.find((loc) => loc.location === fromLocation);
            if (!fromLoc) {
                return next(createError(`Source location ${fromLocation} not found in inventory`, 404));
            }

            if (fromLoc.quantityInStock < quantity) {
                return next(createError("Insufficient stock in source location", 400));
            }

            // Find or create destination location
            let toLoc = inventory.locations.find((loc) => loc.location === toLocation);
            if (!toLoc) {
                inventory.locations.push({
                    location: toLocation,
                    quantityInStock: 0,
                });
                toLoc = inventory.locations[inventory.locations.length - 1];
            }

            // Perform transfer
            fromLoc.quantityInStock -= quantity;
            toLoc.quantityInStock += quantity;

            await inventory.save();

            res.status(200).json({
                success: true,
                message: "Inventory transferred successfully",
                data: inventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 8. Add stock quantity (admin, inventory)
    addStock: async (req, res, next) => {
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

            const inventory = await Inventory.findById(id);
            if (!inventory) {
                return next(createError("Inventory not found", 404));
            }

            // Find or create location
            let loc = inventory.locations.find((l) => l.location === location);
            if (!loc) {
                inventory.locations.push({
                    location: location,
                    quantityInStock: 0,
                });
                loc = inventory.locations[inventory.locations.length - 1];
            }

            // Increase stock in location and global counter
            loc.quantityInStock += quantity;
            inventory.totalInStock += quantity;

            await inventory.save();

            res.status(200).json({
                success: true,
                message: "Stock added successfully",
                data: inventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 9. Sell inventory (admin, inventory)
    sellInventory: async (req, res, next) => {
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

            const inventory = await Inventory.findById(id);
            if (!inventory) {
                return next(createError("Inventory not found", 404));
            }

            // Find location
            const loc = inventory.locations.find((l) => l.location === location);
            if (!loc) {
                return next(createError(`Location ${location} not found in inventory`, 404));
            }

            if (loc.quantityInStock < quantity) {
                return next(createError("Insufficient stock in location", 400));
            }

            if (inventory.totalInStock < quantity) {
                return next(createError("Insufficient total stock", 400));
            }

            // Process sale: quantitySold += qty, totalInStock -= qty, locations[loc].quantityInStock -= qty
            inventory.quantitySold += quantity;
            inventory.totalInStock -= quantity;
            loc.quantityInStock -= quantity;

            await inventory.save();

            res.status(200).json({
                success: true,
                message: "Sale processed successfully",
                data: inventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // 10. Get inventory for one product by productId (admin, inventory)
    getInventoryByProductId: async (req, res, next) => {
        try {
            const { productId } = req.params;

            const inventory = await Inventory.findOne({ productId }).populate("productId");

            if (!inventory) {
                return next(createError("Inventory not found for this product", 404));
            }

            res.status(200).json({
                success: true,
                data: inventory,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },
        // 11. Manual stock adjustment (Admin, Inventory)
    manualAdjustment: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { location, adjustmentType, quantity, notes } = req.body;

            if (!location || !adjustmentType || !quantity) {
                 return next(createError("Location, adjustmentType, and quantity are required", 400));
            }

            if (!['add', 'subtract'].includes(adjustmentType)) {
                 return next(createError("Adjustment type must be 'add' or 'subtract'", 400));
            }
             
            if (quantity <= 0) {
                 return next(createError("Quantity must be greater than 0", 400));
            }

             // Validate location
             if (!Object.values(FACTORY_LOCATIONS).includes(location)) {
                 return next(createError("Invalid location", 400));
             }

             const inventory = await Inventory.findById(id);
             if (!inventory) {
                 return next(createError("Inventory not found", 404));
             }

             // Find or create location (for 'add' we might need to create it)
             let loc = inventory.locations.find((l) => l.location === location);
             
             if (!loc) {
                 if (adjustmentType === 'subtract') {
                     return next(createError(`Location ${location} not found in inventory`, 404));
                 }
                 // If 'add', create the location
                 inventory.locations.push({
                     location: location,
                     quantityInStock: 0,
                 });
                 loc = inventory.locations[inventory.locations.length - 1];
             }

             let quantityChange = 0;

             if (adjustmentType === 'add') {
                 loc.quantityInStock += quantity;
                 inventory.totalInStock += quantity;
                 quantityChange = quantity;
             } else if (adjustmentType === 'subtract') {
                 if (loc.quantityInStock < quantity) {
                     return next(createError("Insufficient stock in location", 400));
                 }
                 loc.quantityInStock -= quantity;
                 inventory.totalInStock -= quantity;
                 quantityChange = -quantity;
             }

             await inventory.save();

             // Create Stock Movement
             const stockMovement = new StockMovement({
                 productId: inventory.productId,
                 quantityChange: quantityChange,
                 movementType: STOCK_MOVEMENT_TYPE.MANUAL_ADJUSTMENT,
                 movementTime: Date.now(),
                 notes: notes || `Manual adjustment: ${adjustmentType} ${quantity} at ${location}`,
                 userId: req.user.id
             });
             
             await stockMovement.save();

             res.status(200).json({
                 success: true,
                 message: "Inventory adjusted manually successfully",
                 data: {
                     inventory,
                     stockMovement
                 },
             });

        } catch (err) {
            next(createError(err.message, 500));
        }
    },
};

module.exports = inventoryController;
