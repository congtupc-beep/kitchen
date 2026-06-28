const dishRepo = require('../repositories/dish.repo');

const getMasterMenuDishes = async (req, res, next) => {
    try {
        // Gọi sang tầng Repository để lấy dữ liệu
        const dishes = await dishRepo.getAllDishes();
        
        // Trả về JSON cho frontend
        return res.status(200).json(dishes);
    } catch (error) {
        // Đẩy lỗi sang Error Middleware xử lý tập trung (Khối 5 trong server.js)
        next(error);
    }
};

module.exports = {
    getMasterMenuDishes
};