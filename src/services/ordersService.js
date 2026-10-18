const { randomUUID } = require("node:crypto");

const DEFAULT_ORDER_STATUS = "created";

function makeOrderId() {
    return `ord-${randomUUID().slice(0, 8)}`;
}

function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateTotal(items) {
    return roundMoney(
        items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    );
}

function normalizeItems(items) {
    return items.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity,
        price: item.price,
    }));
}

function validateCreateOrder(body) {
    const problems = [];

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        problems.push("Request body must be a JSON object");
        return problems;
    }

    if (
        typeof body.customerName !== "string" ||
        body.customerName.trim().length === 0
    ) {
        problems.push("customerName is required");
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        problems.push("At least one item is required");
        return problems;
    }

    body.items.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            problems.push(`items[${index}] must be an object`);
            return;
        }

        if (typeof item.name !== "string" || item.name.trim().length === 0) {
            problems.push(`items[${index}].name is required`);
        }

        if (
            typeof item.quantity !== "number" ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0
        ) {
            problems.push(`items[${index}].quantity must be greater than zero`);
        }

        if (
            typeof item.price !== "number" ||
            !Number.isFinite(item.price) ||
            item.price <= 0
        ) {
            problems.push(`items[${index}].price must be greater than zero`);
        }
    });

    return problems;
}

function formatOrderResponse(order) {
    return {
        id: order.id,
        customerName: order.customerName,
        items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        })),
        total: order.total,
        status: order.status,
    };
}

function createOrderData(body) {
    const normalizedCustomerName = body.customerName.trim();
    const items = normalizeItems(body.items);
    const total = calculateTotal(items);

    return {
        id: makeOrderId(),
        customerName: normalizedCustomerName,
        items,
        total,
        status: DEFAULT_ORDER_STATUS,
        createdAt: new Date().toISOString(),
    };
}

module.exports = {
    validateCreateOrder,
    createOrderData,
    formatOrderResponse,
};