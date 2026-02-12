const express = require("express");

const batchController = require("../controllers/batch.controller");
const batchDtos = require("../dtos/batch.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// Create Batch (Planner, Admin)
router.post(
    "/",
    authorizor([ROLES.PLANNER, ROLES.ADMIN]),
    validator({ bodySchema: batchDtos.createBatchSchema }),
    batchController.createBatch,
);

// Get All Batches (Planner, Admin, Inventory)
router.get(
    "/",
    authorizor([ROLES.PLANNER, ROLES.ADMIN, ROLES.INVENTORY]),
    batchController.getAllBatches,
);

// Get Batch by ID (Planner, Admin, Inventory)
router.get(
    "/:id",
    authorizor([ROLES.PLANNER, ROLES.ADMIN, ROLES.INVENTORY]),
    batchController.getBatchById,
);

// Update Batch (Planner, Admin)
router.put(
    "/:id",
    authorizor([ROLES.PLANNER, ROLES.ADMIN]),
    validator({ bodySchema: batchDtos.updateBatchSchema }),
    batchController.updateBatch,
);

// Delete Batch (Admin only)
router.delete("/:id", authorizor([ROLES.ADMIN]), batchController.deleteBatch);

// Finalize Planning (Planner, Admin)
router.patch(
    "/:id/finalize-planning",
    authorizor([ROLES.PLANNER, ROLES.ADMIN]),
    batchController.finalizePlanning,
);

// Finalize Production (Planner, Admin)
router.patch(
    "/:id/finalize-production",
    authorizor([ROLES.PLANNER, ROLES.ADMIN, ROLES.PRODUCTION]),
    batchController.finalizeProduction,
);

module.exports = router;
