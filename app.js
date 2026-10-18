const express = require("express");
const ordersRouter = require("./src/routes/orders");
const {
    notFoundHandler,
    errorHandler,
} = require("./src/middlewares/errorHandler");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_VERSION = "1.0";

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        version: API_VERSION,
    });
});

app.use("/orders", ordersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Orders API is running on http://localhost:${PORT}`);
    });
}

module.exports = app;