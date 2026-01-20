// function to log and handle errors
const errorHandler = (err, req, res, next) => {
    console.log(err); // log the error to console

    res.status(err.status).json({
        success: false,
        message: err.message,
    });
};

module.exports = errorHandler;
