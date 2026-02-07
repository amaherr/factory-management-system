const STOCK_MOVEMENT_TYPE = Object.freeze({
    // orders
    RESERVE: "reserve",
    UNRESERVE: "unreserve",
    SALES: "sales",

    BATCH: "batch",
    RETURN: "return",
    MANUAL_ADJUSTMENT: "manual_adjustment",
});

module.exports = { STOCK_MOVEMENT_TYPE };
