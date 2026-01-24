const ORDER_TYPE = Object.freeze({
  ON_SHELF: "on_shelf",
  ON_DEMAND: "on_demand",
});

const ORDER_STATUS = Object.freeze({
  DRAFT: "draft",
  FINALIZED: "finalized",
  CANCELLED: "cancelled",
  RETURNED: "returned",
});

module.exports = { ORDER_TYPE, ORDER_STATUS };
