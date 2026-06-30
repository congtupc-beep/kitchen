const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validate } = require('../../middlewares/validator.middleware');
const orderValidation = require('../../validations/order.validation');

// 🐛 DEBUG: Kiểm tra xem hàm nào đang bị undefined (Đã đặt sau các dòng require)
const testMiddleware = validate(orderValidation.createOrder.body, 'body');
const testController = orderController.createOrder;

// POST /api/orders - Tạo đơn mới
router.post('/',
    validate(orderValidation.createOrder.body, 'body'), 
    orderController.createOrder
);

// GET /api/orders/pending - Đơn đang chờ
router.get('/pending',
    validate(orderValidation.orderQuery.query, 'query'), 
    orderController.getPendingOrders
);

// GET /api/orders/recent - Đơn gần đây
router.get('/recent',
    validate(orderValidation.orderQuery.query, 'query'), 
    orderController.getRecentOrders
);

// GET /api/orders/stats - Thống kê đơn hàng
router.get('/stats',
    orderController.getOrderStats
);

// GET /api/orders/:id - Chi tiết đơn
router.get('/:id',
    validate(orderValidation.orderIdParam.params, 'params'), 
    orderController.getOrderById
);

// POST /api/orders/:id/status - Cập nhật trạng thái đơn
router.post('/:id/status',
    validate(orderValidation.updateStatus.params, 'params'),
    validate(orderValidation.updateStatus.body, 'body'),
    orderController.updateOrderStatus
);

// POST /api/orders/:id/cancel - Hủy đơn
router.post('/:id/cancel',
    validate(orderValidation.orderIdParam.params, 'params'), 
    orderController.cancelOrder
);

module.exports = router;