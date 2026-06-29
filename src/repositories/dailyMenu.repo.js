// src/repositories/dailyMenu.repo.js
const { poolPromise } = require('../../config/database');

/**
 * Lớp Truy Vấn Dữ Liệu DailyMenu (Repository Layer)
 */
class DailyMenuRepository {
    /**
     * Lấy thông tin thực đơn ngày theo date
     * @param {String} date - Định dạng ngày YYYY-MM-DD
     */
    async getDailyMenuByDate(date) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('date', date)
            .query(`
                SELECT daily_menu_id, date, created_by, is_active, created_at, updated_at
                FROM [dbo].[daily_menus] WITH (NOLOCK)
                WHERE date = @date
            `);
        return result.recordset[0] || null;
    }

    /**
     * Tạo mới một thực đơn ngày (hỗ trợ SQL Transaction)
     * @param {Object} menuData - Chứa date, createdBy, isActive
     * @param {Object} [transaction] - Đối tượng mssql Transaction (nếu dùng)
     */
    async createDailyMenu(menuData, transaction) {
        const request = transaction ? transaction.request() : (await poolPromise).request();
        
        const result = await request
            .input('date', menuData.date)
            .input('createdBy', menuData.createdBy)
            .input('isActive', menuData.isActive !== undefined ? menuData.isActive : 0)
            .query(`
                INSERT INTO [dbo].[daily_menus] (date, created_by, is_active, created_at, updated_at)
                OUTPUT INSERTED.daily_menu_id
                VALUES (@date, @createdBy, @isActive, GETDATE(), GETDATE());
            `);
            
        return result.recordset[0].daily_menu_id;
    }

    /**
     * Lấy thực đơn ngày kèm chi tiết món ăn (JOIN bảng dishes)
     * @param {String} date - Định dạng ngày YYYY-MM-DD
     */
    async getDailyMenuWithItems(date) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('date', date)
            .query(`
                SELECT 
                    dm.daily_menu_id, 
                    dm.date, 
                    dm.created_by, 
                    dm.is_active,
                    dmi.item_id, 
                    dmi.dish_id, 
                    dmi.status, 
                    dmi.added_by,
                    d.name AS dish_name, 
                    d.category AS dish_category, 
                    d.price AS dish_price, 
                    d.image_url AS dish_image_url
                FROM [dbo].[daily_menus] dm WITH (NOLOCK)
                INNER JOIN [dbo].[daily_menu_items] dmi WITH (NOLOCK) ON dm.daily_menu_id = dmi.daily_menu_id
                INNER JOIN [dbo].[dishes] d WITH (NOLOCK) ON dmi.dish_id = d.dish_id
                WHERE dm.date = @date
            `);
        return result.recordset;
    }
}

module.exports = new DailyMenuRepository();
