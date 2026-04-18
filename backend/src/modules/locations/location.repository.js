const mongoose = require("mongoose");

const Location = require("./location.model");
const { getMongoSession } = require("../../database/transactionManager/mongoAdapter");

async function createLocation(data, tx = null) {
    const session = getMongoSession(tx);
    if (!session) {
        return Location.create(data);
    }

    const [location] = await Location.create([data], { session });
    return location;
}

async function getAllLocations(tx = null) {
    const session = getMongoSession(tx);
    const query = Location.find().sort({ name: 1 });
    if (session) {
        query.session(session);
    }
    return query;
}

async function getLocationById(locationId, tx = null) {
    const session = getMongoSession(tx);
    const query = Location.findById(locationId);
    if (session) {
        query.session(session);
    }
    return query;
}

async function updateLocationById(data, tx = null) {
    const { locationId, updateObject } = data;
    const session = getMongoSession(tx);
    const options = {
        new: true,
        runValidators: true,
    };
    if (session) {
        options.session = session;
    }

    return Location.findByIdAndUpdate(locationId, updateObject, options);
}

async function deleteLocationById(locationId, tx = null) {
    const session = getMongoSession(tx);
    const options = {};
    if (session) {
        options.session = session;
    }
    return Location.findByIdAndDelete(locationId, options);
}

async function addSection(data, tx = null) {
    const { locationId, section } = data;
    const session = getMongoSession(tx);

    const query = Location.findByIdAndUpdate(
        locationId,
        {
            $push: {
                sections: section,
            },
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (session) {
        query.session(session);
    }

    return query;
}

async function updateSection(data, tx = null) {
    const { locationId, sectionId, updateObject } = data;
    const session = getMongoSession(tx);

    const setObject = {};
    Object.entries(updateObject).forEach(([key, value]) => {
        setObject[`sections.$.${key}`] = value;
    });

    const query = Location.findOneAndUpdate(
        {
            _id: locationId,
            "sections._id": new mongoose.Types.ObjectId(sectionId),
        },
        {
            $set: setObject,
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (session) {
        query.session(session);
    }

    return query;
}

async function removeSection(data, tx = null) {
    const { locationId, sectionId } = data;
    const session = getMongoSession(tx);

    const query = Location.findByIdAndUpdate(
        locationId,
        {
            $pull: {
                sections: {
                    _id: new mongoose.Types.ObjectId(sectionId),
                },
            },
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (session) {
        query.session(session);
    }

    return query;
}

const locationRepository = {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocationById,
    deleteLocationById,
    addSection,
    updateSection,
    removeSection,
};

module.exports = locationRepository;
