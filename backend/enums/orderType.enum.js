const ORDER_TYPE = Object.freeze({
  ON_SHELF: "on_shelf",
  ON_DEMAND: "on_demand",
});

const ORDER_STATUS = Object.freeze({
  PENDING: "pending",
  CANCELLED: "cancelled",
  SHIPPED: "shipped",
});

module.exports = { ORDER_TYPE, ORDER_STATUS };
