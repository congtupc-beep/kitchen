// src/middlewares/error.middleware.js
const AppError = require('../utils/AppError'); 
const responseBuilder = require('../utils/responseBuilder'); 

/**
 * Middleware xử lý lỗi tập trung toàn hệ thống bếp
 */
const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi hệ thống nội bộ';
    let errors = null;

    // =========================================================================
    // 1. XỬ LÝ LỖI VALIDATION TỪ JOI
    // =========================================================================
    if (err.isJoi || err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Dữ liệu đầu vào không hợp lệ';
        errors = err.details?.map(d => ({
            field: d.context?.key || d.path?.join('.'),
            message: d.message
        })) || [];
    }

    // =========================================================================
    // 2. XỬ LÝ LỖI SQL SERVER (mssql package)
    // =========================================================================
    if (err.code === 'ELOGIN') {
        statusCode = 500;
        message = 'Không thể kết nối Database. Vui lòng kiểm tra cấu hình.';
    }
    if (err.code === 'EREQUEST') {
        statusCode = 500;
        message = 'Lỗi truy vấn Database';
        console.error('[SQL Error]:', err.message);
    }

    // =========================================================================
    // 3. XỬ LÝ LỖI JSON PARSE
    // =========================================================================
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        statusCode = 400;
        message = 'JSON dữ liệu truyền lên không hợp lệ';
    }

    // =========================================================================
    // 4. LOG LỖI HỆ THỐNG TRÊN CONSOLE BACKEND
    // =========================================================================
    if (statusCode >= 500) {
        console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.url}`);
        console.error('Error Stack:', err.stack);
    }

    // =========================================================================
    // 5. TRẢ VỀ RESPONSE CHUẨN ĐỒNG BỘ VỚI RESPONSE BUILDER
    // =========================================================================
    // Nếu đang ở môi trường dev và là lỗi hệ thống lạ, gộp stack trace vào object errors
    if (process.env.NODE_ENV === 'development' && !err.isOperational) {
        errors = errors || [];
        errors.push({ field: 'system_stack', message: err.stack });
    }

    // 🔥 VÁ LỖI ĐỒNG BỘ: Gọi trực tiếp qua đối tượng responseBuilder để ăn khớp cấu trúc JSON
    return responseBuilder.error(res, message, statusCode, errors);
};

module.exports = errorMiddleware;