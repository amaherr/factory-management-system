const response = require("../../utils/responseFactory");

const analyticsRepository = require("./analytics.repository");

const { ORDER_STATUS } = require("../../enums/order.enums");
const { ISSUE_STATUS } = require("../../enums/issue.enums");

const LOW_STOCK_THRESHOLD = 50;

const parseSafeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

const buildDateFilter = (from, to, field = "createdAt") => {
    const fromDate = parseSafeDate(from);
    const toDate = parseSafeDate(to);
    if (!fromDate && !toDate) return {};

    const range = {};
    if (fromDate) range.$gte = fromDate;
    if (toDate) range.$lte = toDate;

    return { [field]: range };
};

const msToHours = (ms) => parseFloat((ms / 3_600_000).toFixed(1));

const dateFormat = (granularity) => {
    if (granularity === "month") return "%Y-%m";
    if (granularity === "week") return "%Y-%U";
    return "%Y-%m-%d";
};

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
        ] = await analyticsRepository.getExecutiveSummaryData({
            orderFilter,
            returnFilter,
            orderCreatedFilter,
        });

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
        ] = await analyticsRepository.getSalesDashboardData({
            orderFinalizedFilter,
            orderCreatedFilter,
            returnFilter,
            fmt,
        });

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

const getProductionDashboard = async (req, res, next) => {
    try {
        const { from, to, granularity = "month" } = req.query;
        const batchStartFilter = buildDateFilter(from, to, "startDate");
        const batchEndFilter = buildDateFilter(from, to, "endDate");
        const batchEventFilter = buildDateFilter(from, to, "startDate");
        const fmt = dateFormat(granularity);

        const [
            batchStatusCounts,
            planAttainment,
            lossByStage,
            productionTrend,
            avgBatchDuration,
            avgStageDuration,
            topLossBatches,
        ] = await analyticsRepository.getProductionDashboardData({
            batchStartFilter,
            batchEndFilter,
            batchEventFilter,
            fmt,
        });

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
        ] = await analyticsRepository.getInventoryDashboardData({
            movementFilter,
            lowStockThreshold: LOW_STOCK_THRESHOLD,
        });

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
        ] = await analyticsRepository.getOperationsDashboardData({
            issueFilter,
            movementFilter,
        });

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

module.exports = {
    getExecutiveSummary,
    getSalesDashboard,
    getProductionDashboard,
    getInventoryDashboard,
    getOperationsDashboard,
};
