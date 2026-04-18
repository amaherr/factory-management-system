/* Invariants:
   - Per-item stock handling based on itemType (on shelf | on demand)
   - ON_SHELF items: draft reserves stock (theoretical--, reserved++)
   - ON_SHELF finalize: reserved--, sold++
   - ON_SHELF cancel: reserved--, theoretical++
   - ON_DEMAND items: stock doesn't change at any stage
*/

const orderRepository = require("./order.repository");
const productRepository = require("../products/product.repository");

const { ORDER_TYPE, ORDER_STATUS } = require("../../enums/order.enums");
const { PRODUCT_STATUS } = require("../../enums/product.enums");
const { COUNTERS } = require("../../enums/counter.enums");
const { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS } = require("../../enums/stockMovement.enums");

const response = require("../../utils/responseFactory");
const createError = require("../../utils/errorFactory");
const { getNextDocumentNumber } = require("../../utils/helpers");
const stockMovementRepository = require("../stockMovements/stockMovement.repository");
const transactionManager = require("../../database/transactionManager/instance");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");
const { buildOrderInvoicePdf } = require("../../utils/invoicePdf");

const orderService = {
    // function to create a new order
    createOrder: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { customerId, items, discountAmount, taxAmount, notes } = req.body;

            // transactional part
            let result;
            await transactionManager.run(async (tx) => {
                const session = getMongoSession(tx);
                // generate order number atomically
                const orderNumber = await getNextDocumentNumber(COUNTERS.ORDER_NUMBER, session);

                // fetch products once
                const productIds = items.map((item) => item.productId);
                const products = await productRepository.getProductsByIdsForOrderItems(
                    { productIds },
                    tx,
                );

                const productMap = new Map(products.map((p) => [String(p._id), p]));

                // validate products exist and activated + build pricedItems (snapshot)
                // each item includes its itemType
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
                        itemType: it.itemType, // per-item fulfillment type
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

                // create order (NO orderType field, itemType is per-item)
                const createdOrder = await orderRepository.createOrder(
                    {
                        orderNumber,
                        createdByUserId: userId,
                        customerId,
                        items: pricedItems,
                        subTotal,
                        discountAmount: discount,
                        taxAmount: tax,
                        total,
                        notes,
                    },
                    tx,
                );

                // CHANGED: handle stock per item based on itemType
                let stockMovements = [];
                for (const item of pricedItems) {
                    // only reserve stock if item is On-Shelf
                    if (item.itemType === ORDER_TYPE.ON_SHELF) {
                        // check if item is out of stock (reserve and decrement from stock if not)
                        const r = await productRepository.reserveForOrderItem(
                            {
                                productId: item.productId,
                                actualQuantity: item.actualQuantity,
                            },
                            tx,
                        );

                        if (r.modifiedCount !== 1) {
                            throw createError(`Product ${item.productId} is out of stock`, 409);
                        }

                        // create stock movement for the item
                        const sm = await stockMovementRepository.createStockMovement(
                            {
                                productId: item.productId,
                                quantityChange: item.actualQuantity,
                                from: STOCK_MOVEMENT_TYPE.INVENTORY,
                                to: STOCK_MOVEMENT_TYPE.RESERVE,
                                createdByUserId: userId,
                                notes: `Reserve from order ${orderNumber} - ${notes || ""}`,
                                orderId: createdOrder._id,
                                isExecuted: true,
                            },
                            tx,
                        );
                        stockMovements.push(sm);
                    }
                    // ON_DEMAND items: no stock operations
                }

                result = { createdOrder, stockMovements };
            });

            const { createdOrder, stockMovements } = result;

            return res
                .status(201)
                .json(response("Order created successfully", { createdOrder, stockMovements }));
        } catch (err) {
            return next(err);
        }
    },

    // function to get orders (filtered)
    getOrders: async (req, res, next) => {
        try {
            const {
                createdByUserId,
                customerId,
                status,
                from, // date filter
                to, // date filter
                q, // search by order number
            } = req.query;

            // build the filter object (NO orderType filtering)
            const filter = {};
            if (createdByUserId) filter.createdByUserId = createdByUserId;
            if (customerId) filter.customerId = customerId;
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
            const orders = await orderRepository.getOrders({ filter });

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
                status,
                q, // search by order number
            } = req.query;

            // build the filter object (NO orderType filtering)
            const filter = {};
            if (customerId) filter.customerId = customerId;
            if (status) filter.status = status;

            // search query
            if (q) {
                const num = Number(q);
                if (!Number.isNaN(num)) filter.orderNumber = num;
            }

            const orders = await orderRepository.getUserOrders({ userId, filter });

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
            const order = await orderRepository.getOrderWithDetails(orderId);
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
        try {
            const orderId = req.params.orderId;
            const userId = req.user.id;
            const { status } = req.body;

            let result;
            await transactionManager.run(async (tx) => {
                // fetch first to distinguish 404 vs 409 and to know orderType
                const order = await orderRepository.getOrderById(orderId, tx);
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
                const updatedOrder = await orderRepository.updateDraftOrderStatus(
                    {
                        orderId,
                        updateObject: update,
                    },
                    tx,
                );

                if (!updatedOrder) {
                    throw createError("Order not found or cannot change status", 409);
                }

                const stockMovements = [];

                // CHANGED: per-item stock handling based on itemType
                // move from reserved to sold (only for ON_SHELF items) or release reserved (for cancellation)
                for (const item of updatedOrder.items) {
                    if (item.itemType === ORDER_TYPE.ON_SHELF) {
                        if (status === ORDER_STATUS.FINALIZED) {
                            // move from reserved to sold
                            const r = await productRepository.finalizeReservedForOrderItem(
                                {
                                    productId: item.productId,
                                    actualQuantity: item.actualQuantity,
                                },
                                tx,
                            );

                            if (r.modifiedCount !== 1) {
                                throw createError(
                                    `Cannot finalize: reserved mismatch for product ${item.productId}`,
                                    409,
                                );
                            }

                            // create stock movement
                            const sm = await stockMovementRepository.createStockMovement(
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
                                tx,
                            );
                            stockMovements.push(sm);
                        }

                        if (status === ORDER_STATUS.CANCELLED) {
                            // move from reserved to theoretical stock
                            const r = await productRepository.cancelReservedForOrderItem(
                                {
                                    productId: item.productId,
                                    actualQuantity: item.actualQuantity,
                                },
                                tx,
                            );

                            if (r.modifiedCount !== 1) {
                                throw createError(
                                    `Cannot cancel: reserved mismatch for product ${item.productId}`,
                                    409,
                                );
                            }

                            // create stock movement
                            const sm = await stockMovementRepository.createStockMovement(
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
                                tx,
                            );
                            stockMovements.push(sm);
                        }
                    }
                    // ON_DEMAND items: no stock changes
                }

                result = { updatedOrder, stockMovements };
            });

            const { updatedOrder, stockMovements } = result;

            return res
                .status(200)
                .json(
                    response("Order status updated successfully", { updatedOrder, stockMovements }),
                );
        } catch (err) {
            return next(err);
        }
    },

    // function to edit the details of an order
    editOrder: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const orderId = req.params.orderId;
            const { customerId, items, discountAmount, taxAmount, notes } = req.body;

            let result;
            await transactionManager.run(async (tx) => {
                // validate the order
                const order = await orderRepository.getOrderById(orderId, tx);
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
                        quantity: it.lineQuantity,
                        itemType: it.itemType,
                    }));

                // helper to compare old vs new (by productId and quantity and itemType)
                const toQtyMap = (arr) => {
                    const m = new Map();
                    for (const it of arr) {
                        m.set(String(it.productId), {
                            quantity: Number(it.quantity),
                            itemType: it.itemType,
                        });
                    }
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
                    for (const [pid, data] of newQtyMap) {
                        const oldData = oldQtyMap.get(pid);
                        if (
                            !oldData ||
                            oldData.quantity !== data.quantity ||
                            oldData.itemType !== data.itemType
                        ) {
                            return true;
                        }
                    }
                    return false;
                })();

                // here we rebuild items snapshot if itemsProvided; otherwise keep current pricedItems from order
                let pricedItems = order.items;
                if (itemsProvided) {
                    // fetch all products
                    const productIds = nextRawItems.map((it) => it.productId);
                    const products = await productRepository.getProductsByIdsForOrderItems(
                        { productIds },
                        tx,
                    );

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
                            itemType: it.itemType, // CHANGED: include itemType per item
                        };
                    });
                }

                // recompute totals (based on pricedItems + nextDiscountAmount/nextTaxAmount)
                const subTotal = pricedItems.reduce((acc, it) => acc + Number(it.totalPrice), 0);

                const total = subTotal + nextTaxAmount - nextDiscountAmount;
                if (total < 0) {
                    throw createError("Total cannot be negative (check discount/tax)", 400);
                }

                // CHANGED: stock logic + movements per-item based on itemType
                const stockMovements = [];
                if (itemsChanged) {
                    // undo old reservations (unreserve only ON_SHELF items from the old order)
                    for (const oldItem of order.items) {
                        if (oldItem.itemType === ORDER_TYPE.ON_SHELF) {
                            const r = await productRepository.unreserveOrderItem(
                                {
                                    productId: oldItem.productId,
                                    actualQuantity: oldItem.actualQuantity,
                                },
                                tx,
                            );

                            if (r.modifiedCount !== 1) {
                                throw createError(
                                    `Cannot rollback reservation for product ${oldItem.productId} (reserved mismatch)`,
                                    409,
                                );
                            }
                        }
                    }

                    // delete previous reservation-related movements for this order
                    await stockMovementRepository.deleteReservationMovementsByOrderId(
                        order._id,
                        tx,
                    );

                    // reserve new items + create new RESERVE movements (only for ON_SHELF items)
                    for (const newItem of pricedItems) {
                        if (newItem.itemType === ORDER_TYPE.ON_SHELF) {
                            const r = await productRepository.reserveForOrderItem(
                                {
                                    productId: newItem.productId,
                                    actualQuantity: newItem.actualQuantity,
                                },
                                tx,
                            );

                            if (r.modifiedCount !== 1) {
                                throw createError(
                                    `Product ${newItem.productId} is out of stock`,
                                    409,
                                );
                            }

                            const sm = await stockMovementRepository.createStockMovement(
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
                                tx,
                            );

                            stockMovements.push(sm);
                        }
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

                const updatedOrder = await orderRepository.updateOrderById(
                    {
                        orderId: order._id,
                        updateObject: update,
                    },
                    tx,
                );

                result = { updatedOrder, stockMovements };
            });

            const { updatedOrder, stockMovements } = result;

            return res
                .status(200)
                .json(response("Order updated successfully", { updatedOrder, stockMovements }));
        } catch (err) {
            return next(err);
        }
    },

    // function to download an order invoice PDF
    downloadInvoice: async (req, res, next) => {
        try {
            const { orderId } = req.params;

            const order = await orderRepository.getOrderWithDetails(orderId);
            if (!order) {
                return next(createError("Order not found", 404));
            }

            const invoiceBuffer = await buildOrderInvoicePdf(order);
            const fileName = `order-invoice-ORD-${order.orderNumber}.pdf`;

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
            return res.status(200).send(invoiceBuffer);
        } catch (err) {
            return next(err);
        }
    },

    // function to delete an order
    deleteOrder: async (req, res, next) => {
        try {
            const orderId = req.params.orderId;

            let result;
            await transactionManager.run(async (tx) => {
                // validate the order
                const order = await orderRepository.getOrderById(orderId, tx);
                if (!order) {
                    throw createError("Order not found", 404);
                }
                if (order.status === ORDER_STATUS.FINALIZED) {
                    throw createError("Cannot delete a finalized order", 409);
                }

                const deletedOrder = await orderRepository.deleteOrderById(orderId, tx);

                // CHANGED: return reserved products to stock (only for ON_SHELF items in DRAFT status)
                if (deletedOrder.status === ORDER_STATUS.DRAFT) {
                    // return reserved stock only for on-shelf items
                    for (const item of deletedOrder.items) {
                        if (item.itemType === ORDER_TYPE.ON_SHELF) {
                            // add reserved to stock
                            const r = await productRepository.unreserveOrderItem(
                                {
                                    productId: item.productId,
                                    actualQuantity: item.actualQuantity,
                                },
                                tx,
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
                }
                // delete all stock movements related to the order
                const delRes = await stockMovementRepository.deleteByOrderId(deletedOrder._id, tx);

                result = { deletedOrder, deletedMovementsCount: delRes.deletedCount || 0 };
            });

            const { deletedOrder, deletedMovementsCount } = result;

            res.status(200).json(
                response("Order deleted successflly", { deletedOrder, deletedMovementsCount }),
            );
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = orderService;
