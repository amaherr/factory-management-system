// function that creates an error with a message and status code
function createError(message, statusCode = 500) {
    const err = new Error(message);
    err.status = statusCode;
    return err;
}

module.exports = createError;
