const locationRepository = require("./location.repository");
const productRepository = require("../products/product.repository");
const stockMovementRepository = require("../stockMovements/stockMovement.repository");
const {
    STOCK_MOVEMENT_TYPE,
    WAREHOUSE_ACTIONS,
    EXECUTION_STATUS,
} = require("../../enums/stockMovement.enums");

const response = require("../../utils/responseFactory");
const createError = require("../../utils/errorFactory");
const transactionManager = require("../../database/transactionManager/instance");

// ------------ Helpers ------------

function toLocationKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function buildLocationTotalsMap(products) {
    const totals = new Map();

    for (const product of products) {
        const locations = Array.isArray(product.locations) ? product.locations : [];
        for (const entry of locations) {
            const key = toLocationKey(entry.location);
            if (!key) continue;

            const quantity = Number(entry.quantityInStock || 0);
            const current = totals.get(key) || {
                products: new Set(),
                totalStock: 0,
            };

            if (quantity > 0) {
                current.products.add(String(product._id));
            }
            current.totalStock += quantity;
            totals.set(key, current);
        }
    }

    return totals;
}

function buildLocationSectionTotalsMap(products) {
    const totals = new Map();

    for (const product of products) {
        const locations = Array.isArray(product.locations) ? product.locations : [];

        for (const entry of locations) {
            const locationKey = toLocationKey(entry.location);
            if (!locationKey) continue;

            const sectionName = normalizeSection(entry.section);
            const sectionKey = toSectionKey(sectionName);
            const quantity = Number(entry.quantityInStock || 0);

            let locationStats = totals.get(locationKey);
            if (!locationStats) {
                locationStats = {
                    products: new Set(),
                    totalStock: 0,
                    sections: new Map(),
                };
                totals.set(locationKey, locationStats);
            }

            let sectionStats = locationStats.sections.get(sectionKey);
            if (!sectionStats) {
                sectionStats = {
                    name: sectionName,
                    products: new Set(),
                    totalStock: 0,
                };
                locationStats.sections.set(sectionKey, sectionStats);
            }

            locationStats.totalStock += quantity;
            sectionStats.totalStock += quantity;

            if (quantity > 0) {
                const productId = String(product._id);
                locationStats.products.add(productId);
                sectionStats.products.add(productId);
            }
        }
    }

    return totals;
}

function resolveSectionStats(sectionStatsMap, sectionDoc) {
    const keys = [toSectionKey(sectionDoc?.name), toSectionKey(sectionDoc?.code)].filter(Boolean);
    for (const key of keys) {
        if (sectionStatsMap.has(key)) {
            return sectionStatsMap.get(key);
        }
    }

    return null;
}

function normalizeSection(section) {
    const resolved = String(section || "").trim();
    return resolved || "UNSPECIFIED";
}

function toSectionKey(value) {
    return normalizeSection(value).toLowerCase();
}

function sectionMatches(entrySection, sectionDoc) {
    const sectionKey = toSectionKey(entrySection);
    const sectionNameKey = toSectionKey(sectionDoc?.name);
    const sectionCodeKey = toSectionKey(sectionDoc?.code);

    return sectionKey === sectionNameKey || (sectionCodeKey && sectionKey === sectionCodeKey);
}

function findLocationByName(locations, locationName) {
    const normalized = toLocationKey(locationName);
    return locations.find((location) => toLocationKey(location.name) === normalized) || null;
}

function isActiveSection(locationDoc, sectionName) {
    const normalized = toSectionKey(sectionName);

    if (normalized === "unspecified") {
        return true;
    }

    return (locationDoc.sections || []).some((section) => {
        if (section.isActive === false) return false;
        return (
            toSectionKey(section.name) === normalized || toSectionKey(section.code) === normalized
        );
    });
}

function findProductLocationEntry(product, locationName, sectionName) {
    const normalizedLocation = toLocationKey(locationName);
    const normalizedSection = toSectionKey(sectionName);

    return (product.locations || []).find((entry) => {
        return (
            toLocationKey(entry.location) === normalizedLocation &&
            toSectionKey(entry.section) === normalizedSection
        );
    });
}

function ensureProductLocationEntry(product, locationName, sectionName) {
    const normalizedSection = normalizeSection(sectionName);
    let existingEntry = findProductLocationEntry(product, locationName, normalizedSection);

    if (!existingEntry) {
        product.locations.push({
            location: locationName,
            section: normalizedSection,
            quantityInStock: 0,
        });
        existingEntry = product.locations[product.locations.length - 1];
    }

    return existingEntry;
}

function buildTransferMovement({
    productId,
    quantity,
    createdByUserId,
    fromLocation,
    fromSection,
    toLocation,
    toSection,
}) {
    return {
        productId,
        quantityChange: quantity,
        from: STOCK_MOVEMENT_TYPE.INVENTORY,
        to: STOCK_MOVEMENT_TYPE.INVENTORY,
        createdByUserId,
        notes: `Transferred ${quantity} units from ${fromLocation} / ${fromSection} to ${toLocation} / ${toSection}`,
        warehouseAction: WAREHOUSE_ACTIONS.TRANSFER,
        executionStatus: EXECUTION_STATUS.EXECUTED,
        sourceAllocations: [
            {
                location: fromLocation,
                section: normalizeSection(fromSection),
                quantity,
            },
        ],
        destinationAllocations: [
            {
                location: toLocation,
                section: normalizeSection(toSection),
                quantity,
            },
        ],
        physicalQuantityExecuted: quantity,
        physicalExecutedAt: new Date(),
        physicalExecutedByUserId: createdByUserId,
    };
}

// ------------ Services ------------

const locationService = {
    createLocation: async (req, res, next) => {
        try {
            const payload = req.body;
            const location = await locationRepository.createLocation(payload);
            return res.status(201).json(response("Location created successfully", location));
        } catch (err) {
            if (err?.code === 11000) {
                return next(createError("Location name or code already exists", 409));
            }
            return next(err);
        }
    },

    getLocations: async (req, res, next) => {
        try {
            const locations = await locationRepository.getAllLocations();
            return res.status(200).json(response("Locations retrieved successfully", locations));
        } catch (err) {
            return next(err);
        }
    },

    getLocationOverview: async (req, res, next) => {
        try {
            const [locations, products] = await Promise.all([
                locationRepository.getAllLocations(),
                productRepository.getAllProducts(),
            ]);

            const totalsMap = buildLocationTotalsMap(products);
            const locationSectionTotalsMap = buildLocationSectionTotalsMap(products);

            const overview = locations.map((location) => {
                const key = toLocationKey(location.name);
                const totals = totalsMap.get(key) || { products: new Set(), totalStock: 0 };
                const sectionStatsMap = locationSectionTotalsMap.get(key)?.sections || new Map();

                const sectionKeysUsed = new Set();
                const sectionsOverview = (location.sections || []).map((section) => {
                    const sectionStats = resolveSectionStats(sectionStatsMap, section);
                    const sectionTotalStock = Number(sectionStats?.totalStock || 0);
                    const sectionProductsCount = Number(sectionStats?.products?.size || 0);
                    const matchedKey = sectionStats
                        ? sectionStatsMap.has(toSectionKey(section.code))
                            ? toSectionKey(section.code)
                            : toSectionKey(section.name)
                        : null;

                    if (matchedKey) {
                        sectionKeysUsed.add(matchedKey);
                    }

                    return {
                        _id: section._id,
                        name: section.name,
                        code: section.code,
                        notes: section.notes,
                        isActive: section.isActive,
                        productsCount: sectionProductsCount,
                        totalStock: sectionTotalStock,
                        canDelete: sectionTotalStock === 0,
                        deleteBlockedReason:
                            sectionTotalStock > 0
                                ? "Cannot delete section while it still has stock assigned in products"
                                : null,
                    };
                });

                for (const [sectionKey, sectionStats] of sectionStatsMap.entries()) {
                    if (sectionKeysUsed.has(sectionKey)) {
                        continue;
                    }

                    sectionsOverview.push({
                        _id: `UNSPECIFIED-${sectionKey}`,
                        name: sectionStats.name,
                        code: null,
                        notes: null,
                        isActive: true,
                        productsCount: Number(sectionStats.products.size || 0),
                        totalStock: Number(sectionStats.totalStock || 0),
                        canDelete: Number(sectionStats.totalStock || 0) === 0,
                        deleteBlockedReason:
                            Number(sectionStats.totalStock || 0) > 0
                                ? "Cannot delete section while it still has stock assigned in products"
                                : null,
                    });
                }

                return {
                    ...location.toObject(),
                    productsCount: totals.products.size,
                    totalStock: totals.totalStock,
                    canDelete: totals.totalStock === 0,
                    deleteBlockedReason:
                        totals.totalStock > 0
                            ? "Cannot delete location while it still has stock assigned in products"
                            : null,
                    sectionsOverview,
                };
            });

            return res
                .status(200)
                .json(response("Location overview retrieved successfully", overview));
        } catch (err) {
            return next(err);
        }
    },

    updateLocation: async (req, res, next) => {
        try {
            const { locationId } = req.params;
            const location = await locationRepository.updateLocationById({
                locationId,
                updateObject: req.body,
            });

            if (!location) {
                return next(createError("Location not found", 404));
            }

            return res.status(200).json(response("Location updated successfully", location));
        } catch (err) {
            if (err?.code === 11000) {
                return next(createError("Location name or code already exists", 409));
            }
            return next(err);
        }
    },

    deleteLocation: async (req, res, next) => {
        try {
            const { locationId } = req.params;

            const existingLocation = await locationRepository.getLocationById(locationId);
            if (!existingLocation) {
                return next(createError("Location not found", 404));
            }

            let deletedLocation;
            await transactionManager.run(async (tx) => {
                const products = await productRepository.getAllProducts(null, tx);
                const key = toLocationKey(existingLocation.name);

                const usedInProducts = products.some((product) =>
                    (product.locations || []).some(
                        (entry) =>
                            toLocationKey(entry.location) === key &&
                            Number(entry.quantityInStock || 0) > 0,
                    ),
                );

                if (usedInProducts) {
                    throw createError(
                        "Cannot delete location while it still has stock assigned in products",
                        409,
                    );
                }

                deletedLocation = await locationRepository.deleteLocationById(locationId, tx);
                if (!deletedLocation) {
                    throw createError("Location not found", 404);
                }
            });

            return res.status(200).json(response("Location deleted successfully", deletedLocation));
        } catch (err) {
            return next(err);
        }
    },

    addSection: async (req, res, next) => {
        try {
            const { locationId } = req.params;
            const location = await locationRepository.addSection({
                locationId,
                section: req.body,
            });

            if (!location) {
                return next(createError("Location not found", 404));
            }

            return res.status(200).json(response("Section added successfully", location));
        } catch (err) {
            return next(err);
        }
    },

    updateSection: async (req, res, next) => {
        try {
            const { locationId, sectionId } = req.params;
            const location = await locationRepository.updateSection({
                locationId,
                sectionId,
                updateObject: req.body,
            });

            if (!location) {
                return next(createError("Location or section not found", 404));
            }

            return res.status(200).json(response("Section updated successfully", location));
        } catch (err) {
            return next(err);
        }
    },

    removeSection: async (req, res, next) => {
        try {
            const { locationId, sectionId } = req.params;

            let updatedLocation;
            await transactionManager.run(async (tx) => {
                const location = await locationRepository.getLocationById(locationId, tx);
                if (!location) {
                    throw createError("Location not found", 404);
                }

                const section = (location.sections || []).find(
                    (item) => String(item._id) === String(sectionId),
                );
                if (!section) {
                    throw createError("Section not found", 404);
                }

                const products = await productRepository.getAllProducts(null, tx);
                const locationKey = toLocationKey(location.name);

                const hasStockInSection = products.some((product) =>
                    (product.locations || []).some((entry) => {
                        const quantity = Number(entry.quantityInStock || 0);
                        return (
                            toLocationKey(entry.location) === locationKey &&
                            sectionMatches(entry.section, section) &&
                            quantity > 0
                        );
                    }),
                );

                if (hasStockInSection) {
                    throw createError(
                        "Cannot delete section while it still has stock assigned in products",
                        409,
                    );
                }

                updatedLocation = await locationRepository.removeSection(
                    {
                        locationId,
                        sectionId,
                    },
                    tx,
                );
            });

            return res.status(200).json(response("Section removed successfully", updatedLocation));
        } catch (err) {
            return next(err);
        }
    },

    transferStock: async (req, res, next) => {
        try {
            const { productId, fromLocation, fromSection, toLocation, toSection, quantity } =
                req.body;
            const userId = req.user.id;
            const normalizedFromSection = normalizeSection(fromSection);
            const normalizedToSection = normalizeSection(toSection);

            if (
                toLocation.trim() === fromLocation.trim() &&
                normalizedToSection === normalizedFromSection
            ) {
                throw createError("Source and destination must be different", 400);
            }

            let updatedProduct;
            await transactionManager.run(async (tx) => {
                const [locations, currentProduct] = await Promise.all([
                    locationRepository.getAllLocations(tx),
                    productRepository.getProductById(productId, tx),
                ]);

                if (!currentProduct) {
                    throw createError("Product not found", 404);
                }

                const fromLocationDoc = findLocationByName(locations, fromLocation);
                if (!fromLocationDoc) {
                    throw createError(`Location ${fromLocation} not found`, 404);
                }
                if (fromLocationDoc.isActive === false) {
                    throw createError(`Location ${fromLocation} is inactive`, 409);
                }

                const toLocationDoc = findLocationByName(locations, toLocation);
                if (!toLocationDoc) {
                    throw createError(`Location ${toLocation} not found`, 404);
                }
                if (toLocationDoc.isActive === false) {
                    throw createError(`Location ${toLocation} is inactive`, 409);
                }

                if (!isActiveSection(fromLocationDoc, fromSection)) {
                    throw createError(
                        `Section ${fromSection} not found in location ${fromLocation}`,
                        404,
                    );
                }

                if (!isActiveSection(toLocationDoc, toSection)) {
                    throw createError(
                        `Section ${toSection} not found in location ${toLocation}`,
                        404,
                    );
                }

                const nextInventory = {
                    locations: (currentProduct.locations || []).map((entry) => ({
                        location: entry.location,
                        section: normalizeSection(entry.section),
                        quantityInStock: Number(entry.quantityInStock || 0),
                    })),
                    totalPhysicalStock: Number(currentProduct.totalPhysicalStock || 0),
                    totalTheoreticalStock: Number(currentProduct.totalTheoreticalStock || 0),
                };

                const sourceEntry = findProductLocationEntry(
                    nextInventory,
                    fromLocation,
                    normalizedFromSection,
                );
                if (!sourceEntry) {
                    throw createError(
                        `Source stock not found for ${fromLocation} / ${fromSection}`,
                        404,
                    );
                }

                if (sourceEntry.quantityInStock < quantity) {
                    throw createError("Insufficient stock in source section", 400);
                }

                const destinationEntry = ensureProductLocationEntry(
                    nextInventory,
                    toLocation,
                    normalizedToSection,
                );

                sourceEntry.quantityInStock -= quantity;
                destinationEntry.quantityInStock += quantity;

                updatedProduct = await productRepository.updateProductInventorySnapshot(
                    {
                        productId,
                        locations: nextInventory.locations,
                        totalPhysicalStock: nextInventory.totalPhysicalStock,
                        totalTheoreticalStock: nextInventory.totalTheoreticalStock,
                    },
                    tx,
                );

                await stockMovementRepository.createStockMovement(
                    buildTransferMovement({
                        productId: currentProduct._id,
                        quantity,
                        createdByUserId: userId,
                        fromLocation,
                        fromSection,
                        toLocation,
                        toSection,
                    }),
                    tx,
                );
            });

            return res.status(200).json(response("Stock transferred successfully", updatedProduct));
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = locationService;
