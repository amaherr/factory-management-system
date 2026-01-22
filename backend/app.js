require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

// import routes
const userRoutes = require("./routes/user.routes");

// import middlewares
const logger = require("./middlewares/logger");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// mount middlewares
app.use(cookieParser(process.env.COOKIE_KEY));
app.use(logger);

// mount user routes
app.use("/auth", userRoutes);

// mount error handler
app.use(errorHandler);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}...`);
});
