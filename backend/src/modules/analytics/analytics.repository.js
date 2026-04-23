const Order = require("../orders/order.model");
const Return = require("../returns/return.model");
const Product = require("../products/product.model");
const Batch = require("../batches/batch.model");
const BatchEvent = require("../batches/batchEvent.model");
const StockMovement = require("../stockMovements/stockMovement.model");
const Issue = require("../issues/issue.model");

const { ORDER_STATUS } = require("../../enums/order.enums");
const { RETURN_STATUS } = require("../../enums/return.enums");
const { PRODUCT_STATUS } = require("../../enums/product.enums");
const { BATCH_STATUS } = require("../../enums/batch.enums");
const { ISSUE_STATUS } = require("../../enums/issue.enums");

const getExecutiveSummaryData = ({ orderFilter, returnFilter, orderCreatedFilter }) => {
    return Promise.all([
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
        Return.aggregate([
            { $match: { status: RETURN_STATUS.FINALIZED, ...returnFilter } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    totalReturnValue: { $sum: "$items.totalPrice" },
                    returnCount: { $sum: 1 },
                },
            },
        ]),
        Order.aggregate([
            { $match: orderCreatedFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
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
        Issue.countDocuments({
            status: { $in: [ISSUE_STATUS.OPEN, ISSUE_STATUS.IN_PROGRESS] },
        }),
        Product.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
};

const getSalesDashboardData = ({ orderFinalizedFilter, orderCreatedFilter, returnFilter, fmt }) => {
    return Promise.all([
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
        Order.aggregate([
            { $match: orderCreatedFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Order.aggregate([
            { $match: { status: ORDER_STATUS.FINALIZED, ...orderFinalizedFilter } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.itemType",
                    count: { $sum: 1 },
                    revenue: { $sum: "$items.totalPrice" },
                },
            },
        ]),
        Order.aggregate([
            { $match: { status: ORDER_STATUS.FINALIZED, ...orderFinalizedFilter } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    unitsSold: { $sum: "$items.actualQuantity" },
                    revenue: { $sum: "$items.totalPrice" },
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
                                $multiply: [{ $divide: ["$totalDiscount", "$totalSubTotal"] }, 100],
                            },
                        ],
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Return.aggregate([
            { $match: { status: RETURN_STATUS.FINALIZED, ...returnFilter } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    unitsReturned: { $sum: "$items.actualQuantity" },
                    returnValue: { $sum: "$items.totalPrice" },
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
};

const getProductionDashboardData = ({
    batchStartFilter,
    batchEndFilter,
    batchEventFilter,
    fmt,
}) => {
    return Promise.all([
        Batch.aggregate([
            { $match: batchStartFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
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
        BatchEvent.aggregate([
            { $match: batchEventFilter },
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
        Batch.aggregate([
            {
                $match: {
                    status: BATCH_STATUS.DONE,
                    endDate: { $exists: true },
                    ...batchEndFilter,
                },
            },
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
        BatchEvent.aggregate([
            { $match: { endDate: { $exists: true }, ...batchEventFilter } },
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
        BatchEvent.aggregate([
            { $match: batchEventFilter },
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
};

const getInventoryDashboardData = ({ movementFilter, lowStockThreshold }) => {
    return Promise.all([
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
                                        { $lt: ["$totalPhysicalStock", lowStockThreshold] },
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
        StockMovement.aggregate([
            { $match: movementFilter },
            {
                $group: {
                    _id: {
                        from: "$from",
                        to: "$to",
                    },
                    count: { $sum: 1 },
                    netQuantity: { $sum: "$quantityChange" },
                    absoluteQuantity: { $sum: { $abs: "$quantityChange" } },
                },
            },
            {
                $project: {
                    _id: 0,
                    from: "$_id.from",
                    to: "$_id.to",
                    count: 1,
                    netQuantity: 1,
                    absoluteQuantity: 1,
                },
            },
            { $sort: { count: -1 } },
        ]),
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
};

const getOperationsDashboardData = ({ issueFilter, movementFilter }) => {
    return Promise.all([
        Issue.aggregate([
            { $match: issueFilter },
            { $group: { _id: "$issueType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Issue.aggregate([
            { $match: issueFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
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
        StockMovement.aggregate([
            {
                $match: {
                    $or: [{ from: "manual_adjustment" }, { to: "manual_adjustment" }],
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
};

module.exports = {
    getExecutiveSummaryData,
    getSalesDashboardData,
    getProductionDashboardData,
    getInventoryDashboardData,
    getOperationsDashboardData,
};
