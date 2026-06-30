const orderService = require('../../services/order.service');
const responseBuilder = require('../../utils/responseBuilder');

/**
 * OrderController - Điều phối API đơn hàng (Thành viên D)
 */
class OrderController {
    async createOrder(req, res, next) {
        try {
            const result = await orderService.processNewOrder(req.body);
            return responseBuilder.success(res, result, 'Tạo đơn hàng thành công.', 201);
        } catch (error) { next(error); }
    }

    async getPendingOrders(req, res, next) {
        try {
            const orders = await orderService.getPendingOrders();
            return responseBuilder.success(res, orders, 'Tải danh sách đơn hàng chờ thành công.');
        } catch (error) { next(error); }
    }

    async getRecentOrders(req, res, next) {
        try {
            const limit = req.query.limit || 50;
            const orders = await orderService.getRecentOrders(limit);
            return responseBuilder.success(res, orders, 'Tải danh sách đơn hàng gần đây thành công.');
        } catch (error) { next(error); }
    }

    async getOrderById(req, res, next) {
        try {
            const orderId = req.params.id;
            const order = await orderService.getOrderById(orderId);
            return responseBuilder.success(res, order, 'Tải chi tiết đơn hàng thành công.');
        } catch (error) { next(error); }
    }

    async updateOrderStatus(req, res, next) {
        try {
            const orderId = req.params.id;
            const status = req.body.status;
            const result = await orderService.updateOrderStatus(orderId, status);
            return responseBuilder.success(res, result, 'Cập nhật trạng thái đơn hàng thành công.');
        } catch (error) { next(error); }
    }

    async cancelOrder(req, res, next) {
        try {
            const orderId = req.params.id;
            const result = await orderService.cancelOrder(orderId);
            return responseBuilder.success(res, result, 'Hủy đơn hàng thành công.');
        } catch (error) { next(error); }
    }
}

// 🚨 CỰC KỲ QUAN TRỌNG: PHẢI CÓ CHỮ "new"
module.exports = new OrderController();