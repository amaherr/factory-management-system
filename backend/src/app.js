require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const connectDB = require("./database/connectDB");
const { buildOpenApiDocument } = require("../docs/swagger");

// import routes
const userRoutes = require("./modules/users/user.routes");
const customerRoutes = require("./modules/customers/customer.routes");
const issueRoutes = require("./modules/issues/issue.routes");
const productRoutes = require("./modules/products/product.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const orderRoutes = require("./modules/orders/order.routes");
const returnRoutes = require("./modules/returns/return.routes");
const batchRoutes = require("./modules/batches/batch.routes");
const stockMovementRoutes = require("./modules/stockMovements/stockMovement.routes");
const locationRoutes = require("./modules/locations/location.routes");
const exportRoutes = require("./modules/exports/export.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");

// import middlewares
const logger = require("./middlewares/logger");
const authenticator = require("./middlewares/authenticator");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
connectDB();

const normalizeOrigin = (origin) => {
    if (!origin || typeof origin !== "string") return "";
    return origin.trim().replace(/\/$/, "");
};

const getHostname = (origin) => {
    const normalized = normalizeOrigin(origin);
    if (!normalized) return "";

    try {
        // Handle full origins (https://example.com)
        return new URL(normalized).hostname.toLowerCase();
    } catch {
        // Handle host-only values from env (example.com or example.com:5173)
        return normalized
            .replace(/^https?:\/\//i, "")
            .split(":")[0]
            .toLowerCase();
    }
};

const corsAllowList = [process.env.CLIENT_URL, process.env.CLIENT_URLS, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

const corsAllowHostnames = corsAllowList.map(getHostname).filter(Boolean);

// mount middlewares
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow server-to-server tools and same-origin requests without Origin header.
            if (!origin) {
                return callback(null, true);
            }

            const normalizedRequestOrigin = normalizeOrigin(origin);
            const requestHostname = getHostname(origin);
            const isLocalhostOrigin = /^https?:\/\/localhost(:\d+)?$/i.test(
                normalizedRequestOrigin,
            );

            // Keep local development working even if production allow-list exists.
            if (isLocalhostOrigin) {
                return callback(null, true);
            }

            if (corsAllowList.includes(normalizedRequestOrigin)) {
                return callback(null, true);
            }

            // Accept same host even if env omits protocol or has small formatting differences.
            if (requestHostname && corsAllowHostnames.includes(requestHostname)) {
                return callback(null, true);
            }

            // Optional safety valve for temporary troubleshooting in deployed environments.
            if (process.env.ALLOW_ALL_CORS === "true") {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_KEY));
app.use(logger);
app.use(authenticator);

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// serve swagger api documentation
app.get("/api-docs/openapi.json", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json(buildOpenApiDocument());
});
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
        swaggerOptions: {
            url: "/api-docs/openapi.json",
        },
    }),
);

// mount routes
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/analytics", analyticsRoutes);

// mount error handler
app.use(errorHandler);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}...`);
});
