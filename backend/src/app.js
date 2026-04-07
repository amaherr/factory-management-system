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
const exportRoutes = require("./modules/exports/export.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");

// import middlewares
const logger = require("./middlewares/logger");
const authenticator = require("./middlewares/authenticator");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
connectDB();

// mount middlewares
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.use("/api/exports", exportRoutes);
app.use("/api/analytics", analyticsRoutes);

// mount error handler
app.use(errorHandler);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}...`);
});
