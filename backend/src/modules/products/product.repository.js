const Product = require("./product.model");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function applyReturnFinalization(data, tx = null) {
    const { productId, actualQuantity } = data;
    const session = getMongoSession(tx);
    const options = {};
    if (session) {
        options.session = session;
    }

    return Product.updateOne(
        { _id: productId, totalSold: { $gte: actualQuantity } },
        {
            $inc: {
                totalSold: -actualQuantity,
                totalTheoreticalStock: +actualQuantity,
            },
        },
        options,
    );
}

const productRepository = {
    applyReturnFinalization,
};

module.exports = productRepository;