const express = require("express");

const exportController = require("../controllers/export.controller");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Get all collections available for export (Admin)
router.get("/collections", authorizor([ROLES.ADMIN]), exportController.getExportableCollections);

// Export collection data as CSV (Admin)
router.get("/:collection/csv", authorizor([ROLES.ADMIN]), exportController.exportCollectionAsCsv);

// Export collection data as Excel (.xlsx) (Admin)
router.get(
    "/:collection/excel",
    authorizor([ROLES.ADMIN]),
    exportController.exportCollectionAsExcel,
);

module.exports = router;
