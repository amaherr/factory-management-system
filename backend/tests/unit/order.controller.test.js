/**
 * tests/unit/order.controller.test.js
 */
const createError = require("http-errors"); // only if your code uses it directly; otherwise remove

// --- MOCKS (adjust paths to match your imports) ---
jest.mock("mongoose", () => ({
    startSession: jest.fn(),
}));

jest.mock("../../models/product.model.js", () => ({
    find: jest.fn(),
    updateOne: jest.fn(),
}));

jest.mock("../../models/order.model.js", () => ({
    create: jest.fn(),
}));

jest.mock("../../utils/helpers", () => jest.fn());

jest.mock("../../utils/helpers", () => ({
    createStockMovement: jest.fn(),
}));

jest.mock("../../utils/responseFactory", () =>
    jest.fn((message, data) => ({ success: true, message, data })),
);

// --- IMPORTS AFTER MOCKS ---
const mongoose = require("mongoose");
const Product = require("../../models/product.model");
const Order = require("../../models/order.model");
const { getNextDocumentNumber } = require("../../utils/helpers");
const { createStockMovement } = require("../../utils/helpers");
const response = require("../../utils/responseFactory");

const orderController = require("../../controllers/order.controller");

// If your enums are imported in the controller, import here too (or hardcode strings).
const { PRODUCT_STATUS } = require("../../enums/product.enums");
const { ORDER_TYPE } = require("../../enums/order.enums");
const { COUNTERS } = require("../../enums/counter.enums");
const { STOCK_MOVEMENT_TYPE } = require("../../enums/stockMovement.enums");

// --- HELPERS ---
function makeRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
    };
}

describe("orderController.createOrder (unit)", () => {
    let session;

    beforeEach(() => {
        jest.clearAllMocks();

        session = {
            withTransaction: jest.fn(),
            endSession: jest.fn(),
        };

        mongoose.startSession.mockResolvedValue(session);
    });

    test("creates order (ON_SHELF) + reserves stock + creates stock movements", async () => {
        // Arrange
        const req = {
            user: { id: "user1" },
            body: {
                customerId: "cust1",
                orderType: ORDER_TYPE.ON_SHELF,
                items: [{ productId: "p1", quantity: 2 }],
                discountAmount: 0,
                taxAmount: 0,
                notes: "hello",
            },
        };
        const res = makeRes();
        const next = jest.fn();

        // getNextDocumentNumber
        getNextDocumentNumber.mockResolvedValue(777);

        // Product.find().session(session)
        const foundProducts = [
            {
                _id: "p1",
                status: PRODUCT_STATUS.ACTIVE,
                salePrice: 10,
                totalTheoreticalStock: 999,
                totalReserved: 0,
            },
        ];
        Product.find.mockReturnValue({
            session: jest.fn().mockResolvedValue(foundProducts),
        });

        // Order.create returns array like mongoose does in your code
        const createdOrderDoc = { _id: "o1", orderNumber: 777 };
        Order.create.mockResolvedValue([createdOrderDoc]);

        // Product.updateOne success
        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

        // createStockMovement
        createStockMovement.mockResolvedValue({ _id: "sm1" });

        // Make withTransaction execute the callback and return its result
        session.withTransaction.mockImplementation(async (fn) => fn());

        // Act
        await orderController.createOrder(req, res, next);

        // Assert: success response
        expect(res.status).toHaveBeenCalledWith(201);
        expect(response).toHaveBeenCalledWith(
            "Order created successfully",
            expect.objectContaining({
                createdOrder: createdOrderDoc,
                stockMovements: [{ _id: "sm1" }],
            }),
        );
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: "Order created successfully",
                data: expect.any(Object),
            }),
        );

        // Assert: order number generated with session
        expect(getNextDocumentNumber).toHaveBeenCalledWith(COUNTERS.ORDER_NUMBER, session);

        // Assert: Product.find called with ids
        expect(Product.find).toHaveBeenCalledWith({ _id: { $in: ["p1"] } }, expect.any(Object));

        // Assert: Order.create called with priced snapshot
        expect(Order.create).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    orderNumber: 777,
                    createdByUserId: "user1",
                    customerId: "cust1",
                    orderType: ORDER_TYPE.ON_SHELF,
                    items: [
                        { productId: "p1", quantity: 2, unitPrice: 10 }, // snapshot
                    ],
                    subTotal: 20,
                    discountAmount: 0,
                    taxAmount: 0,
                    total: 20,
                    notes: "hello",
                }),
            ],
            { session },
        );

        // Assert: stock reservation update
        expect(Product.updateOne).toHaveBeenCalledWith(
            {
                _id: "p1",
                totalTheoreticalStock: { $gte: 2 },
                status: PRODUCT_STATUS.ACTIVE,
            },
            {
                $inc: {
                    totalTheoreticalStock: -2,
                    totalReserved: +2,
                },
            },
            { session },
        );

        // Assert: stock movement created
        expect(createStockMovement).toHaveBeenCalledWith(
            expect.objectContaining({
                orderId: "o1",
                productId: "p1",
                quantityChange: 2,
                movementType: STOCK_MOVEMENT_TYPE.RESERVE,
                userId: "user1",
            }),
            session,
        );

        // Assert: next not called, session ended
        expect(next).not.toHaveBeenCalled();
        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    test("creates order (DELIVERY / non-ON_SHELF) without reserving stock", async () => {
        const req = {
            user: { id: "user1" },
            body: {
                customerId: "cust1",
                orderType: "DELIVERY", // or ORDER_TYPE.DELIVERY if you have it
                items: [{ productId: "p1", quantity: 2 }],
                notes: "",
            },
        };
        const res = makeRes();
        const next = jest.fn();

        getNextDocumentNumber.mockResolvedValue(1);

        Product.find.mockReturnValue({
            session: jest
                .fn()
                .mockResolvedValue([{ _id: "p1", status: PRODUCT_STATUS.ACTIVE, salePrice: 10 }]),
        });

        Order.create.mockResolvedValue([{ _id: "o1", orderNumber: 1 }]);

        session.withTransaction.mockImplementation(async (fn) => fn());

        await orderController.createOrder(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);

        // no reservation calls
        expect(Product.updateOne).not.toHaveBeenCalled();
        expect(createStockMovement).not.toHaveBeenCalled();

        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    test("returns 404 when product not found", async () => {
        const req = {
            user: { id: "user1" },
            body: {
                customerId: "cust1",
                orderType: ORDER_TYPE.ON_SHELF,
                items: [{ productId: "missing", quantity: 1 }],
            },
        };
        const res = makeRes();
        const next = jest.fn();

        getNextDocumentNumber.mockResolvedValue(2);

        // Product.find returns empty -> product missing
        Product.find.mockReturnValue({
            session: jest.fn().mockResolvedValue([]),
        });

        session.withTransaction.mockImplementation(async (fn) => fn());

        await orderController.createOrder(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err.status).toBe(404);

        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    test("returns 409 when product is not ACTIVE", async () => {
        const req = {
            user: { id: "user1" },
            body: {
                customerId: "cust1",
                orderType: ORDER_TYPE.ON_SHELF,
                items: [{ productId: "p1", quantity: 1 }],
            },
        };
        const res = makeRes();
        const next = jest.fn();

        getNextDocumentNumber.mockResolvedValue(3);

        Product.find.mockReturnValue({
            session: jest
                .fn()
                .mockResolvedValue([{ _id: "p1", status: "INACTIVE", salePrice: 10 }]),
        });

        session.withTransaction.mockImplementation(async (fn) => fn());

        await orderController.createOrder(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err.status).toBe(409);

        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    test("returns 400 when total becomes negative", async () => {
        const req = {
            user: { id: "user1" },
            body: {
                customerId: "cust1",
                orderType: ORDER_TYPE.ON_SHELF,
                items: [{ productId: "p1", quantity: 1 }],
                discountAmount: 9999,
                taxAmount: 0,
            },
        };
        const res = makeRes();
        const next = jest.fn();

        getNextDocumentNumber.mockResolvedValue(4);

        Product.find.mockReturnValue({
            session: jest
                .fn()
                .mockResolvedValue([{ _id: "p1", status: PRODUCT_STATUS.ACTIVE, salePrice: 10 }]),
        });

        session.withTransaction.mockImplementation(async (fn) => fn());

        await orderController.createOrder(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err.status).toBe(400);

        // should not create order if totals invalid
        expect(Order.create).not.toHaveBeenCalled();

        expect(session.endSession).toHaveBeenCalledTimes(1);
    });

    test("returns 409 when out of stock (updateOne modifiedCount !== 1)", async () => {
        const req = {
            user: { id: "user1" },
            body: {
                customerId: "cust1",
                orderType: ORDER_TYPE.ON_SHELF,
                items: [{ productId: "p1", quantity: 5 }],
            },
        };
        const res = makeRes();
        const next = jest.fn();

        getNextDocumentNumber.mockResolvedValue(5);

        Product.find.mockReturnValue({
            session: jest
                .fn()
                .mockResolvedValue([{ _id: "p1", status: PRODUCT_STATUS.ACTIVE, salePrice: 10 }]),
        });

        Order.create.mockResolvedValue([{ _id: "o1", orderNumber: 5 }]);
        Product.updateOne.mockResolvedValue({ modifiedCount: 0 }); // out of stock

        session.withTransaction.mockImplementation(async (fn) => fn());

        await orderController.createOrder(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const err = next.mock.calls[0][0];
        expect(err.status).toBe(409);

        // no stock movement if stock failed
        expect(createStockMovement).not.toHaveBeenCalled();

        expect(session.endSession).toHaveBeenCalledTimes(1);
    });
});
