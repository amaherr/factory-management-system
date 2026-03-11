const express = require("express");

const analyticsController = require("../controllers/analytics.controller");
const analyticsDtos = require("../dtos/analytics.dtos");

const validator = require("../middlewares/validator");
const authorizor = require("../middlewares/authorizor");
const { ROLES } = require("../enums/user.enums");

const router = express.Router();

// all analytics endpoints are restricted to admin users only.
router.use(authorizor([ROLES.ADMIN]));

// Top-level KPIs for owners / general management.
router.get(
    "/executive",
    validator({ querySchema: analyticsDtos.dateRangeQuerySchema }),
    analyticsController.getExecutiveSummary,
);

// Revenue trend, customer rankings, order funnel, and product performance.
router.get(
    "/sales",
    validator({ querySchema: analyticsDtos.salesQuerySchema }),
    analyticsController.getSalesDashboard,
);

// Batch status, plan attainment, loss tracking, and production timeline.
router.get(
    "/production",
    validator({ querySchema: analyticsDtos.productionQuerySchema }),
    analyticsController.getProductionDashboard,
);

// Stock levels per location, movement breakdown, low-stock alerts, and variance.
router.get(
    "/inventory",
    validator({ querySchema: analyticsDtos.dateRangeQuerySchema }),
    analyticsController.getInventoryDashboard,
);

// Issue tracking, resolution times, manual adjustment frequency, and user activity.
router.get(
    "/operations",
    validator({ querySchema: analyticsDtos.dateRangeQuerySchema }),
    analyticsController.getOperationsDashboard,
);

module.exports = router;
