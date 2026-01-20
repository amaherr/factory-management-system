// function to log the current route accessed
const logger = (req, res, next) => {
    // get needed info
    const httpMethod = req.method;
    const route = req.originalUrl;
    const timestamp = new Date().toISOString();

    console.log(`${httpMethod} ${route} ${timestamp}`);
    next();
};

module.exports = logger;
