const COLORS = Object.freeze({
    RED: "red",
    BLUE: "blue",
    BLACK: "black",
    WHITE: "white",
    GREEN: "green",
    YELLOW: "yellow",
    GRAY: "gray",
    NAVY: "navy",
    BROWN: "brown",
    BEIGE: "beige",
    PINK: "pink",
    PURPLE: "purple",
    ORANGE: "orange",
});

const PRODUCT_STATUS = Object.freeze({
    PENDING: "pending",
    ACTIVE: "active",
    DEACTIVE: "deactive",
});

const SEASONS = Object.freeze({
    SPRING: "spring",
    SUMMER: "summer",
    AUTUMN: "autumn",
    WINTER: "winter",
});

const FACTORY_LOCATIONS = Object.freeze({
    SHOWROOM: "showroom",
    WAREHOUSE_A: "warehouse a",
    WAREHOUSE_B: "warehouse b",
});

module.exports = { COLORS, PRODUCT_STATUS, SEASONS, FACTORY_LOCATIONS };
