const xlsx = require("xlsx-js-style");

const Batch = require("../batches/batch.model");
const BatchEvent = require("../batches/batchEvent.model");
const Counter = require("../../utils/counter.model");
const Customer = require("../customers/customer.model");
const Issue = require("../issues/issue.model");
const Notification = require("../notifications/notification.model");
const Order = require("../orders/order.model");
const Location = require("../locations/location.model");
const Product = require("../products/product.model");
const Return = require("../returns/return.model");
const StockMovement = require("../stockMovements/stockMovement.model");
const User = require("../users/user.model");

const response = require("../../utils/responseFactory");
const createError = require("../../utils/errorFactory");

// ------------ Helpers ------------

const SUPPORTED_COLLECTIONS = Object.freeze({
    users: User,
    customers: Customer,
    locations: Location,
    products: Product,
    orders: Order,
    issues: Issue,
    notifications: Notification,
    returns: Return,
    batches: Batch,
    "batch-events": BatchEvent,
    counters: Counter,
    "stock-movements": StockMovement,
});

const normalizeCellValue = (value) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value.toISOString();

    if (Array.isArray(value) || typeof value === "object") {
        return JSON.stringify(value);
    }

    return value;
};

const getExportableKeys = (model, document) => {
    const schemaKeys = Object.keys(model.schema.paths).filter(
        (key) => key !== "_id" && key !== "__v",
    );
    const documentKeys = Object.keys(document).filter((key) => key !== "_id" && key !== "__v");

    return ["_id", ...new Set([...schemaKeys, ...documentKeys])];
};

const normalizeDocuments = (model, documents) => {
    return documents.map((doc) => {
        const normalized = {};
        const exportableKeys = getExportableKeys(model, doc);

        exportableKeys.forEach((key) => {
            const value = doc[key];
            normalized[key] = normalizeCellValue(value);
        });

        return normalized;
    });
};

const escapeCsvCell = (value) => {
    const stringValue = String(value ?? "");
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
};

const buildCsv = (rows) => {
    if (!rows.length) {
        return "";
    }

    const headers = Array.from(
        rows.reduce((headerSet, row) => {
            Object.keys(row).forEach((key) => headerSet.add(key));
            return headerSet;
        }, new Set()),
    );

    const headerLine = headers.map(escapeCsvCell).join(",");
    const dataLines = rows.map((row) => {
        return headers.map((header) => escapeCsvCell(row[header])).join(",");
    });

    return [headerLine, ...dataLines].join("\n");
};

const getColumnWidths = (rows) => {
    if (!rows.length) {
        return [];
    }

    const headers = Array.from(
        rows.reduce((headerSet, row) => {
            Object.keys(row).forEach((key) => headerSet.add(key));
            return headerSet;
        }, new Set()),
    );

    return headers.map((header) => {
        const maxCellLength = rows.reduce((maxLength, row) => {
            return Math.max(maxLength, String(row[header] ?? "").length);
        }, header.length);

        return {
            wch: Math.min(Math.max(maxCellLength + 4, 14), 42),
        };
    });
};

const applyExcelStyles = (worksheet, rows) => {
    if (!rows.length || !worksheet["!ref"]) {
        return worksheet;
    }

    const range = xlsx.utils.decode_range(worksheet["!ref"]);

    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
        const cellAddress = xlsx.utils.encode_cell({ r: range.s.r, c: columnIndex });
        const cell = worksheet[cellAddress];

        if (cell) {
            cell.s = {
                font: {
                    bold: true,
                    color: { rgb: "FFFFFF" },
                },
                fill: {
                    patternType: "solid",
                    fgColor: { rgb: "1F4E78" },
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true,
                },
            };
        }
    }

    worksheet["!cols"] = getColumnWidths(rows);

    return worksheet;
};

const getModelByCollectionName = (collectionName) => {
    return SUPPORTED_COLLECTIONS[collectionName];
};

const makeFileSafeTimestamp = () => {
    return new Date().toISOString().replace(/[:.]/g, "-");
};

// ------------ Services ------------

const exportService = {
    getExportableCollections: async (req, res, next) => {
        try {
            const collections = Object.keys(SUPPORTED_COLLECTIONS);
            res.status(200).json(
                response("Exportable collections retrieved successfully", collections),
            );
        } catch (err) {
            return next(err);
        }
    },

    exportCollectionAsCsv: async (req, res, next) => {
        try {
            const { collection } = req.params;
            const model = getModelByCollectionName(collection);

            if (!model) {
                return next(createError("Invalid collection name", 400));
            }

            const documents = await model.find().lean();
            const normalizedRows = normalizeDocuments(model, documents);
            const csvContent = buildCsv(normalizedRows);
            const fileName = `${collection}-${makeFileSafeTimestamp()}.csv`;

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);

            return res.status(200).send(csvContent);
        } catch (err) {
            return next(err);
        }
    },

    exportCollectionAsExcel: async (req, res, next) => {
        try {
            const { collection } = req.params;
            const model = getModelByCollectionName(collection);

            if (!model) {
                return next(createError("Invalid collection name", 400));
            }

            const documents = await model.find().lean();
            const normalizedRows = normalizeDocuments(model, documents);

            const worksheet = normalizedRows.length
                ? applyExcelStyles(xlsx.utils.json_to_sheet(normalizedRows), normalizedRows)
                : xlsx.utils.aoa_to_sheet([["No data available"]]);

            if (!normalizedRows.length) {
                worksheet["!cols"] = [{ wch: 22 }];
                worksheet.A1.s = {
                    font: {
                        bold: true,
                        color: { rgb: "FFFFFF" },
                    },
                    fill: {
                        patternType: "solid",
                        fgColor: { rgb: "1F4E78" },
                    },
                    alignment: {
                        horizontal: "center",
                        vertical: "center",
                    },
                };
            }

            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, collection.slice(0, 31));

            const workbookBuffer = xlsx.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
            });

            const fileName = `${collection}-${makeFileSafeTimestamp()}.xlsx`;

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);

            return res.status(200).send(workbookBuffer);
        } catch (err) {
            return next(err);
        }
    },
};

module.exports = exportService;
