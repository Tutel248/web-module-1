function validationProblem(message, details) {
    return {
        error: {
            code: "VALIDATION_ERROR",
            message,
            details,
        },
    };
}

function notFoundHandler(req, res) {
    res.status(404).json({
        error: {
            code: "ROUTE_NOT_FOUND",
            message: "Route not found",
        },
    });
}

function errorHandler(error, req, res, next) {
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
}

module.exports = {
    notFoundHandler,
    errorHandler,
};