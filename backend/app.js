require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/connectDB");

// import routes
const userRoutes = require("./routes/user.routes");
const customerRoutes = require("./routes/customer.routes");
const issueRoutes = require("./routes/issue.routes");
const notificationRoutes = require("./routes/notification.routes");

// import middlewares
const logger = require("./middlewares/logger");
const authenticator = require("./middlewares/authenticator");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
connectDB();

// mount middlewares
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_KEY));
app.use(logger);
app.use(authenticator);

// mount user routes
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);

// mount error handler
app.use(errorHandler);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}...`);
});
