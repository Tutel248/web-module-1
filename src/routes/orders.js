const express = require("express");
const router = express.Router();
const ordersStore = require("../store/ordersStore");
const ordersService = require("../services/ordersService");

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

router.get("/", (req, res) => {
    const allOrders = ordersStore.getAll();
    const result = allOrders.map((order) =>
        ordersService.formatOrderResponse(order),
    );

    res.status(200).json({
        orders: result,
        count: result.length,
    });
});

router.post("/", (req, res, next) => {
    try {
        const validationErrors = ordersService.validateCreateOrder(req.body);

        if (validationErrors.length > 0) {
            return res
                .status(400)
                .json(validationProblem("Invalid order", validationErrors));
        }

        const newOrderData = ordersService.createOrderData(req.body);
        const storedOrder = ordersStore.add(newOrderData);
        const responseBody = ordersService.formatOrderResponse(storedOrder);

        return res
            .status(201)
            .location(`/orders/${storedOrder.id}`)
            .json(responseBody);
    } catch (error) {
        next(error);
    }
});

router.get("/:id", (req, res) => {
    const matchingOrder = ordersStore.getById(req.params.id);

    if (!matchingOrder) {
        return res.status(404).json(notFoundProblem());
    }

    const responseBody = ordersService.formatOrderResponse(matchingOrder);
    return res.status(200).json(responseBody);
});

router.delete("/:id", (req, res) => {
    const deleted = ordersStore.deleteById(req.params.id);

    if (!deleted) {
        return res.status(404).json(notFoundProblem());
    }

    return res.status(204).send();
});

module.exports = router;