require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/connectDB");

// import routes
const userRoutes = require("./routes/user.routes");
const customerRoutes = require("./routes/customer.routes");
const issueRoutes = require("./routes/issue.routes");
const productRoutes = require("./routes/product.routes");
const notificationRoutes = require("./routes/notification.routes");
const orderRoutes = require("./routes/order.routes");
const returnRoutes = require("./routes/return.routes");
const batchRoutes = require("./routes/batch.routes");

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
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_KEY));
app.use(logger);
app.use(authenticator);

// mount user routes
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/batches", batchRoutes);

// mount error handler
app.use(errorHandler);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}...`);
});
