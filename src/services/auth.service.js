// src/services/auth.service.js
const chefRepository = require('../repositories/chef.repo');
const AppError = require('../utils/AppError');

class AuthService {
    /**
     * Xử lý nghiệp vụ đăng nhập tài khoản bếp
     */
    async login(name, password) {
        if (!name || !password) {
            throw new AppError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!', 400);
        }

        // Truy vấn thực thể Chef từ database
        const chef = await chefRepository.findByName(name);

        // Bảo mật nghiệp vụ: Thông báo lỗi chung, không báo cụ thể sai trường nào
        if (!chef || chef.password_hash !== password) {
            throw new AppError('Tên đăng nhập hoặc mật khẩu nhà bếp không chính xác!', 401);
        }

        // ✂️ ĐÃ XÓA BỎ: Đoạn code check if (!chef.is_active) cũ gây xung đột logic chặn ca trực
        
        // Trả ra object an toàn đã giấu mật khẩu thô
        return chef.toSafeObject();
    }
}

module.exports = new AuthService();