const User = require("./user.model");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function findByPhoneNumber(phoneNumber, tx = null) {
    const session = getMongoSession(tx);
    const query = User.findOne({ phoneNumber });
    if (session) {
        query.session(session);
    }
    return query;
}

async function findByPhoneNumberWithPassword(phoneNumber, tx = null) {
    const session = getMongoSession(tx);
    const query = User.findOne({ phoneNumber }).select("+password");
    if (session) {
        query.session(session);
    }
    return query;
}

async function createUser(data, tx = null) {
    const session = getMongoSession(tx);
    if (!session) {
        return User.create(data);
    }

    const [user] = await User.create([data], { session });
    return user;
}

async function getAllUsers(data = null, tx = null) {
    const session = getMongoSession(tx);
    const query = User.find();
    if (session) {
        query.session(session);
    }
    return query;
}

async function getUserById(userId, tx = null) {
    const session = getMongoSession(tx);
    const query = User.findById(userId);
    if (session) {
        query.session(session);
    }
    return query;
}

async function updateUserById(data, tx = null) {
    const { userId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = {
        new: true,
        runValidators: true,
    };
    if (session) {
        options.session = session;
    }

    return User.findByIdAndUpdate(userId, updateObject, options);
}

async function deleteUserById(userId, tx = null) {
    const session = getMongoSession(tx);
    const options = {};
    if (session) {
        options.session = session;
    }

    return User.findByIdAndDelete(userId, options);
}

const userRepository = {
    findByPhoneNumber,
    findByPhoneNumberWithPassword,
    createUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
};

module.exports = userRepository;
