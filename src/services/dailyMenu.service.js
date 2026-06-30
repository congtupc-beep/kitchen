// src/services/dailyMenu.service.js
const { poolPromise } = require('../../config/database');
const sql = require('mssql');
const dailyMenuRepo = require('../repositories/dailyMenu.repo');
const dailyMenuItemRepo = require('../repositories/dailyMenuItem.repo');
const AppError = require('../utils/AppError');

/**
 * Lớp Dịch Vụ Nghiệp Vụ Thực Đơn Ngày (Service Layer)
 */
class DailyMenuService {
    /**
     * Lấy thực đơn ngày kèm theo trạng thái được chọn (isSelected) cho tất cả các món ăn trong hệ thống
     * @param {String} date - Định dạng YYYY-MM-DD
     */
    async getDailyMenu(date) {
        const pool = await poolPromise;
        
        // 1. Lấy toàn bộ món ăn gốc đang hoạt động trong Master Menu
        const dishesResult = await pool.request()
            .query('SELECT dish_id, name, category, price, description, image_url, is_active FROM [dbo].[dishes] WHERE is_active = 1');
        const allDishes = dishesResult.recordset;

        // 2. Lấy danh sách các món ăn đã được chọn trong thực đơn ngày đó
        const selectedItems = await dailyMenuRepo.getDailyMenuWithItems(date);
        
        // Tạo một Map để tra cứu nhanh trạng thái món đã chọn
        const selectedMap = new Map();
        selectedItems.forEach(item => {
            selectedMap.set(item.dish_id, {
                itemId: item.item_id,
                status: item.status,
                addedBy: item.added_by
            });
        });

        // 3. Mapping toàn bộ món ăn kèm trạng thái isSelected và status trong ngày
        const menuData = allDishes.map(dish => {
            const isSelected = selectedMap.has(dish.dish_id);
            const extra = selectedMap.get(dish.dish_id);
            return {
                dish_id: dish.dish_id,
                name: dish.name ? dish.name.trim() : '',
                category: dish.category ? dish.category.trim() : '',
                price: Number(dish.price),
                description: dish.description ? dish.description.trim() : '',
                image_url: dish.image_url ? dish.image_url.trim() : '',
                isSelected: isSelected,
                menu_item_status: isSelected ? extra.status : 'UNAVAILABLE', // Mặc định UNAVAILABLE nếu không có trong thực đơn ngày
                item_id: isSelected ? extra.itemId : null
            };
        });

        // Lấy thông tin thực đơn tổng quát (daily_menu_id, is_active)
        const dailyMenuInfo = await dailyMenuRepo.getDailyMenuByDate(date);

        return {
            daily_menu_id: dailyMenuInfo ? dailyMenuInfo.daily_menu_id : null,
            date: date,
            is_active: dailyMenuInfo ? !!dailyMenuInfo.is_active : false,
            dishes: menuData
        };
    }

    /**
     * Thiết lập/Cập nhật thực đơn cho một ngày (Nghiệp vụ Transaction chính)
     * @param {String} date - Định dạng ngày YYYY-MM-DD
     * @param {Array<Number>} dishIds - Mảng mã các món ăn được chọn
     * @param {Number} createdBy - Mã đầu bếp thực hiện
     */
    async saveDailyMenu(date, dishIds, createdBy) {
        const pool = await poolPromise;
        
        // 1. Kiểm tra tính hợp lệ: Các dishId có tồn tại trong Master Menu không
        if (dishIds.length > 0) {
            const uniqueDishIds = [...new Set(dishIds)];
            const dishCheckResult = await pool.request()
                .query(`SELECT dish_id FROM [dbo].[dishes] WHERE dish_id IN (${uniqueDishIds.join(',')}) AND is_active = 1`);
            
            if (dishCheckResult.recordset.length !== uniqueDishIds.length) {
                throw new AppError('Có món ăn được chọn không tồn tại hoặc đã tạm dừng kinh doanh trong Master Menu!', 400);
            }
        }

        // 2. Khởi tạo SQL Transaction đảm bảo an toàn dữ liệu
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            // 3. Kiểm tra xem thực đơn ngày đã tồn tại hay chưa
            let dailyMenuInfo = await dailyMenuRepo.getDailyMenuByDate(date);
            let dailyMenuId;

            if (!dailyMenuInfo) {
                // Tạo mới thực đơn ngày
                dailyMenuId = await dailyMenuRepo.createDailyMenu({
                    date: date,
                    createdBy: createdBy,
                    isActive: 1 // Tạo xong kích hoạt luôn
                }, transaction);
            } else {
                dailyMenuId = dailyMenuInfo.daily_menu_id;
                // Cập nhật trạng thái kích hoạt nếu nó đang tắt
                if (!dailyMenuInfo.is_active) {
                    await transaction.request()
                        .input('dailyMenuId', dailyMenuId)
                        .query('UPDATE [dbo].[daily_menus] SET is_active = 1, updated_at = GETDATE() WHERE daily_menu_id = @dailyMenuId');
                }
            }

            // 4. Xóa toàn bộ chi tiết thực đơn cũ của ngày này (Xóa cũ)
            await dailyMenuItemRepo.deleteDailyMenuItems(dailyMenuId, transaction);

            // 5. Thêm mới các món ăn đã chọn vào thực đơn (Thêm mới)
            for (const dishId of dishIds) {
                await dailyMenuItemRepo.createDailyMenuItem({
                    dailyMenuId: dailyMenuId,
                    dishId: dishId,
                    status: 'AVAILABLE', // Mặc định khi chèn vào là Còn hàng để bán
                    addedBy: createdBy
                }, transaction);
            }

            // Hoàn tất Transaction
            await transaction.commit();
            return { dailyMenuId, date, status: 'SUCCESS' };

        } catch (error) {
            // Hoàn nguyên CSDL nếu lỗi
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Cập nhật trạng thái của món ăn trong thực đơn ngày (Còn hàng / Hết hàng)
     * @param {String} date 
     * @param {Number} dishId 
     * @param {String} status - AVAILABLE / SOLD_OUT / UNAVAILABLE
     */
    async updateMenuItemStatus(date, dishId, status) {
        // 1. Kiểm tra xem thực đơn ngày đã được thiết lập chưa
        const dailyMenuInfo = await dailyMenuRepo.getDailyMenuByDate(date);
        if (!dailyMenuInfo) {
            throw new AppError(`Thực đơn cho ngày [${date}] chưa được thiết lập. Hãy tạo thực đơn trước!`, 404);
        }

        const dailyMenuId = dailyMenuInfo.daily_menu_id;

        // 2. Kiểm tra xem món ăn này có nằm trong thực đơn ngày đó không
        const pool = await poolPromise;
        const checkItem = await pool.request()
            .input('dailyMenuId', dailyMenuId)
            .input('dishId', dishId)
            .query('SELECT item_id FROM [dbo].[daily_menu_items] WHERE daily_menu_id = @dailyMenuId AND dish_id = @dishId');

        if (checkItem.recordset.length === 0) {
            throw new AppError(`Món ăn mã [${dishId}] không thuộc thực đơn ngày [${date}]!`, 400);
        }

        // 3. Tiến hành cập nhật trạng thái
        await dailyMenuItemRepo.updateMenuItemStatus(dailyMenuId, dishId, status);
        return { dailyMenuId, dishId, status, date };
    }
}

module.exports = new DailyMenuService();