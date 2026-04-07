const STOCK_MOVEMENT_TYPE = Object.freeze({
    RESERVE: "reserve",
    SALES: "sales",
    BATCH: "batch",
    RETURN: "return",
    MANUAL_ADJUSTMENT: "manual_adjustment",
    INVENTORY: "inventory",
});

const WAREHOUSE_ACTIONS = Object.freeze({
    PICK: "pick",
    RECEIVE: "receive",
    TRANSFER: "transfer",
});

module.exports = { STOCK_MOVEMENT_TYPE, WAREHOUSE_ACTIONS };
