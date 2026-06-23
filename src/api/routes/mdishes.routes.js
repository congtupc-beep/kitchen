const express = require('express');
const router = express.Router();

const dishController = require('../controllers/dish.controller');
const { validate } = require('../../middlewares/validator.middleware');
// Giả sử bạn tạo file validation này để kiểm tra dữ liệu món ăn
const { dishValidationSchema } = require('../../validations/dish.validation');

/**
 * Đường dẫn gốc cấu hình tại server.js: /api/dishes
 * * 1. GET /api/dishes: Xem danh sách món ăn
 * 2. POST /api/dishes: Thêm món ăn mới (Có kiểm tra schema đầu vào)
 * 3. PUT /api/dishes/:id: Cập nhật thông tin món ăn
 */

router.get('/', dishController.getAll);

router.post('/', validate(dishValidationSchema, 'body'), dishController.create);

router.put('/:id', validate(dishValidationSchema, 'body'), dishController.update);

router.delete('/:id', dishController.delete);

module.exports = router;