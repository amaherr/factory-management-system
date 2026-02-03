const Order = require("../models/order.model");
const Counter = require("../models/counter.model");
const Inventory = require("../models/inventory.model");
const Product = require("../models/product.model");

const { ORDER_TYPE } = require("../enums/order.enums");
const { PRODUCT_STATUS } = require("../enums/product.enums");
const createError = require("../utils/errorFactory");

// ------------------------ Helpers ------------------------
async function getNextOrderNumber(session) {
    const doc = await Counter.findOneAndUpdate(
        { name: "orderNumber" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session },
    );
    return doc.seq;
}

function isPositiveNumber(n) {
    return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

const orderController = {
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
                const orderNumber = await getNextOrderNumber(session);

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
};

module.exports = orderController;
