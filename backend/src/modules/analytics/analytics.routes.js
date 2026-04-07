const express = require("express");

const analyticsService = require("./analytics.service");
const analyticsDtos = require("./analytics.dtos");

const validator = require("../../middlewares/validator");
const authorizor = require("../../middlewares/authorizor");
const { ROLES } = require("../../enums/user.enums");

const router = express.Router();

// all analytics endpoints are restricted to admin users only.
router.use(authorizor([ROLES.ADMIN]));

// Top-level KPIs for owners / general management.
router.get(
    "/executive",
    validator({ querySchema: analyticsDtos.dateRangeQuerySchema }),
    analyticsService.getExecutiveSummary,
);

// Revenue trend, customer rankings, order funnel, and product performance.
router.get(
    "/sales",
    validator({ querySchema: analyticsDtos.salesQuerySchema }),
    analyticsService.getSalesDashboard,
);

// Batch status, plan attainment, loss tracking, and production timeline.
router.get(
    "/production",
    validator({ querySchema: analyticsDtos.productionQuerySchema }),
    analyticsService.getProductionDashboard,
);

// Stock levels per location, movement breakdown, low-stock alerts, and variance.
router.get(
    "/inventory",
    validator({ querySchema: analyticsDtos.dateRangeQuerySchema }),
    analyticsService.getInventoryDashboard,
);

// Issue tracking, resolution times, manual adjustment frequency, and user activity.
router.get(
    "/operations",
    validator({ querySchema: analyticsDtos.dateRangeQuerySchema }),
    analyticsService.getOperationsDashboard,
);

module.exports = router;
