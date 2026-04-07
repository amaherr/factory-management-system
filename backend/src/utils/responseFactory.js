const response = (message, data) => {
    return {
        success: true,
        message,
        data,
    };
};

module.exports = response;
