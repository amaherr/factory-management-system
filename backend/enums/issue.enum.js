const ISSUE_TYPE = Object.freeze({
    INVENTORY_DISCREPANCY: "inventory discrepancy",
    DAMAGED_GOODS: "damaged goods",
    SYSTEM_BUG: "system bug",
});

const ISSUE_STATUS = Object.freeze({
    OPEN: "open",
    IN_PROGRESS: "in progress",
    RESOLVED: "resolved",
    CANCELLED: "cancelled",
});

module.exports = { ISSUE_TYPE, ISSUE_STATUS };
