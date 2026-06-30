// src/api/controllers/dailyMenu.controller.js
const dailyMenuService = require('../../services/dailyMenu.service');
const responseBuilder = require('../../utils/responseBuilder');

/**
 * Lớp Điều Khiển API Thực Đơn Ngày (Controller Layer)
 */
class DailyMenuController {
    /**
     * GET /api/daily-menus?date=YYYY-MM-DD
     */
    getDailyMenu = async (req, res, next) => {
        try {
            const { date } = req.query;
            if (!date) {
                return responseBuilder.error(res, 'Vui lòng cung cấp ngày cần tải thực đơn (date)!', 400);
            }
            const data = await dailyMenuService.getDailyMenu(date);
            return responseBuilder.success(res, data, 'Tải thực đơn ngày thành công.', 200);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/daily-menus
     */
    saveDailyMenu = async (req, res, next) => {
        try {
            const { date, dishIds, createdBy } = req.body;
            const result = await dailyMenuService.saveDailyMenu(date, dishIds, createdBy);
            return responseBuilder.success(res, result, 'Thiết lập thực đơn ngày thành công.', 200);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/daily-menus/status
     */
    updateMenuItemStatus = async (req, res, next) => {
        try {
            const { date, dishId, status } = req.body;
            const result = await dailyMenuService.updateMenuItemStatus(date, dishId, status);
            return responseBuilder.success(res, result, 'Cập nhật trạng thái phục vụ món ăn thành công.', 200);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DailyMenuController();