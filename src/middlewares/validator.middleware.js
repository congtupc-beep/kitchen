// src/middlewares/validator.middleware.js

const AppError = require('../utils/AppError'); // Sửa lại đường dẫn import chính xác vào thư mục utils

/**
 * Middleware validate request sử dụng Joi
 * @param {Object} schema - Joi schema object (có thể là object trực tiếp hoặc chứa các key body, query, params)
 * @param {string} property - 'body' | 'query' | 'params' (mặc định 'body')
 */

const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        if (!schema) return next();

        // Linh hoạt: Nếu schema truyền vào là một Joi object trực tiếp (không bọc qua key property), 
        // hoặc là object chứa key [property] như 'body', 'query', 'params'
        const joiSchema = schema[property] && typeof schema[property].validate === 'function' 
            ? schema[property] 
            : (typeof schema.validate === 'function' ? schema : null);

        // Nếu không xác định được Joi schema hợp lệ -> Bỏ qua đi tiếp
        if (!joiSchema) return next();

        const { error, value } = joiSchema.validate(req[property], {
            abortEarly: false,      // Trả về TẤT CẢ các lỗi đầu vào cùng một lúc
            allowUnknown: false,    // Chặn đứng hoàn toàn nếu có field lạ truyền lên
            stripUnknown: true      // Tự động lọc bỏ các trường không được định nghĩa trong schema
        });

        if (error) {
            // Tạo đối tượng lỗi đồng bộ cấu trúc với error.middleware.js
            const validationError = new AppError('Dữ liệu đầu vào không hợp lệ', 400);
            
            validationError.isJoi = true;
            validationError.details = error.details;
            
            // Đẩy lỗi sang Global Error Handler ở cuối server.js xử lý đóng gói JSON
            return next(validationError);
        }

        // Ghi đè dữ liệu đã được làm sạch và chuẩn hóa (ép kiểu dữ liệu) ngược lại vào request
        req[property] = value;
        next();
    };
};

module.exports = { validate };