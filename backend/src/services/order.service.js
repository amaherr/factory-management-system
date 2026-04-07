/* Invariants:
   - ON_SHELF draft reserves stock (theoretical--, reserved++)
   - ON_SHELF finalize: reserved--, sold++
   - ON_SHELF cancel/delete draft: reserved--, theoretical++
   - ON_DEMAND stock doesn't change
*/

const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Product = require("../models/product.model");
const StockMovement = require("../models/stockMovement.model");

const { ORDER_TYPE, ORDER_STATUS } = require("../enums/order.enums");
const { PRODUCT_STATUS } = require("../enums/product.enums");
const { COUNTERS } = require("../enums/counter.enums");
const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../enums/stockMovement.enums");

const response = require("../utils/responseFactory");
const createError = require("../utils/errorFactory");
const { getNextDocumentNumber, createStockMovement } = require("../utils/helpers");

const orderService = {
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
                        sku: 1,
                        unitSalePrice: 1,
                        totalTheoreticalStock: 1,
                        totalReserved: 1,
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

                    const lineQuantity = Number(it.quantity);
                    const actualQuantity = lineQuantity * Number(product.sku);
                    const unitPrice = product.unitSalePrice;
                    const totalPrice = actualQuantity * unitPrice;

                    return {
                        productId: it.productId,
                        lineQuantity,
                        actualQuantity,
                        unitPrice, // snapshot
                        totalPrice,
                    };
                });

                // compute totals from pricedItems
                const subTotal = pricedItems.reduce((acc, item) => acc + item.totalPrice, 0);

                // normalize values
                const discount = Number(discountAmount || 0);
                const tax = Number(taxAmount || 0);

                const total = subTotal + tax - discount;
                if (total < 0) {
                    throw createError("Total cannot be negative (check discount/tax)", 400);
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
                            discountAmount: discount,
                            taxAmount: tax,
                            total,
                            notes,
                        },
                    ],
                    { session },
                );

                // if ON_SHELF, check inventory stock and reserve stock
                let stockMovements = [];
                if (orderType === ORDER_TYPE.ON_SHELF) {
                    for (const item of pricedItems) {
                        // check if item is out of stock (reserve and decrement from stock if not)
                        const r = await Product.updateOne(
                            {
                                _id: item.productId,
                                totalTheoreticalStock: { $gte: item.actualQuantity },
                                status: PRODUCT_STATUS.ACTIVE,
                            },
                            {
                                $inc: {
                                    totalTheoreticalStock: -item.actualQuantity,
                                    totalReserved: +item.actualQuantity,
                                },
                            },
                            { session },
                        );

                        if (r.modifiedCount !== 1) {
                            throw createError(`Product ${item.productId} is out of stock`, 409);
                        }

                        // create stock movement for the item
                        const sm = await createStockMovement(
                            {
                                productId: item.productId,
                                quantityChange: item.actualQuantity,
                                from: STOCK_MOVEMENT_TYPE.INVENTORY,
                                to: STOCK_MOVEMENT_TYPE.RESERVE,
                                createdByUserId: userId,
                                notes: `Reserve from order ${orderNumber} - ${notes || ""}`,
                                orderId: created[0]._id,
                                isExecuted: true,
                            },
                            session,
                        );
                        stockMovements.push(sm);
                    }
                }

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

            // get filtered orders with populated fields
            const orders = await Order.find(filter)
                .populate("customerId")
                .populate("items.productId", "name productCode")
                .sort({ createdAt: -1 });

            res.status(200).json(
                response("Orders retrieved successfully", { count: orders.length, orders }),
            );
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

            const orders = await Order.find({ ...filter, createdByUserId: userId })
                .populate("customerId")
                .populate("items.productId", "name productCode")
                .sort("-createdAt");

            res.status(200).json(response("Order retrieved successfully", orders));
        } catch (err) {
            return next(err);
        }
    },

    // function to get a specific order
    getOrder: async (req, res, next) => {
        try {
            const orderId = req.params.orderId;

            // get order with populated fields
            const order = await Order.findById(orderId)
                .populate("createdByUserId customerId finalizedByUserId cancelledByUserId")
                .populate("items.productId", "name productCode");
            if (!order) {
                return next(createError("Order not found", 404));
            }

            res.status(200).json(response("Order retrieved successfully", order));
        } catch (err) {
            return next(err);
        }
    },

    // function to change the status of an order
    changeStatus: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const orderId = req.params.orderId;
            const userId = req.user.id;
            const { status } = req.body;

            const { updatedOrder, stockMovements } = await session.withTransaction(async () => {
                // fetch first to distinguish 404 vs 409 and to know orderType
                const order = await Order.findById(orderId).session(session);
                if (!order) throw createError("Order not found", 404);
                if (order.status !== ORDER_STATUS.DRAFT) {
                    throw createError("Only draft orders can change status", 409);
                }

                // build update payload
                const update = { status };
                const now = new Date();

                if (status === ORDER_STATUS.FINALIZED) {
                    update.finalizedAt = now;
                    update.finalizedByUserId = userId;

                    // clear cancellation metadata
                    update.cancelledAt = null;
                    update.cancelledByUserId = null;
                }

                if (status === ORDER_STATUS.CANCELLED) {
                    update.cancelledAt = now;
                    update.cancelledByUserId = userId;

                    // clear finalization metadata
                    update.finalizedAt = null;
                    update.finalizedByUserId = null;
                }

                // update order
                const updatedOrder = await Order.findOneAndUpdate(
                    { _id: orderId, status: ORDER_STATUS.DRAFT },
                    update,
                    { new: true, session },
                );

                if (!updatedOrder) {
                    throw createError("Order not found or cannot change status", 409);
                }

                const stockMovements = [];

                // only ON_SHELF has reservations in the system
                if (updatedOrder.orderType === ORDER_TYPE.ON_SHELF) {
                    // move from reserved to sold
                    if (status === ORDER_STATUS.FINALIZED) {
                        for (const item of updatedOrder.items) {
                            // check and move stock
                            const r = await Product.updateOne(
                                {
                                    _id: item.productId,
                                    totalReserved: { $gte: item.actualQuantity },
                                },
                                {
                                    $inc: {
                                        totalSold: +item.actualQuantity,
                                        totalReserved: -item.actualQuantity,
                                    },
                                },
                                { session },
                            );

                            if (r.modifiedCount !== 1) {
                                throw createError(
                                    `Cannot finalize: reserved mismatch for product ${item.productId}`,
                                    409,
                                );
                            }

                            // create stock movement
                            const sm = await createStockMovement(
                                {
                                    productId: item.productId,
                                    quantityChange: item.actualQuantity,
                                    from: STOCK_MOVEMENT_TYPE.RESERVE,
                                    to: STOCK_MOVEMENT_TYPE.SALES,
                                    createdByUserId: userId,
                                    notes: `Order ${updatedOrder.orderNumber} finalized (sold)`,
                                    orderId: updatedOrder._id,
                                    warehouseAction: WAREHOUSE_ACTIONS.PICK,
                                },
                                session,
                            );
                            stockMovements.push(sm);
                        }
                    }

                    // move from reserved to theoretical stock
                    if (status === ORDER_STATUS.CANCELLED) {
                        for (const item of updatedOrder.items) {
                            // check and move stock
                            const r = await Product.updateOne(
                                {
                                    _id: item.productId,
                                    totalReserved: { $gte: item.actualQuantity },
                                },
                                {
                                    $inc: {
                                        totalTheoreticalStock: +item.actualQuantity,
                                        totalReserved: -item.actualQuantity,
                                    },
                                },
                                { session },
                            );

                            if (r.modifiedCount !== 1) {
                                throw createError(
                                    `Cannot cancel: reserved mismatch for product ${item.productId}`,
                                    409,
                                );
                            }

                            // create stock movement
                            const sm = await createStockMovement(
                                {
                                    productId: item.productId,
                                    quantityChange: item.actualQuantity,
                                    from: STOCK_MOVEMENT_TYPE.RESERVE,
                                    to: STOCK_MOVEMENT_TYPE.INVENTORY,
                                    createdByUserId: userId,
                                    notes: `Order ${updatedOrder.orderNumber} cancelled (unreserved)`,
                                    orderId: updatedOrder._id,
                                    isExecuted: true,
                                },
                                session,
                            );
                            stockMovements.push(sm);
                        }
                    }
                }

                return { updatedOrder, stockMovements };
            });

            return res
                .status(200)
                .json(
                    response("Order status updated successfully", { updatedOrder, stockMovements }),
                );
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // function to edit the details of an order
    editOrder: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const userId = req.user.id;
            const orderId = req.params.orderId;
            const { customerId, items, discountAmount, taxAmount, notes } = req.body;

            const { updatedOrder, stockMovements } = await session.withTransaction(async () => {
                // validate the order
                const order = await Order.findById(orderId).session(session);
                if (!order) {
                    throw createError("Order not found", 404);
                }
                if (order.status !== ORDER_STATUS.DRAFT) {
                    throw createError("Only draft orders can be edited", 409);
                }

                // prepare updated fields (fallback to existing)
                const nextCustomerId = customerId ?? order.customerId;
                const nextDiscountAmount =
                    discountAmount !== undefined
                        ? Number(discountAmount)
                        : Number(order.discountAmount);
                const nextTaxAmount =
                    taxAmount !== undefined ? Number(taxAmount) : Number(order.taxAmount);
                const nextNotes = notes !== undefined ? notes : order.notes;
                const nextRawItems =
                    items ??
                    order.items.map((it) => ({
                        productId: it.productId,
                        quantity: it.quantity,
                    }));

                // helper to compare old vs new (by productId and quantity)
                const toQtyMap = (arr) => {
                    const m = new Map();
                    for (const it of arr) m.set(String(it.productId), Number(it.quantity));
                    return m;
                };

                // create hash maps for each items
                const oldQtyMap = toQtyMap(order.items);
                const newQtyMap = toQtyMap(nextRawItems);

                // check if the items changed
                const itemsProvided = items !== undefined;
                const itemsChanged = (() => {
                    if (!itemsProvided) return false;
                    if (oldQtyMap.size !== newQtyMap.size) return true;
                    for (const [pid, qty] of newQtyMap) {
                        if (oldQtyMap.get(pid) !== qty) return true;
                    }
                    return false;
                })();

                // here we rebuild items snapshot if itemsProvided; otherwise keep current pricedItems from order
                let pricedItems = order.items;
                if (itemsProvided) {
                    // fetch all products
                    const productIds = nextRawItems.map((it) => it.productId);
                    const products = await Product.find(
                        { _id: { $in: productIds } },
                        {
                            _id: 1,
                            status: 1,
                            sku: 1,
                            unitSalePrice: 1,
                            totalTheoreticalStock: 1,
                            totalReserved: 1,
                        },
                    ).session(session);

                    // create new items snapshot
                    const productMap = new Map(products.map((p) => [String(p._id), p]));
                    pricedItems = nextRawItems.map((it) => {
                        const product = productMap.get(String(it.productId));
                        if (!product) throw createError(`Product ${it.productId} not found`, 404);
                        if (product.status !== PRODUCT_STATUS.ACTIVE) {
                            throw createError(`Product ${it.productId} is not activated`, 409);
                        }

                        const lineQuantity = Number(it.quantity);
                        const actualQuantity = lineQuantity * Number(product.sku);
                        const unitPrice = product.unitSalePrice;
                        const totalPrice = actualQuantity * unitPrice;

                        return {
                            productId: it.productId,
                            lineQuantity,
                            actualQuantity,
                            unitPrice, // snapshot
                            totalPrice,
                        };
                    });
                }

                // recompute totals (based on pricedItems + nextDiscountAmount/nextTaxAmount)
                const subTotal = pricedItems.reduce((acc, it) => acc + Number(it.totalPrice), 0);

                const total = subTotal + nextTaxAmount - nextDiscountAmount;
                if (total < 0) {
                    throw createError("Total cannot be negative (check discount/tax)", 400);
                }

                // stock logic + movements (ONLY for ON_SHELF and ONLY if items changed)
                const stockMovements = [];
                if (order.orderType === ORDER_TYPE.ON_SHELF && itemsChanged) {
                    // undo old reservations (unreserve everything from the old order)
                    for (const oldItem of order.items) {
                        const r = await Product.updateOne(
                            {
                                _id: oldItem.productId,
                                totalReserved: { $gte: oldItem.actualQuantity },
                            },
                            {
                                $inc: {
                                    totalTheoreticalStock: +oldItem.actualQuantity,
                                    totalReserved: -oldItem.actualQuantity,
                                },
                            },
                            { session },
                        );

                        if (r.modifiedCount !== 1) {
                            throw createError(
                                `Cannot rollback reservation for product ${oldItem.productId} (reserved mismatch)`,
                                409,
                            );
                        }
                    }

                    // delete previous reservation-related movements for this order
                    await StockMovement.deleteMany(
                        {
                            orderId: order._id,
                            $or: [
                                {
                                    from: STOCK_MOVEMENT_TYPE.INVENTORY,
                                    to: STOCK_MOVEMENT_TYPE.RESERVE,
                                },
                                {
                                    from: STOCK_MOVEMENT_TYPE.RESERVE,
                                    to: STOCK_MOVEMENT_TYPE.INVENTORY,
                                },
                            ],
                        },
                        { session },
                    );

                    // reserve new items + create new RESERVE movements
                    for (const newItem of pricedItems) {
                        const r = await Product.updateOne(
                            {
                                _id: newItem.productId,
                                status: PRODUCT_STATUS.ACTIVE,
                                totalTheoreticalStock: { $gte: newItem.actualQuantity },
                            },
                            {
                                $inc: {
                                    totalTheoreticalStock: -newItem.actualQuantity,
                                    totalReserved: +newItem.actualQuantity,
                                },
                            },
                            { session },
                        );

                        if (r.modifiedCount !== 1) {
                            throw createError(`Product ${newItem.productId} is out of stock`, 409);
                        }

                        const sm = await createStockMovement(
                            {
                                productId: newItem.productId,
                                quantityChange: newItem.actualQuantity,
                                from: STOCK_MOVEMENT_TYPE.INVENTORY,
                                to: STOCK_MOVEMENT_TYPE.RESERVE,
                                createdByUserId: userId,
                                notes: `Order ${order.orderNumber} edited (reserve updated)`,
                                orderId: order._id,
                                isExecuted: true,
                            },
                            session,
                        );

                        stockMovements.push(sm);
                    }
                }

                // update the order
                const update = {
                    customerId: nextCustomerId,
                    discountAmount: nextDiscountAmount,
                    taxAmount: nextTaxAmount,
                    notes: nextNotes,
                    subTotal,
                    total,
                };

                if (itemsProvided) {
                    update.items = pricedItems;
                }

                const updatedOrder = await Order.findByIdAndUpdate(order._id, update, {
                    new: true,
                    session,
                });

                return { updatedOrder, stockMovements };
            });

            return res
                .status(200)
                .json(response("Order updated successfully", { updatedOrder, stockMovements }));
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },

    // function to delete an order
    deleteOrder: async (req, res, next) => {
        const session = await mongoose.startSession();

        try {
            const orderId = req.params.orderId;

            const { deletedOrder, deletedMovementsCount } = await session.withTransaction(
                async () => {
                    // validate the order
                    const order = await Order.findById(orderId).session(session);
                    if (!order) {
                        throw createError("Order not found", 404);
                    }
                    if (order.status === ORDER_STATUS.FINALIZED) {
                        throw createError("Cannot delete a finalized order", 409);
                    }

                    const deletedOrder = await Order.findByIdAndDelete(orderId).session(session);

                    // return reserved products to stock (only if ON_SHELF draft reserved stock)
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
                                    totalReserved: { $gte: item.actualQuantity },
                                },
                                {
                                    $inc: {
                                        totalTheoreticalStock: +item.actualQuantity,
                                        totalReserved: -item.actualQuantity,
                                    },
                                },
                                { session },
                            );

                            if (r.modifiedCount !== 1) {
                                // This indicates your reserved totals are out of sync.
                                throw createError(
                                    `Product not found or cannot unreserve product ${item.productId} (reserved stock mismatch)`,
                                    409,
                                );
                            }
                        }
                    }
                    // delete all stock movements related to the order
                    const delRes = await StockMovement.deleteMany(
                        { orderId: deletedOrder._id },
                        { session },
                    );

                    return { deletedOrder, deletedMovementsCount: delRes.deletedCount || 0 };
                },
            );

            res.status(200).json(
                response("Order deleted successflly", { deletedOrder, deletedMovementsCount }),
            );
        } catch (err) {
            return next(err);
        } finally {
            await session.endSession();
        }
    },
};

module.exports = orderService;
