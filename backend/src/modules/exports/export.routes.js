const express = require("express");

const exportService = require("./export.service");

const authorizor = require("../../middlewares/authorizor");
const { ROLES } = require("../../enums/user.enums");

const router = express.Router();

// Get all collections available for export (Admin)
router.get("/collections", authorizor([ROLES.ADMIN]), exportService.getExportableCollections);

// Export collection data as CSV (Admin)
router.get("/:collection/csv", authorizor([ROLES.ADMIN]), exportService.exportCollectionAsCsv);

// Export collection data as Excel (.xlsx) (Admin)
router.get("/:collection/excel", authorizor([ROLES.ADMIN]), exportService.exportCollectionAsExcel);

module.exports = router;
