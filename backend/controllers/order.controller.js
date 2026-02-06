const Order = require("../models/order.model");
const Inventory = require("../models/inventory.model");
const Product = require("../models/product.model");

const { ORDER_TYPE, ORDER_STATUS } = require("../enums/order.enums");
const { PRODUCT_STATUS } = require("../enums/product.enums");
const { COUNTERS } = require("../enums/counter.enums");

const createError = require("../utils/errorFactory");
const { getNextDocumentNumber, isPositiveNumber } = require("../utils/helpers");

const orderController = {
    // function to create a new order
    createOrder: async (req, res, next) => {
        const session = await Order.startSession();

        try {
            const userId = req.user.id;

            const {
                customerId,
                orderType,
                items,
                discountAmount = 0,
                taxAmount = 0,
                notes,
            } = req.body;

            // request validation
            if (!customerId) return next(createError("customerId is required", 400));
            if (!orderType) return next(createError("orderType is required", 400));

            if (![ORDER_TYPE.ON_SHELF, ORDER_TYPE.ON_DEMAND].includes(orderType)) {
                return next(createError("Invalid orderType", 400));
            }

            if (!Array.isArray(items) || items.length === 0) {
                return next(createError("items must be a non-empty array", 400));
            }

            if (!isPositiveNumber(discountAmount)) {
                return next(createError("discountAmount must be >= 0", 400));
            }
            if (!isPositiveNumber(taxAmount)) {
                return next(createError("taxAmount must be >= 0", 400));
            }

            // validate each item
            for (const [idx, it] of items.entries()) {
                if (!it?.productId)
                    return next(createError(`items[${idx}].productId is required`, 400));
                if (!isPositiveNumber(it.quantity) || it.quantity === 0) {
                    return next(createError(`items[${idx}].quantity must be > 0`, 400));
                }
            }

            // transactional part
            let createdOrder;
            await session.withTransaction(async () => {
                const productIds = items.map((it) => it.productId);

                // fetch products once
                const products = await Product.find(
                    { _id: { $in: productIds } },
                    { _id: 1, status: 1, salePrice: 1 }, // keep it light
                ).session(session);

                const productMap = new Map(products.map((p) => [String(p._id), p]));

                // validate products exist and activated + build pricedItems (snapshot)
                const pricedItems = items.map((it) => {
                    const product = productMap.get(String(it.productId));
                    if (!product) {
                        throw createError(`Product ${it.productId} not found`, 404);
                    }

                    if (product.status !== PRODUCT_STATUS.ACTIVE) {
                        throw createError(`Product ${it.productId} is not activated`, 409);
                    }

                    if (!isPositiveNumber(product.salePrice)) {
                        throw createError(`Product ${it.productId} has invalid sale price`, 500);
                    }

                    return {
                        productId: it.productId,
                        quantity: it.quantity,
                        unitPrice: product.salePrice, // snapshot
                    };
                });

                // compute totals from pricedItems
                const subTotal = pricedItems.reduce(
                    (acc, it) => acc + it.unitPrice * it.quantity,
                    0,
                );

                const total = subTotal + taxAmount - discountAmount;
                if (total < 0) {
                    throw createError("Total cannot be negative (check discount/tax)", 400);
                }

                // if ON_SHELF, check inventory stock
                if (orderType === ORDER_TYPE.ON_SHELF) {
                    const inventoryDocs = await Inventory.find({
                        productId: { $in: productIds },
                    }).session(session);

                    const invMap = new Map(
                        inventoryDocs.map((inv) => [String(inv.productId), inv]),
                    );

                    for (const it of pricedItems) {
                        const inv = invMap.get(String(it.productId));
                        if (!inv) {
                            throw createError(
                                `Inventory not found for product ${it.productId}`,
                                404,
                            );
                        }
                        if (inv.totalInStock < it.quantity) {
                            throw createError(`Product ${it.productId} is out of stock`, 409);
                        }
                    }

                    // reserve stock (still needs to be made)
                }

                // generate order number atomically
                const orderNumber = await getNextDocumentNumber(COUNTERS.ORDER_NUMBER, session);

                // create order
                const created = await Order.create(
                    [
                        {
                            orderNumber,
                            createdByUserId: userId,
                            customerId,
                            orderType,
                            items: pricedItems,
                            subTotal,
                            discountAmount,
                            taxAmount,
                            total,
                            notes,
                        },
                    ],
                    { session },
                );

                // attach created order to outer scope (first doc)
                createdOrder = created[0];
            });

            return res.status(201).json({
                success: true,
                message: "Order created successfully",
                order: createdOrder,
            });
        } catch (err) {
            return next(createError(err.message, 500));
        } finally {
            session.endSession();
        }
    },

    // function to get orders (filtered)
    getOrders: async (req, res, next) => {
        try {
            const {
                createdByUserId,
                customerId,
                orderType,
                status,
                from, // date filter
                to, // date filter
                q, // search by order number
            } = req.query;

            // build the filter object
            const filter = {};
            if (createdByUserId) filter.createdByUserId = createdByUserId;
            if (customerId) filter.customerId = customerId;
            if (orderType) filter.orderType = orderType;
            if (status) filter.status = status;

            // date range
            if (from || to) {
                filter.createdAt = {};
                if (from) filter.createdAt.$gte = new Date(from);
                if (to) filter.createdAt.$lte = new Date(to);
            }

            // search query
            if (q) {
                const num = Number(q);
                if (!Number.isNaN(num)) filter.orderNumber = num;
            }

            // get filtered orders
            const orders = await Order.find(filter).sort("-createdAt");

            res.status(200).json({
                success: true,
                messgae: "Orders retrieved successfully",
                data: orders,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // function to get the orders made by the current user
    getUserOrders: async (req, res, next) => {
        try {
            const userId = req.user.id;

            const orders = await Order.find({ createdByUserId: userId }).sort("-createdAt");

            res.status(200).json({
                success: true,
                message: "Order retrieved successfully",
                data: orders,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // function to get a specific order
    getOrder: async (req, res, next) => {
        try {
            const orderId = req.params.orderId;

            // get order
            const order = await Order.findById(orderId);
            if (!order) {
                return next(createError("Order not found", 404));
            }

            res.status(200).json({
                success: true,
                message: "Order retrieved successfully",
                data: order,
            });
        } catch (err) {
            next(createError(err.message, 500));
        }
    },

    // function to delete an order
    deleteOrder: async (req, res, next) => {
        try {
            const orderId = req.params.orderId;

            // validate the order
            const order = await Order.findById(orderId);
            if (!order) {
                return next(createError("Order not found", 404));
            }
            if (order.status === ORDER_STATUS.FINALIZED) {
                return next(createError("Cannot delete a finalized order", 409));
            }

            const deletedOrder = await Order.findByIdAndDelete(orderId);
            // return reserved products to stock
            if (deletedOrder.status === ORDER_STATUS.DRAFT) {
            }

            res.status(200).json({
                success: true,
                message: "Order deleted successflly",
                data: deletedOrder,
            });
        } catch (err) {}
    },
};

module.exports = orderController;
