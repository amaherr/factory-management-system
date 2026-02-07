const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Product = require("../models/product.model");

const { ORDER_TYPE, ORDER_STATUS } = require("../enums/order.enums");
const { PRODUCT_STATUS } = require("../enums/product.enums");
const { COUNTERS } = require("../enums/counter.enums");
const { STOCK_MOVEMENT_TYPE } = require("../enums/stockMovement.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");
const { getNextDocumentNumber, createStockMovement } = require("../utils/helpers");

const orderController = {
    // function to create a new order
    createOrder: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const { customerId, orderType, items, discountAmount, taxAmount, notes } = req.body;

            // transactional part
            const { createdOrder, stockMovements } = await session.withTransaction(async () => {
                // generate order number atomically
                const orderNumber = await getNextDocumentNumber(COUNTERS.ORDER_NUMBER, session);

                // fetch products once
                const productIds = items.map((item) => item.productId);
                const products = await Product.find(
                    { _id: { $in: productIds } },
                    {
                        _id: 1,
                        status: 1,
                        salePrice: 1,
                        totalTheoreticalStock: 1,
                        totalReserved: 1,
                        locations: 1,
                    },
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

                    return {
                        productId: it.productId,
                        quantity: it.quantity,
                        unitPrice: product.salePrice, // snapshot
                    };
                });

                // compute totals from pricedItems
                const subTotal = pricedItems.reduce(
                    (acc, item) => acc + item.unitPrice * item.quantity,
                    0,
                );

                const total = subTotal + taxAmount - discountAmount;
                if (total < 0) {
                    throw createError("Total cannot be negative (check discount/tax)", 400);
                }

                // if ON_SHELF, check inventory stock and reserve stock
                let stockMovements = [];
                if (orderType === ORDER_TYPE.ON_SHELF) {
                    for (const item of pricedItems) {
                        // check if item is out of stock (reserve and decrement from stock if not)
                        // atomic check + reserve (prevents race conditions)
                        const r = await Product.updateOne(
                            {
                                _id: item.productId,
                                totalTheoreticalStock: { $gte: item.quantity },
                                status: PRODUCT_STATUS.ACTIVE,
                            },
                            {
                                $inc: {
                                    totalTheoreticalStock: -item.quantity,
                                    totalReserved: +item.quantity,
                                },
                            },
                            { session },
                        );

                        if (r.modifiedCount !== 1) {
                            throw createError(`Product ${item.productId} is out of stock`, 409);
                        }

                        // create stock movement for the item
                        const stockMovement = await createStockMovement(
                            {
                                productId: item.productId,
                                quantityChange: item.quantity,
                                movementType: STOCK_MOVEMENT_TYPE.RESERVE,
                                notes: `Reserve from order ${orderNumber} - ${notes || ""}`,
                                userId,
                            },
                            session,
                        );
                        stockMovements.push(stockMovement);
                    }
                }

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

                return { createdOrder: created[0], stockMovements };
            });

            return res
                .status(201)
                .json(response("Order created successfully", { createdOrder, stockMovements }));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
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
            const orders = await Order.find(filter).sort({ createdAt: -1 });

            res.status(200).json(response("Orders retrieved successfully", orders));
        } catch (err) {
            return next(err);
        }
    },

    // function to get the orders made by the current user
    getUserOrders: async (req, res, next) => {
        try {
            const userId = req.user.id;

            const {
                customerId,
                orderType,
                status,
                q, // search by order number
            } = req.query;

            // build the filter object
            const filter = {};
            if (customerId) filter.customerId = customerId;
            if (orderType) filter.orderType = orderType;
            if (status) filter.status = status;

            // search query
            if (q) {
                const num = Number(q);
                if (!Number.isNaN(num)) filter.orderNumber = num;
            }

            const orders = await Order.find({ ...filter, createdByUserId: userId }).sort(
                "-createdAt",
            );

            res.status(200).json(response("Order retrieved successfully", orders));
        } catch (err) {
            return next(err);
        }
    },

    // function to get a specific order
    getOrder: async (req, res, next) => {
        try {
            const orderId = req.params.orderId;

            // get order
            const order = await Order.findById(orderId).populate(
                "createdByUserId customerId finalizedByUserId cancelledByUserId",
            );
            if (!order) {
                return next(createError("Order not found", 404));
            }

            res.status(200).json(reponse("Order retrieved successfully", order));
        } catch (err) {
            return next(err);
        }
    },

    // function to delete an order
    deleteOrder: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const orderId = req.params.orderId;

            const { deletedOrder, stockMovements } = await session.withTransaction(async () => {
                // validate the order
                const order = await Order.findById(orderId).session(session);
                if (!order) {
                    throw createError("Order not found", 404);
                }
                if (order.status === ORDER_STATUS.FINALIZED) {
                    throw createError("Cannot delete a finalized order", 409);
                }

                const deletedOrder = await Order.findByIdAndDelete(orderId).session(session);

                // return reserved products to stock
                let stockMovements = [];
                if (
                    deletedOrder.orderType === ORDER_TYPE.ON_SHELF &&
                    deletedOrder.status === ORDER_STATUS.DRAFT
                ) {
                    // return product amount to stock
                    for (const item of deletedOrder.items) {
                        // add reserved to stock
                        const r = await Product.updateOne(
                            {
                                _id: item.productId,
                                totalReserved: { $gte: item.quantity },
                            },
                            {
                                $inc: {
                                    totalTheoreticalStock: +item.quantity,
                                    totalReserved: -item.quantity,
                                },
                            },
                            { session },
                        );

                        if (r.modifiedCount !== 1) {
                            // This indicates your reserved totals are out of sync.
                            throw createError(
                                `Cannot unreserve product ${item.productId} (reserved stock mismatch)`,
                                409,
                            );
                        }

                        // create stock movement
                        const stockMovement = await createStockMovement(
                            {
                                productId: item.productId,
                                quantityChange: item.quantity,
                                movementType: STOCK_MOVEMENT_TYPE.UNRESERVE,
                                notes: `Order ${deletedOrder.orderNumber} deleted (unreserve)`,
                                userId,
                            },
                            session,
                        );
                        stockMovements.push(stockMovement);
                    }
                }
                return { deletedOrder, stockMovements };
            });

            res.status(200).json(
                response("Order deleted successflly", { deletedOrder, stockMovements }),
            );
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },
};

module.exports = orderController;
