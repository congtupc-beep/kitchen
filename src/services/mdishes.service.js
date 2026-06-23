// src/services/dish.service.js
const dishRepository = require('../repositories/dish.repository');
const AppError = require('../utils/AppError'); // Giả sử bạn dùng class AppError như trong auth.service

class DishService {
    /**
     * Lấy toàn bộ danh sách món ăn
     */
    async findAll() {
        return await dishRepository.findAll();
    }

    /**
     * Nghiệp vụ thêm món ăn mới
     */
    async create(dishData) {
        // Logic nghiệp vụ: Kiểm tra giá tiền không được âm
        if (dishData.price < 0) {
            throw new AppError('Giá món ăn không được là số âm!', 400);
        }

        // Logic nghiệp vụ: Tên món ăn không được để trống
        if (!dishData.name || dishData.name.trim() === '') {
            throw new AppError('Tên món ăn không được để trống!', 400);
        }

        return await dishRepository.create(dishData);
    }

    /**
     * Nghiệp vụ cập nhật món ăn
     */
    async update(id, dishData) {
        // Kiểm tra xem món ăn có tồn tại không (nếu cần, bạn có thể thêm hàm findById trong repo)
        if (!id) {
            throw new AppError('Thiếu mã định danh món ăn (dishId)!', 400);
        }

        // Thực hiện cập nhật
        return await dishRepository.update(id, dishData);
    }
}

module.exports = new DishService();