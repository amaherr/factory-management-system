const express = require("express");

const locationService = require("./location.service");
const locationDtos = require("./location.dtos");

const validator = require("../../middlewares/validator");
const authorizor = require("../../middlewares/authorizor");
const createError = require("../../utils/errorFactory");
const { ROLES } = require("../../enums/user.enums");

const router = express.Router();

router.get(
    "/",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    locationService.getLocations,
);

router.get(
    "/overview",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY, ROLES.ACCOUNTING]),
    locationService.getLocationOverview,
);

router.post(
    "/",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: locationDtos.createLocationSchema }),
    locationService.createLocation,
);

router.patch(
    "/:locationId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: locationDtos.updateLocationSchema }),
    locationService.updateLocation,
);

router.delete(
    "/:locationId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    locationService.deleteLocation,
);

router.post(
    "/:locationId/sections",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: locationDtos.createSectionSchema }),
    locationService.addSection,
);

router.patch(
    "/:locationId/sections/:sectionId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: locationDtos.updateSectionSchema }),
    locationService.updateSection,
);

router.delete(
    "/:locationId/sections/:sectionId",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    locationService.removeSection,
);

router.post(
    "/transfer-stock",
    authorizor([ROLES.ADMIN, ROLES.INVENTORY]),
    validator({ bodySchema: locationDtos.transferStockSchema }),
    locationService.transferStock,
);

module.exports = router;
