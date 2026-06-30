// src/repositories/dailyMenuItem.repo.js
const { poolPromise } = require('../../config/database');

/**
 * Lớp Truy Vấn Dữ Liệu Chi Tiết Thực Đơn Ngày (Repository Layer)
 */
class DailyMenuItemRepository {
    /**
     * Xóa toàn bộ chi tiết món ăn của một thực đơn ngày (hỗ trợ SQL Transaction)
     * @param {Number} dailyMenuId 
     * @param {Object} [transaction] - Đối tượng mssql Transaction
     */
    async deleteDailyMenuItems(dailyMenuId, transaction) {
        const request = transaction ? transaction.request() : (await poolPromise).request();
        
        await request
            .input('dailyMenuId', dailyMenuId)
            .query(`
                DELETE FROM [dbo].[daily_menu_items]
                WHERE daily_menu_id = @dailyMenuId;
            `);
    }

    /**
     * Thêm mới một chi tiết món ăn vào thực đơn ngày (hỗ trợ SQL Transaction)
     * @param {Object} itemData - Gồm dailyMenuId, dishId, status, addedBy
     * @param {Object} [transaction] - Đối tượng mssql Transaction
     */
    async createDailyMenuItem(itemData, transaction) {
        const request = transaction ? transaction.request() : (await poolPromise).request();
        
        const result = await request
            .input('dailyMenuId', itemData.dailyMenuId)
            .input('dishId', itemData.dishId)
            .input('status', itemData.status || 'AVAILABLE')
            .input('addedBy', itemData.addedBy)
            .query(`
                INSERT INTO [dbo].[daily_menu_items] (daily_menu_id, dish_id, status, added_by, updated_at)
                OUTPUT INSERTED.item_id
                VALUES (@dailyMenuId, @dishId, @status, @addedBy, GETDATE());
            `);
            
        return result.recordset[0].item_id;
    }

    /**
     * Cập nhật trạng thái phục vụ món ăn (AVAILABLE/SOLD_OUT/UNAVAILABLE)
     * @param {Number} dailyMenuId 
     * @param {Number} dishId 
     * @param {String} status 
     */
    async updateMenuItemStatus(dailyMenuId, dishId, status) {
        const pool = await poolPromise;
        await pool.request()
            .input('dailyMenuId', dailyMenuId)
            .input('dishId', dishId)
            .input('status', status)
            .query(`
                UPDATE [dbo].[daily_menu_items]
                SET status = @status, updated_at = GETDATE()
                WHERE daily_menu_id = @dailyMenuId AND dish_id = @dishId;
            `);
    }
}

module.exports = new DailyMenuItemRepository();