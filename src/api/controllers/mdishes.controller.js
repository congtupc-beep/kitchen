// src/api/controllers/dish.controller.js
const dishService = require('../../services/dish.service');
const responseBuilder = require('../../utils/responseBuilder');

class DishController {
    /**
     * Lấy toàn bộ danh sách món ăn
     */
    getAll = async (req, res, next) => {
        try {
            const dishes = await dishService.findAll();
            return responseBuilder.success(res, dishes, 'Lấy danh sách món ăn thành công.', 200);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm món ăn mới
     */
    create = async (req, res, next) => {
        try {
            // Service sẽ nhận data từ req.body và xử lý
            const newDish = await dishService.create(req.body);
            return responseBuilder.success(res, newDish, 'Thêm món ăn mới thành công.', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật món ăn
     */
    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const updatedDish = await dishService.update(id, req.body);
            return responseBuilder.success(res, updatedDish, 'Cập nhật món ăn thành công.', 200);
        } catch (error) {
            next(error);
        }
    }

    delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        await dishService.deleteDish(id); // Bạn cần thêm hàm này trong Service
        return responseBuilder.success(res, null, 'Đã xóa món ăn.', 200);
    } catch (error) {
        next(error);
    }
}
}

module.exports = new DishController();