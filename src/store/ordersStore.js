const orders = [];

module.exports = {
    getAll() {
        return orders;
    },
    getById(id) {
        return orders.find((order) => order.id === id);
    },
    add(order) {
        orders.push(order);
        return order;
    },
    deleteById(id) {
        const index = orders.findIndex((order) => order.id === id);
        if (index === -1) return false;
        orders.splice(index, 1);
        return true;
    },
};