const Notification = require("../models/notification.model");
const StockMovement = require("../models/stockMovement.model");
const Counter = require("../models/counter.model");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// gets the next number of a document
async function getNextDocumentNumber(name, session) {
    if (!session) {
        throw new Error("Session is required to create get document number");
    }

    const doc = await Counter.findOneAndUpdate(
        { name },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session },
    );
    return doc.seq;
}

// sends a new notification (within a session)
async function sendNotification({ receiverUserId, senderUserId, content }, session) {
    return await Notification.create([{ receiverUserId, senderUserId, content }], { session });
}

// creates new stock movement
async function createStockMovement(
    {
        productId,
        quantityChange,
        from,
        to,
        createdByUserId,
        notes,
        orderId, // optional
        returnId, // optional
        batchId, // optional
        warehouseAction, // optional
        isExecuted, // optional
        sourceLocation, // optional
        destinationLocation, // optional
        physicalExecutedAt, // optional
        physicalExecutedByUserId, // optional
    },
    session,
) {
    if (!session) {
        throw new Error("Session is required to create a stock movement");
    }

    const doc = {
        productId,
        quantityChange,
        from,
        to,
        createdByUserId,
        isExecuted: isExecuted ?? false,
    };

    if (notes != null) doc.notes = notes;

    // optional references, only set if provided
    if (orderId != null) doc.orderId = orderId;
    if (returnId != null) doc.returnId = returnId;
    if (batchId != null) doc.batchId = batchId;

    // optional warehouse/physical execution fields
    if (warehouseAction != null) doc.warehouseAction = warehouseAction;
    if (sourceLocation != null) doc.sourceLocation = sourceLocation;
    if (destinationLocation != null) doc.destinationLocation = destinationLocation;
    if (physicalExecutedAt != null) doc.physicalExecutedAt = physicalExecutedAt;
    if (physicalExecutedByUserId != null) doc.physicalExecutedByUserId = physicalExecutedByUserId;

    const [movement] = await StockMovement.create([doc], { session });
    return movement;
}

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

function ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

function hashFileName(originalName) {
    const ext = path.extname(originalName || "").toLowerCase();
    const hash = crypto.randomBytes(16).toString("hex");
    return `${hash}${ext}`;
}

function saveUploadedFile(file) {
    if (!file) {
        return null;
    }

    ensureUploadsDir();

    const fileName = hashFileName(file.originalname);
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${fileName}`;
}

function deleteUploadedFile(url) {
    if (!url || typeof url !== "string") {
        return false;
    }

    const normalized = url.replace(/\\/g, "/");
    const uploadsPrefix = "/uploads/";

    if (!normalized.startsWith(uploadsPrefix)) {
        return false;
    }

    const fileName = normalized.slice(uploadsPrefix.length);
    if (!fileName) {
        return false;
    }

    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }

    return false;
}

module.exports = {
    getNextDocumentNumber,
    sendNotification,
    createStockMovement,
    saveUploadedFile,
    deleteUploadedFile,
};
