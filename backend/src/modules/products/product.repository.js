const Product = require("./product.model");
const { PRODUCT_STATUS } = require("../../enums/product.enums");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function findByCode(code, tx = null) {
    const session = getMongoSession(tx);
    const query = Product.findOne({ code });
    if (session) {
        query.session(session);
    }
    return query;
}

async function createProduct(data, tx = null) {
    const session = getMongoSession(tx);
    if (!session) {
        return Product.create(data);
    }

    const [product] = await Product.create([data], { session });
    return product;
}

async function getProductById(productId, tx = null) {
    const session = getMongoSession(tx);
    const query = Product.findById(productId);
    if (session) {
        query.session(session);
    }
    return query;
}

async function deleteProductById(productId, tx = null) {
    const session = getMongoSession(tx);
    const options = {};
    if (session) {
        options.session = session;
    }
    return Product.findByIdAndDelete(productId, options);
}

async function updateProductById(data, tx = null) {
    const { productId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = {
        new: true,
        runValidators: true,
    };
    if (session) {
        options.session = session;
    }

    return Product.findByIdAndUpdate(productId, updateObject, options);
}

async function getAllProducts(data = null, tx = null) {
    const session = getMongoSession(tx);
    const query = Product.find();
    if (session) {
        query.session(session);
    }
    return query;
}

async function getAllActiveProducts(data = null, tx = null) {
    const session = getMongoSession(tx);
    const query = Product.find({ status: PRODUCT_STATUS.ACTIVE });
    if (session) {
        query.session(session);
    }
    return query;
}

async function getProductsWithStock(data = null, tx = null) {
    const session = getMongoSession(tx);
    const query = Product.find({ totalPhysicalStock: { $gt: 0 } });
    if (session) {
        query.session(session);
    }
    return query;
}

async function getProductsByLocation(location, tx = null) {
    const session = getMongoSession(tx);
    const query = Product.find({
        locations: {
            $elemMatch: {
                location,
                quantityInStock: { $gt: 0 },
            },
        },
    });

    if (session) {
        query.session(session);
    }
    return query;
}

async function saveProduct(data, tx = null) {
    const { productDoc } = data;
    const session = getMongoSession(tx);
    if (session) {
        return productDoc.save({ session });
    }
    return productDoc.save();
}

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
    findByCode,
    createProduct,
    getProductById,
    deleteProductById,
    updateProductById,
    getAllProducts,
    getAllActiveProducts,
    getProductsWithStock,
    getProductsByLocation,
    saveProduct,
    applyReturnFinalization,
};

module.exports = productRepository;
