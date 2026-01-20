require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// mount middlewares
app.use(cookieParser(process.env.COOKIE_KEY));

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}...`);
});
