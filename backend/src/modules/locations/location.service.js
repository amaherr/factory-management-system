const locationRepository = require("./location.repository");
const productRepository = require("../products/product.repository");

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
                productsCount: 0,
                totalStock: 0,
            };

            if (quantity > 0) {
                current.productsCount += 1;
            }
            current.totalStock += quantity;
            totals.set(key, current);
        }
    }

    return totals;
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
            const overview = locations.map((location) => {
                const key = toLocationKey(location.name);
                const totals = totalsMap.get(key) || { productsCount: 0, totalStock: 0 };
                return {
                    ...location.toObject(),
                    productsCount: totals.productsCount,
                    totalStock: totals.totalStock,
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
            const location = await locationRepository.removeSection({
                locationId,
                sectionId,
            });

            if (!location) {
                return next(createError("Location not found", 404));
            }

            return res.status(200).json(response("Section removed successfully", location));
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = locationService;
