const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB successfully");
    } catch (err) {
        console.log("Failed connect to MongoDB");
        console.log(err.message);
    }
};

module.exports = connectDB;
