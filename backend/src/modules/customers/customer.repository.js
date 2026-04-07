const Customer = require("./customer.model");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function findByPhoneNumber(phoneNumber, tx = null) {
    const session = getMongoSession(tx);
    const query = Customer.findOne({ phoneNumber });
    if (session) {
        query.session(session);
    }
    return query;
}

async function createCustomer(data, tx = null) {
    const session = getMongoSession(tx);
    if (!session) {
        return Customer.create(data);
    }

    const [customer] = await Customer.create([data], { session });
    return customer;
}

async function countCustomers(filter, tx = null) {
    const session = getMongoSession(tx);
    const query = Customer.countDocuments(filter);
    if (session) {
        query.session(session);
    }
    return query;
}

async function findCustomers(data, tx = null) {
    const { filter, skip, limit } = data;
    const session = getMongoSession(tx);
    const query = Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    if (session) {
        query.session(session);
    }
    return query;
}

async function findCustomerById(customerId, tx = null) {
    const session = getMongoSession(tx);
    const query = Customer.findById(customerId);
    if (session) {
        query.session(session);
    }
    return query;
}

async function updateCustomerById(data, tx = null) {
    const { customerId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = {
        new: true,
        runValidators: true,
    };
    if (session) {
        options.session = session;
    }

    return Customer.findByIdAndUpdate(customerId, updateObject, options);
}

async function deleteCustomerById(customerId, tx = null) {
    const session = getMongoSession(tx);
    const options = {};
    if (session) {
        options.session = session;
    }
    return Customer.findByIdAndDelete(customerId, options);
}

const customerRepository = {
    findByPhoneNumber,
    createCustomer,
    countCustomers,
    findCustomers,
    findCustomerById,
    updateCustomerById,
    deleteCustomerById,
};

module.exports = customerRepository;
