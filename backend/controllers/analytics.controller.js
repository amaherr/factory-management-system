const Order = require("../models/order.model");
const Return = require("../models/return.model");
const Product = require("../models/product.model");
const Batch = require("../models/batch.model");
const BatchEvent = require("../models/batchEvent.model");
const StockMovement = require("../models/stockMovement.model");
const Issue = require("../models/issue.model");

const response = require("../utils/responseFactory");

const { ORDER_STATUS } = require("../enums/order.enums");
const { RETURN_STATUS } = require("../enums/return.enums");
const { PRODUCT_STATUS } = require("../enums/product.enums");
const { BATCH_STATUS } = require("../enums/batch.enums");
const { ISSUE_STATUS } = require("../enums/issue.enums");

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const parseSafeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Builds a MongoDB date range filter for the given field.
 * Returns {} when neither bound is provided (meaning "all time").
 */
const buildDateFilter = (from, to, field = "createdAt") => {
    const fromDate = parseSafeDate(from);
    const toDate = parseSafeDate(to);
    if (!fromDate && !toDate) return {};
    const range = {};
    if (fromDate) range.$gte = fromDate;
    if (toDate) range.$lte = toDate;
    return { [field]: range };
};

/** Convert a millisecond duration to rounded hours. */
const msToHours = (ms) => parseFloat((ms / 3_600_000).toFixed(1));

/**
 * Derive the $dateToString format string from a granularity hint.
 * Supported: "day" | "week" | "month"  (default: "day")
 */
const dateFormat = (granularity) => {
    if (granularity === "month") return "%Y-%m";
    if (granularity === "week") return "%Y-%U";
    return "%Y-%m-%d";
};

// ---------------------------------------------------------------------------
// Executive Summary  –  /api/analytics/executive
// ---------------------------------------------------------------------------

const getExecutiveSummary = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const orderFilter = buildDateFilter(from, to, "finalizedAt");
        const returnFilter = buildDateFilter(from, to, "returnDate");
        const orderCreatedFilter = buildDateFilter(from, to, "createdAt");

        const [
            revenueResult,
            returnResult,
            orderFunnel,
            stockResult,
            planAttainmentResult,
            openIssues,
            productsByStatus,
        ] = await Promise.all([
            // Revenue, discount and order count from finalized orders
            Order.aggregate([
                { $match: { status: ORDER_STATUS.FINALIZED, ...orderFilter } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$total" },
                        totalDiscount: { $sum: "$discountAmount" },
                        totalSubTotal: { $sum: "$subTotal" },
                        orderCount: { $sum: 1 },
                    },
                },
            ]),

            // Return value from finalized returns
            Return.aggregate([
                { $match: { status: RETURN_STATUS.FINALIZED, ...returnFilter } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: null,
                        totalReturnValue: {
                            $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
                        },
                        returnCount: { $sum: 1 },
                    },
                },
            ]),

            // Order counts by status (for funnel widget)
            Order.aggregate([
                { $match: orderCreatedFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),

            // Live global stock snapshot (active products only; not date-filtered)
            Product.aggregate([
                { $match: { status: PRODUCT_STATUS.ACTIVE } },
                {
                    $group: {
                        _id: null,
                        totalPhysical: { $sum: "$totalPhysicalStock" },
                        totalTheoretical: { $sum: "$totalTheoreticalStock" },
                        outOfStockCount: {
                            $sum: { $cond: [{ $eq: ["$totalPhysicalStock", 0] }, 1, 0] },
                        },
                    },
                },
            ]),

            // Average plan attainment across all completed batches (not date-filtered)
            Batch.aggregate([
                { $match: { status: BATCH_STATUS.DONE, producedQuantity: { $gt: 0 } } },
                {
                    $group: {
                        _id: null,
                        avgAttainment: {
                            $avg: {
                                $cond: [
                                    { $eq: ["$plannedQuantity", 0] },
                                    0,
                                    {
                                        $multiply: [
                                            { $divide: ["$producedQuantity", "$plannedQuantity"] },
                                            100,
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            ]),

            // Live count of open / in-progress issues
            Issue.countDocuments({
                status: { $in: [ISSUE_STATUS.OPEN, ISSUE_STATUS.IN_PROGRESS] },
            }),

            // Active / pending / deactivated product counts
            Product.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        ]);

        const rev = revenueResult[0] ?? {
            totalRevenue: 0,
            totalDiscount: 0,
            totalSubTotal: 0,
            orderCount: 0,
        };
        const ret = returnResult[0] ?? { totalReturnValue: 0, returnCount: 0 };
        const stock = stockResult[0] ?? {
            totalPhysical: 0,
            totalTheoretical: 0,
            outOfStockCount: 0,
        };
        const plan = planAttainmentResult[0] ?? { avgAttainment: 0 };

        const netRevenue = rev.totalRevenue - ret.totalReturnValue;
        const aov = rev.orderCount > 0 ? netRevenue / rev.orderCount : 0;
        const discountRate =
            rev.totalSubTotal > 0 ? (rev.totalDiscount / rev.totalSubTotal) * 100 : 0;
        const returnRate = rev.orderCount > 0 ? (ret.returnCount / rev.orderCount) * 100 : 0;

        const funnelMap = Object.fromEntries(orderFunnel.map((f) => [f._id, f.count]));
        const catalogMap = Object.fromEntries(productsByStatus.map((p) => [p._id, p.count]));

        res.status(200).json(
            response("Executive summary retrieved successfully", {
                revenue: {
                    totalRevenue: rev.totalRevenue,
                    netRevenue,
                    aov,
                    totalDiscount: rev.totalDiscount,
                    discountRate,
                    orderCount: rev.orderCount,
                },
                returns: {
                    totalReturnValue: ret.totalReturnValue,
                    returnCount: ret.returnCount,
                    returnRate,
                },
                orders: {
                    byStatus: funnelMap,
                    total: Object.values(funnelMap).reduce((s, c) => s + c, 0),
                },
                stock: {
                    totalPhysical: stock.totalPhysical,
                    totalTheoretical: stock.totalTheoretical,
                    variance: stock.totalPhysical - stock.totalTheoretical,
                    outOfStockCount: stock.outOfStockCount,
                },
                production: {
                    avgPlanAttainment: plan.avgAttainment,
                },
                issues: {
                    openAndInProgress: openIssues,
                },
                products: {
                    byStatus: catalogMap,
                },
            }),
        );
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------
// Sales Dashboard  –  /api/analytics/sales
// ---------------------------------------------------------------------------

const getSalesDashboard = async (req, res, next) => {
    try {
        const { from, to, granularity = "day" } = req.query;
        const orderFinalizedFilter = buildDateFilter(from, to, "finalizedAt");
        const orderCreatedFilter = buildDateFilter(from, to, "createdAt");
        const returnFilter = buildDateFilter(from, to, "returnDate");
        const fmt = dateFormat(granularity);

        const [
            revenueTrend,
            topCustomers,
            orderFunnel,
            orderTypeSplit,
            topProducts,
            discountTrend,
            returnsByProduct,
        ] = await Promise.all([
            // Revenue, order count, and AOV per time bucket
            Order.aggregate([
                { $match: { status: ORDER_STATUS.FINALIZED, ...orderFinalizedFilter } },
                {
                    $group: {
                        _id: { $dateToString: { format: fmt, date: "$finalizedAt" } },
                        revenue: { $sum: "$total" },
                        orders: { $sum: 1 },
                        avgOrderValue: { $avg: "$total" },
                    },
                },
                { $sort: { _id: 1 } },
            ]),

            // Top 10 customers by revenue
            Order.aggregate([
                { $match: { status: ORDER_STATUS.FINALIZED, ...orderFinalizedFilter } },
                {
                    $group: {
                        _id: "$customerId",
                        revenue: { $sum: "$total" },
                        orderCount: { $sum: 1 },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "customers",
                        localField: "_id",
                        foreignField: "_id",
                        as: "customer",
                    },
                },
                { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        revenue: 1,
                        orderCount: 1,
                        customerName: "$customer.name",
                        customerCompany: "$customer.company",
                    },
                },
            ]),

            // Order counts by status for funnel visualization
            Order.aggregate([
                { $match: orderCreatedFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),

            // On-shelf vs on-demand split by count and revenue
            Order.aggregate([
                { $match: { status: ORDER_STATUS.FINALIZED, ...orderFinalizedFilter } },
                {
                    $group: {
                        _id: "$orderType",
                        count: { $sum: 1 },
                        revenue: { $sum: "$total" },
                    },
                },
            ]),

            // Top 10 products by revenue from order line items
            Order.aggregate([
                { $match: { status: ORDER_STATUS.FINALIZED, ...orderFinalizedFilter } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        unitsSold: { $sum: "$items.quantity" },
                        revenue: {
                            $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
                        },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        unitsSold: 1,
                        revenue: 1,
                        productCode: "$product.code",
                        productName: "$product.name",
                        productColor: "$product.color",
                    },
                },
            ]),

            // Discount rate per time bucket (for discount trend line)
            Order.aggregate([
                { $match: { status: ORDER_STATUS.FINALIZED, ...orderFinalizedFilter } },
                {
                    $group: {
                        _id: { $dateToString: { format: fmt, date: "$finalizedAt" } },
                        totalDiscount: { $sum: "$discountAmount" },
                        totalSubTotal: { $sum: "$subTotal" },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        totalDiscount: 1,
                        discountRate: {
                            $cond: [
                                { $eq: ["$totalSubTotal", 0] },
                                0,
                                {
                                    $multiply: [
                                        { $divide: ["$totalDiscount", "$totalSubTotal"] },
                                        100,
                                    ],
                                },
                            ],
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]),

            // Top 10 most returned products (for return rate insight)
            Return.aggregate([
                { $match: { status: RETURN_STATUS.FINALIZED, ...returnFilter } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        unitsReturned: { $sum: "$items.quantity" },
                        returnValue: {
                            $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
                        },
                    },
                },
                { $sort: { unitsReturned: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        unitsReturned: 1,
                        returnValue: 1,
                        productCode: "$product.code",
                        productName: "$product.name",
                    },
                },
            ]),
        ]);

        const totalRevenue = revenueTrend.reduce((s, d) => s + d.revenue, 0);
        const totalOrders = revenueTrend.reduce((s, d) => s + d.orders, 0);
        const funnelMap = Object.fromEntries(orderFunnel.map((f) => [f._id, f.count]));

        const totalOrdersForCancellation = Object.values(funnelMap).reduce((s, c) => s + c, 0);
        const cancellationRate =
            totalOrdersForCancellation > 0
                ? ((funnelMap[ORDER_STATUS.CANCELLED] ?? 0) / totalOrdersForCancellation) * 100
                : 0;

        res.status(200).json(
            response("Sales dashboard retrieved successfully", {
                summary: {
                    totalRevenue,
                    totalOrders,
                    aov: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                    cancellationRate,
                },
                revenueTrend,
                topCustomers,
                orderFunnel: funnelMap,
                orderTypeSplit,
                topProducts,
                discountTrend,
                returnsByProduct,
            }),
        );
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------
// Production Dashboard  –  /api/analytics/production
// ---------------------------------------------------------------------------

const getProductionDashboard = async (req, res, next) => {
    try {
        const { from, to, granularity = "month" } = req.query;
        const batchStartFilter = buildDateFilter(from, to, "startDate");
        const batchEndFilter = buildDateFilter(from, to, "endDate");
        const fmt = dateFormat(granularity);

        const [
            batchStatusCounts,
            planAttainment,
            lossByStage,
            productionTrend,
            avgBatchDuration,
            avgStageDuration,
            topLossBatches,
        ] = await Promise.all([
            // Batch counts grouped by status
            Batch.aggregate([
                { $match: batchStartFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),

            // Plan attainment statistics (done batches only)
            Batch.aggregate([
                {
                    $match: {
                        status: BATCH_STATUS.DONE,
                        producedQuantity: { $gt: 0 },
                        ...batchStartFilter,
                    },
                },
                {
                    $project: {
                        batchNumber: 1,
                        plannedQuantity: 1,
                        producedQuantity: 1,
                        attainment: {
                            $cond: [
                                { $eq: ["$plannedQuantity", 0] },
                                0,
                                {
                                    $multiply: [
                                        { $divide: ["$producedQuantity", "$plannedQuantity"] },
                                        100,
                                    ],
                                },
                            ],
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgAttainment: { $avg: "$attainment" },
                        minAttainment: { $min: "$attainment" },
                        maxAttainment: { $max: "$attainment" },
                        totalPlanned: { $sum: "$plannedQuantity" },
                        totalProduced: { $sum: "$producedQuantity" },
                        batchCount: { $sum: 1 },
                    },
                },
            ]),

            // Total loss and event count per batch event stage
            BatchEvent.aggregate([
                {
                    $group: {
                        _id: "$stage",
                        totalLoss: { $sum: "$loss" },
                        eventCount: { $sum: 1 },
                        avgLoss: { $avg: "$loss" },
                    },
                },
                { $sort: { totalLoss: -1 } },
            ]),

            // Units produced and batch count per time bucket (done batches)
            Batch.aggregate([
                {
                    $match: {
                        status: BATCH_STATUS.DONE,
                        endDate: { $exists: true },
                        ...batchEndFilter,
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: fmt, date: "$endDate" } },
                        unitsProduced: { $sum: "$producedQuantity" },
                        batchCount: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),

            // Average, min, and max batch duration for completed batches
            Batch.aggregate([
                { $match: { status: BATCH_STATUS.DONE, endDate: { $exists: true } } },
                {
                    $project: {
                        durationMs: { $subtract: ["$endDate", "$startDate"] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgDurationMs: { $avg: "$durationMs" },
                        minDurationMs: { $min: "$durationMs" },
                        maxDurationMs: { $max: "$durationMs" },
                    },
                },
            ]),

            // Average duration per batch event stage
            BatchEvent.aggregate([
                { $match: { endDate: { $exists: true } } },
                {
                    $project: {
                        stage: 1,
                        durationMs: { $subtract: ["$endDate", "$startDate"] },
                    },
                },
                {
                    $group: {
                        _id: "$stage",
                        avgDurationMs: { $avg: "$durationMs" },
                    },
                },
                {
                    $project: {
                        avgDurationHours: { $divide: ["$avgDurationMs", 3_600_000] },
                    },
                },
            ]),

            // Top 10 batches with the highest cumulative loss
            BatchEvent.aggregate([
                {
                    $group: {
                        _id: "$batchId",
                        totalLoss: { $sum: "$loss" },
                        stageCount: { $sum: 1 },
                    },
                },
                { $sort: { totalLoss: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "batches",
                        localField: "_id",
                        foreignField: "_id",
                        as: "batch",
                    },
                },
                { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        totalLoss: 1,
                        stageCount: 1,
                        batchNumber: "$batch.batchNumber",
                        plannedQuantity: "$batch.plannedQuantity",
                        producedQuantity: "$batch.producedQuantity",
                        batchStatus: "$batch.status",
                    },
                },
            ]),
        ]);

        const pa = planAttainment[0] ?? {
            avgAttainment: 0,
            minAttainment: 0,
            maxAttainment: 0,
            totalPlanned: 0,
            totalProduced: 0,
            batchCount: 0,
        };
        const bd = avgBatchDuration[0] ?? {
            avgDurationMs: 0,
            minDurationMs: 0,
            maxDurationMs: 0,
        };
        const batchStatusMap = Object.fromEntries(batchStatusCounts.map((b) => [b._id, b.count]));

        res.status(200).json(
            response("Production dashboard retrieved successfully", {
                summary: {
                    batchesByStatus: batchStatusMap,
                    planAttainment: {
                        avg: pa.avgAttainment,
                        min: pa.minAttainment,
                        max: pa.maxAttainment,
                    },
                    totalPlanned: pa.totalPlanned,
                    totalProduced: pa.totalProduced,
                    totalLoss: lossByStage.reduce((s, l) => s + l.totalLoss, 0),
                    avgBatchDurationHours: msToHours(bd.avgDurationMs),
                    minBatchDurationHours: msToHours(bd.minDurationMs),
                    maxBatchDurationHours: msToHours(bd.maxDurationMs),
                },
                productionTrend,
                lossByStage,
                avgStageDuration,
                topLossBatches,
            }),
        );
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------
// Inventory Dashboard  –  /api/analytics/inventory
// ---------------------------------------------------------------------------

const LOW_STOCK_THRESHOLD = 50;

const getInventoryDashboard = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const movementFilter = buildDateFilter(from, to, "createdAt");

        const [
            stockByLocation,
            globalStockSummary,
            movementBreakdown,
            mostMovedProducts,
            productsByColor,
            productsBySeason,
            stockVarianceProducts,
        ] = await Promise.all([
            // Stock quantity aggregated per factory location
            Product.aggregate([
                { $match: { status: PRODUCT_STATUS.ACTIVE } },
                { $unwind: "$locations" },
                {
                    $group: {
                        _id: "$locations.location",
                        totalStock: { $sum: "$locations.quantityInStock" },
                        productCount: { $sum: 1 },
                    },
                },
                { $sort: { totalStock: -1 } },
            ]),

            // Global stock totals and alert counts
            Product.aggregate([
                { $match: { status: PRODUCT_STATUS.ACTIVE } },
                {
                    $group: {
                        _id: null,
                        totalPhysical: { $sum: "$totalPhysicalStock" },
                        totalTheoretical: { $sum: "$totalTheoreticalStock" },
                        totalReserved: { $sum: "$totalReserved" },
                        totalSold: { $sum: "$totalSold" },
                        outOfStockCount: {
                            $sum: { $cond: [{ $eq: ["$totalPhysicalStock", 0] }, 1, 0] },
                        },
                        lowStockCount: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gt: ["$totalPhysicalStock", 0] },
                                            { $lt: ["$totalPhysicalStock", LOW_STOCK_THRESHOLD] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),

            // Stock movement volume and quantity per movement type
            StockMovement.aggregate([
                { $match: movementFilter },
                {
                    $group: {
                        _id: "$movementType",
                        count: { $sum: 1 },
                        netQuantity: { $sum: "$quantityChange" },
                        absoluteQuantity: { $sum: { $abs: "$quantityChange" } },
                    },
                },
                { $sort: { count: -1 } },
            ]),

            // Top 10 most frequently moved products
            StockMovement.aggregate([
                { $match: movementFilter },
                {
                    $group: {
                        _id: "$productId",
                        movementCount: { $sum: 1 },
                        absoluteQuantity: { $sum: { $abs: "$quantityChange" } },
                    },
                },
                { $sort: { movementCount: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        movementCount: 1,
                        absoluteQuantity: 1,
                        productCode: "$product.code",
                        productName: "$product.name",
                        currentStock: "$product.totalPhysicalStock",
                    },
                },
            ]),

            // Total units sold and current stock grouped by product color
            Product.aggregate([
                { $match: { status: PRODUCT_STATUS.ACTIVE } },
                {
                    $group: {
                        _id: "$color",
                        totalSold: { $sum: "$totalSold" },
                        totalStock: { $sum: "$totalPhysicalStock" },
                        productCount: { $sum: 1 },
                    },
                },
                { $sort: { totalSold: -1 } },
            ]),

            // Total units sold and current stock grouped by season
            Product.aggregate([
                { $match: { status: PRODUCT_STATUS.ACTIVE } },
                {
                    $group: {
                        _id: "$season",
                        totalSold: { $sum: "$totalSold" },
                        totalStock: { $sum: "$totalPhysicalStock" },
                        productCount: { $sum: 1 },
                    },
                },
                { $sort: { totalSold: -1 } },
            ]),

            // Products whose physical and theoretical stock do not match
            Product.aggregate([
                { $match: { status: PRODUCT_STATUS.ACTIVE } },
                {
                    $project: {
                        code: 1,
                        name: 1,
                        totalPhysicalStock: 1,
                        totalTheoreticalStock: 1,
                        variance: {
                            $subtract: ["$totalPhysicalStock", "$totalTheoreticalStock"],
                        },
                    },
                },
                { $match: { variance: { $ne: 0 } } },
                { $sort: { variance: 1 } },
                { $limit: 20 },
            ]),
        ]);

        const summary = globalStockSummary[0] ?? {
            totalPhysical: 0,
            totalTheoretical: 0,
            totalReserved: 0,
            totalSold: 0,
            outOfStockCount: 0,
            lowStockCount: 0,
        };

        res.status(200).json(
            response("Inventory dashboard retrieved successfully", {
                summary: {
                    totalPhysical: summary.totalPhysical,
                    totalTheoretical: summary.totalTheoretical,
                    variance: summary.totalPhysical - summary.totalTheoretical,
                    totalReserved: summary.totalReserved,
                    totalSold: summary.totalSold,
                    outOfStockCount: summary.outOfStockCount,
                    lowStockCount: summary.lowStockCount,
                    lowStockThreshold: LOW_STOCK_THRESHOLD,
                },
                stockByLocation,
                movementBreakdown,
                mostMovedProducts,
                productsByColor,
                productsBySeason,
                stockVarianceProducts,
            }),
        );
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------
// Operations Dashboard  –  /api/analytics/operations
// ---------------------------------------------------------------------------

const getOperationsDashboard = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const issueFilter = buildDateFilter(from, to, "createdAt");
        const movementFilter = buildDateFilter(from, to, "createdAt");

        const [
            issuesByType,
            issuesByStatus,
            avgResolutionTime,
            manualAdjustmentTrend,
            topIssueReporters,
            topIssueResolvers,
            issueAgeTrend,
        ] = await Promise.all([
            // Issue count grouped by type
            Issue.aggregate([
                { $match: issueFilter },
                { $group: { _id: "$issueType", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),

            // Issue count grouped by status
            Issue.aggregate([
                { $match: issueFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),

            // Average resolution time in hours, broken down by issue type
            Issue.aggregate([
                {
                    $match: {
                        status: ISSUE_STATUS.RESOLVED,
                        resolvedAt: { $exists: true },
                        ...issueFilter,
                    },
                },
                {
                    $project: {
                        issueType: 1,
                        resolutionMs: { $subtract: ["$resolvedAt", "$createdAt"] },
                    },
                },
                {
                    $group: {
                        _id: "$issueType",
                        avgResolutionHours: {
                            $avg: { $divide: ["$resolutionMs", 3_600_000] },
                        },
                        resolvedCount: { $sum: 1 },
                    },
                },
                { $sort: { avgResolutionHours: -1 } },
            ]),

            // Daily manual stock adjustment frequency (high volumes signal operational problems)
            StockMovement.aggregate([
                {
                    $match: {
                        movementType: "manual_adjustment",
                        ...movementFilter,
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                        totalQuantityAdjusted: { $sum: { $abs: "$quantityChange" } },
                    },
                },
                { $sort: { _id: 1 } },
            ]),

            // Top 10 users by number of issues reported
            Issue.aggregate([
                { $match: issueFilter },
                { $group: { _id: "$createdByUserId", reported: { $sum: 1 } } },
                { $sort: { reported: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        reported: 1,
                        userName: "$user.name",
                        userRoles: "$user.roles",
                    },
                },
            ]),

            // Top 10 users by number of issues resolved
            Issue.aggregate([
                {
                    $match: {
                        status: ISSUE_STATUS.RESOLVED,
                        resolvedByUserId: { $exists: true },
                        ...issueFilter,
                    },
                },
                { $group: { _id: "$resolvedByUserId", resolved: { $sum: 1 } } },
                { $sort: { resolved: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        resolved: 1,
                        userName: "$user.name",
                        userRoles: "$user.roles",
                    },
                },
            ]),

            // Monthly issue creation vs resolution trend
            Issue.aggregate([
                { $match: issueFilter },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        created: { $sum: 1 },
                        resolved: {
                            $sum: {
                                $cond: [{ $eq: ["$status", ISSUE_STATUS.RESOLVED] }, 1, 0],
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const statusMap = Object.fromEntries(issuesByStatus.map((s) => [s._id, s.count]));
        const totalIssues = Object.values(statusMap).reduce((s, c) => s + c, 0);

        const resolutionRate =
            totalIssues > 0 ? ((statusMap[ISSUE_STATUS.RESOLVED] ?? 0) / totalIssues) * 100 : 0;

        res.status(200).json(
            response("Operations dashboard retrieved successfully", {
                summary: {
                    totalIssues,
                    issuesByStatus: statusMap,
                    openAndInProgress:
                        (statusMap[ISSUE_STATUS.OPEN] ?? 0) +
                        (statusMap[ISSUE_STATUS.IN_PROGRESS] ?? 0),
                    resolutionRate,
                },
                issuesByType,
                avgResolutionTime,
                manualAdjustmentTrend,
                topIssueReporters,
                topIssueResolvers,
                issueAgeTrend,
            }),
        );
    } catch (err) {
        return next(err);
    }
};

// ---------------------------------------------------------------------------

const analyticsController = {
    getExecutiveSummary,
    getSalesDashboard,
    getProductionDashboard,
    getInventoryDashboard,
    getOperationsDashboard,
};

module.exports = analyticsController;
