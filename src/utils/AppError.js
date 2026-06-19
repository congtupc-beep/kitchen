/**
 * Class AppError - Khởi tạo đối tượng lỗi nghiệp vụ tùy chỉnh toàn hệ thống
 * Kế thừa lớp Error mặc định của Node.js để giữ nguyên vẹn dấu vết ngăn xếp (Stack Trace)
 */
class AppError extends Error {
    /**
     * @param {string} message - Thông báo chi tiết về lỗi xảy ra (trả về frontend cho đầu bếp đọc)
     * @param {number} statusCode - Mã trạng thái HTTP chuẩn hóa (400, 401, 403, 404, 500)
     * 
     */
    constructor(message, statusCode) {
        // Gọi constructor của lớp Error cha để gán chuỗi thông điệp lỗi
        super(message);

        this.statusCode = statusCode || 500;
        
        // Xác định kiểu lỗi nghiệp vụ chủ động (Operational Error) 
        // Phân biệt với các lỗi sập hệ thống do lập trình (như gõ sai biến, thiếu dấu)
        this.isOperational = true;

        // Ghi lại vết ngăn xếp (Stack Trace) để phục vụ debug trong môi trường Development
        // Loại bỏ chính hàm constructor này ra khỏi danh sách vết để log sạch hơn
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;