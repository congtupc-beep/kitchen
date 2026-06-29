// src/api/routes/auth.routes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate } = require('../../middlewares/validator.middleware');
const { loginValidationSchema } = require('../../validations/auth.validation');

/**
 * Đường dẫn gốc cấu hình tại server.js: /api/auth
 * Định tuyến chi tiết: POST /api/auth/login
 * Thứ tự: Kiểm tra Validation Schema trước -> Chuyển vào Controller giải quyết sau
 */
router.post('/login', validate(loginValidationSchema, 'body'), authController.login);
/**
 * Định tuyến chi tiết: POST /api/auth/logout
 * Nhiệm vụ: Giải phóng trạng thái is_active về 0 trong Database khi đầu bếp rời ca
 */
router.post('/logout', authController.logout);

module.exports = router;