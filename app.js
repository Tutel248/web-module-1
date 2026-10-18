const express = require("express");
const { randomUUID } = require("node:crypto");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_VERSION = "1.0";
const DEFAULT_ORDER_STATUS = "created";

const orders = [];

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

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

function copyItem(item) {
    return {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
    };
}

function orderResponse(order) {
    return {
        id: order.id,
        customerName: order.customerName,
        items: order.items.map(copyItem),
        total: order.total,
        status: order.status,
    };
}

function validationProblem(message, details) {
    return {
        error: {
            code: "VALIDATION_ERROR",
            message,
            details,
        },
    };
}

function notFoundProblem() {
    return {
        error: {
            code: "ORDER_NOT_FOUND",
            message: "Order not found",
        },
    };
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

function normalizeItems(items) {
    return items.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity,
        price: item.price,
    }));
}

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        version: API_VERSION,
    });
});

app.post("/orders", (req, res, next) => {
    try {
        const validationErrors = validateCreateOrder(req.body);

        if (validationErrors.length > 0) {
            return res
                .status(400)
                .json(validationProblem("Invalid order", validationErrors));
        }

        const normalizedCustomerName = req.body.customerName.trim();
        const items = normalizeItems(req.body.items);
        const serverCalculatedTotal = calculateTotal(items);
        const status = DEFAULT_ORDER_STATUS;

        const newOrder = {
            id: makeOrderId(),
            customerName: normalizedCustomerName,
            items,
            total: serverCalculatedTotal,
            status,
            createdAt: new Date().toISOString(),
        };

        orders.push(newOrder);
        const responseBody = orderResponse(newOrder);

        return res
            .status(201)
            .location(`/orders/${newOrder.id}`)
            .json(responseBody);
    } catch (error) {
        return next(error);
    }
});

app.get("/orders", (req, res) => {
    const result = orders.map((order) => orderResponse(order));
    const responseBody = {
        orders: result,
        count: result.length,
    };

    res.status(200).json(responseBody);
});

app.get("/orders/:id", (req, res) => {
    const requestedId = req.params.id;
    const matchingOrder = orders.find((order) => order.id === requestedId);

    if (!matchingOrder) {
        return res.status(404).json(notFoundProblem());
    }

    const responseBody = orderResponse(matchingOrder);
    return res.status(200).json(responseBody);
});

app.delete("/orders/:id", (req, res) => {
    const orderId = req.params.id;
    const orderIndex = orders.findIndex((order) => order.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json(notFoundProblem());
    }

    orders.splice(orderIndex, 1);
    return res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found",
        },
    });
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json(
            validationProblem("Invalid JSON body", [
                "Request body must contain valid JSON",
            ]),
        );
    }

    console.error(error);
    return res.status(500).json({
        error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected server error",
        },
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Orders API is running on http://localhost:${PORT}`);
    });
}

module.exports = app;