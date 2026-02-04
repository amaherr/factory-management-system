const ORDER_TYPE = Object.freeze({
    ON_SHELF: "on shelf",
    ON_DEMAND: "on demand",
});

const ORDER_STATUS = Object.freeze({
    DRAFT: "draft",
    FINALIZED: "finalized",
    CANCELLED: "cancelled",
    RETURNED: "returned",
});

module.exports = { ORDER_TYPE, ORDER_STATUS };
