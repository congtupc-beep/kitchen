// src/utils/responseBuilder.js

class ResponseBuilder {
    /**
     * Định dạng phản hồi thành công (2xx)
     */
    success(res, data = null, message = 'Thao tác thành công.', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            statusCode,
            message,
            data
        });
    }

    /**
     * Định dạng phản hồi lỗi (4xx, 5xx)
     */
    error(res, message = 'Đã xảy ra lỗi hệ thống.', statusCode = 500, errors = null) {
        return res.status(statusCode).json({
            success: false,
            statusCode,
            message,
            errors
        });
    }
}

// ✅ ĐẢM BẢO: Export ra instance bằng từ khóa new để controller gọi trực tiếp được hàm .success()
module.exports = new ResponseBuilder();