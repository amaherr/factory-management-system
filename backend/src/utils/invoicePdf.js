const PDFDocument = require("pdfkit");

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB");
}

function formatCurrency(value) {
    return `EGP ${Number(value || 0).toFixed(2)}`;
}

function formatStatus(value) {
    if (!value) return "-";
    const text = String(value).trim();
    if (!text) return "-";
    return text
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function getEntityId(entityRef) {
    if (!entityRef) return "";
    if (typeof entityRef === "string") return entityRef;
    if (entityRef._id) return String(entityRef._id);
    return String(entityRef);
}

function streamDocToBuffer(doc) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
    });
}

function drawHeader(doc, title, refCode, dateValue, details = []) {
    doc.fontSize(24).fillColor("#111827").text(title, { align: "left" }).moveDown(0.3);

    doc.fontSize(11)
        .fillColor("#4B5563")
        .text(`Reference: ${refCode}`)
        .text(`Date: ${formatDate(dateValue)}`);

    details.forEach((detail) => {
        doc.text(`${detail.label}: ${detail.value || "-"}`);
    });
    doc.moveDown(1);

    const y = doc.y;
    doc.moveTo(50, y).lineTo(545, y).lineWidth(1).strokeColor("#E5E7EB").stroke();
    doc.moveDown(0.8);
}

function drawCustomerBlock(doc, customer) {
    doc.fontSize(12).fillColor("#111827").text("Customer Details", { underline: false });
    doc.moveDown(0.3);

    doc.fontSize(10)
        .fillColor("#374151")
        .text(`Name: ${customer?.name || "-"}`)
        .text(`Company: ${customer?.company || "-"}`)
        .text(`Phone: ${customer?.phoneNumber || "-"}`);

    const address = customer?.address || {};
    const addressLine = [address.street, address.city, address.governate, address.country]
        .filter(Boolean)
        .join(", ");
    doc.text(`Address: ${addressLine || "-"}`).moveDown(1);
}

function drawItemsTable(doc, items) {
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const tableX = 50;
    const tableWidth = 495;
    const headerHeight = 26;
    const cellPadding = 6;
    const minRowHeight = 24;

    const columns = [
        { key: "item", title: "Item", width: 215, align: "left" },
        { key: "type", title: "Type", width: 95, align: "left" },
        { key: "qty", title: "Qty", width: 50, align: "center" },
        { key: "unit", title: "Unit", width: 67, align: "right" },
        { key: "total", title: "Total", width: 68, align: "right" },
    ];

    let currentY = doc.y;

    const drawTableHeader = () => {
        if (currentY + headerHeight > pageBottom) {
            doc.addPage();
            currentY = doc.page.margins.top;
        }

        doc.save();
        doc.rect(tableX, currentY, tableWidth, headerHeight).fill("#F9FAFB");
        doc.restore();

        doc.rect(tableX, currentY, tableWidth, headerHeight)
            .lineWidth(1)
            .strokeColor("#D1D5DB")
            .stroke();

        let x = tableX;
        columns.forEach((column, idx) => {
            if (idx !== 0) {
                doc.moveTo(x, currentY)
                    .lineTo(x, currentY + headerHeight)
                    .strokeColor("#D1D5DB")
                    .stroke();
            }

            doc.fontSize(10)
                .fillColor("#111827")
                .text(column.title, x + cellPadding, currentY + 8, {
                    width: column.width - cellPadding * 2,
                    align: column.align,
                    lineBreak: false,
                });

            x += column.width;
        });

        currentY += headerHeight;
    };

    const ensureSpaceFor = (height) => {
        if (currentY + height <= pageBottom) return;
        doc.addPage();
        currentY = doc.page.margins.top;
        drawTableHeader();
    };

    drawTableHeader();

    items.forEach((item) => {
        const primaryName = item.name || item.code || "Unknown item";
        const hasDistinctCode = item.code && item.code !== primaryName;
        const itemLabel = `${primaryName}${hasDistinctCode ? ` (${item.code})` : ""}`;
        const rowData = {
            item: itemLabel,
            type: item.itemType || "-",
            qty: String(item.quantity || 0),
            unit: formatCurrency(item.unitPrice),
            total: formatCurrency(item.totalPrice),
        };

        const textHeights = columns.map((column) =>
            doc.heightOfString(rowData[column.key], {
                width: column.width - cellPadding * 2,
                align: column.align,
            }),
        );

        const rowHeight = Math.max(
            minRowHeight,
            Math.ceil(Math.max(...textHeights) + cellPadding * 2),
        );
        ensureSpaceFor(rowHeight);

        doc.rect(tableX, currentY, tableWidth, rowHeight)
            .lineWidth(1)
            .strokeColor("#E5E7EB")
            .stroke();

        let x = tableX;
        columns.forEach((column, idx) => {
            if (idx !== 0) {
                doc.moveTo(x, currentY)
                    .lineTo(x, currentY + rowHeight)
                    .strokeColor("#E5E7EB")
                    .stroke();
            }

            doc.fontSize(10)
                .fillColor("#374151")
                .text(rowData[column.key], x + cellPadding, currentY + cellPadding, {
                    width: column.width - cellPadding * 2,
                    align: column.align,
                });

            x += column.width;
        });

        currentY += rowHeight;
    });

    doc.y = currentY + 14;
}

function drawTotals(doc, totals) {
    const rightX = 360;
    doc.fontSize(11).fillColor("#111827");
    doc.text(`Subtotal: ${formatCurrency(totals.subTotal)}`, rightX, doc.y, { align: "right" });
    doc.text(`Discount: ${formatCurrency(totals.discountAmount)}`, rightX, doc.y, {
        align: "right",
    });
    doc.text(`Tax: ${formatCurrency(totals.taxAmount)}`, rightX, doc.y, { align: "right" });

    doc.moveDown(0.2);
    doc.fontSize(13)
        .fillColor("#111827")
        .text(`Grand Total: ${formatCurrency(totals.total)}`, rightX, doc.y, { align: "right" })
        .moveDown(1);
}

async function buildOrderInvoicePdf(order) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    drawHeader(doc, "Order Invoice", `ORD-${order.orderNumber}`, order.createdAt, [
        { label: "Order Status", value: formatStatus(order.status) },
    ]);
    drawCustomerBlock(doc, order.customerId);

    const items = (order.items || []).map((item) => {
        const product = item.productId || {};
        return {
            name: product.name,
            code: product.productCode,
            itemType: item.itemType || "-",
            quantity: item.lineQuantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
        };
    });

    drawItemsTable(doc, items);
    drawTotals(doc, {
        subTotal: order.subTotal,
        discountAmount: order.discountAmount,
        taxAmount: order.taxAmount,
        total: order.total,
    });

    if (order.notes) {
        doc.fontSize(11).fillColor("#111827").text("Notes");
        doc.fontSize(10).fillColor("#374151").text(order.notes);
    }

    return streamDocToBuffer(doc);
}

async function buildReturnInvoicePdf(returnDoc, order, customer) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    drawHeader(doc, "Return Invoice", `RET-${returnDoc.returnNumber}`, returnDoc.returnDate, [
        { label: "Return Status", value: formatStatus(returnDoc.status) },
        { label: "Order Status", value: formatStatus(order.status) },
    ]);
    drawCustomerBlock(doc, customer);

    const orderItemsMap = new Map(
        (order.items || []).map((item) => [getEntityId(item.productId), item]),
    );

    const items = (returnDoc.items || []).map((item) => {
        const key = getEntityId(item.productId);
        const orderItem = orderItemsMap.get(key);
        const product = item.productId || {};

        return {
            name: product.name || (orderItem && orderItem.productId && orderItem.productId.name),
            code:
                product.productCode ||
                (orderItem && orderItem.productId && orderItem.productId.productCode),
            itemType: item.itemType || (orderItem && orderItem.itemType) || "-",
            quantity: item.lineQuantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
        };
    });

    drawItemsTable(doc, items);

    const subTotal = (returnDoc.items || []).reduce(
        (sum, item) => sum + Number(item.totalPrice || 0),
        0,
    );
    drawTotals(doc, {
        subTotal,
        discountAmount: 0,
        taxAmount: 0,
        total: subTotal,
    });

    if (returnDoc.note) {
        doc.fontSize(11).fillColor("#111827").text("Notes");
        doc.fontSize(10).fillColor("#374151").text(returnDoc.note);
    }

    return streamDocToBuffer(doc);
}

module.exports = {
    buildOrderInvoicePdf,
    buildReturnInvoicePdf,
};
