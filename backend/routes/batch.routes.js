const express = require("express");

const batchService = require("../services/batch.service");
const batchDtos = require("../dtos/batch.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Create Batch (Planner, Admin)
router.post(
    "/",
    authorizor([ROLES.PLANNING, ROLES.ADMIN]),
    validator({ bodySchema: batchDtos.createBatchSchema }),
    batchService.createBatch,
);

// Get All Batches (Planner, Admin, Inventory)
router.get(
    "/",
    authorizor([ROLES.PLANNING, ROLES.ADMIN, ROLES.INVENTORY]),
    batchService.getAllBatches,
);

// Get Batch by ID (Planner, Admin, Inventory)
router.get(
    "/:id",
    authorizor([ROLES.PLANNING, ROLES.ADMIN, ROLES.INVENTORY]),
    batchService.getBatchById,
);

// Update Batch (Planner, Admin)
router.put(
    "/:id",
    authorizor([ROLES.PLANNING, ROLES.ADMIN]),
    validator({ bodySchema: batchDtos.updateBatchSchema }),
    batchService.updateBatch,
);

// Delete Batch (Admin only)
router.delete("/:id", authorizor([ROLES.ADMIN]), batchService.deleteBatch);

// Finalize Planning (Planner, Admin)
router.patch(
    "/:id/finalize-planning",
    authorizor([ROLES.PLANNING, ROLES.ADMIN]),
    batchService.finalizePlanning,
);

// Finalize Production (Planner, Admin)
router.patch(
    "/:id/finalize-production",
    authorizor([ROLES.PLANNING, ROLES.ADMIN, ROLES.PRODUCTION]),
    batchService.finalizeProduction,
);

module.exports = router;
