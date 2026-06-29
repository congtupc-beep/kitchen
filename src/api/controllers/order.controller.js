// src/api/controllers/order.controller.js
const orderService = require('../../services/order.service');
const responseBuilder = require('../../utils/responseBuilder');

class OrderController {
    // POST /api/orders
    createOrder = async (req, res, next) => {
        try {
            const result = await orderService.processNewOrder(req.body);
            return responseBuilder.success(res, result, 'Đơn hàng đã được tiếp nhận và chuyển xuống KDS thành công.', 201);
        } catch (error) {
            next(error); // Chuyển tiếp bộ gom lỗi toàn cục giải quyết
        }
    }

    // GET /api/orders
    getAllOrders = async (req, res, next) => {
        try {
            const orders = await orderService.getAllOrders();
            return responseBuilder.success(res, orders, 'Tải danh sách đơn hàng thành công.', 200);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();
