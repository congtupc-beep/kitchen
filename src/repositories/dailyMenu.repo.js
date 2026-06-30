const { poolPromise, sql } = require('../../config/database');

/**
 * Lấy thực đơn ngày theo ngày cụ thể + danh sách món đã chọn
 * Dùng bởi dailyMenu.service.js (getDailyMenu, saveDailyMenu, updateMenuItemStatus)
 * @param {string} date - Định dạng YYYY-MM-DD
 */
async function getDailyMenuByDate(date) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('date', sql.Date, date)
        .query(`SELECT daily_menu_id, date, created_by, is_active, created_at, updated_at
                FROM [dbo].[daily_menus]
                WHERE CAST(date AS DATE) = CAST(@date AS DATE)`);
    return result.recordset[0] || null;
}

/**
 * Lấy danh sách món ăn đã được chọn trong thực đơn ngày
 * Dùng bởi dailyMenu.service.js -> getDailyMenu()
 * @param {string} date - Định dạng YYYY-MM-DD
 */
async function getDailyMenuWithItems(date) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('date', sql.Date, date)
        .query(`
            SELECT dmi.item_id, dmi.daily_menu_id, dmi.dish_id, dmi.status, dmi.added_by, dmi.updated_at
            FROM [dbo].[daily_menu_items] dmi
            INNER JOIN [dbo].[daily_menus] dm ON dmi.daily_menu_id = dm.daily_menu_id
            WHERE CAST(dm.date AS DATE) = CAST(@date AS DATE)
        `);
    return result.recordset;
}

/**
 * Tạo mới bản ghi thực đơn ngày (header, không bao gồm món ăn)
 * Dùng bởi dailyMenu.service.js -> saveDailyMenu()
 * @param {Object} data - { date, createdBy, isActive }
 * @param {Object} transaction - mssql Transaction
 */
async function createDailyMenu(data, transaction) {
    const request = transaction ? transaction.request() : (await poolPromise).request();
    const result = await request
        .input('date', sql.Date, data.date)
        .input('createdBy', sql.Int, data.createdBy)
        .input('isActive', sql.Bit, data.isActive !== undefined ? data.isActive : 1)
        .query(`
            INSERT INTO [dbo].[daily_menus] (date, created_by, is_active, created_at, updated_at)
            OUTPUT INSERTED.daily_menu_id
            VALUES (@date, @createdBy, @isActive, GETDATE(), GETDATE())
        `);
    return result.recordset[0].daily_menu_id;
}

/**
 *  Lấy thực đơn ngày hôm nay + CHI TIẾT TỪNG MÓN ĂN
 */
async function getTodayActiveMenuWithDishes() {
    const pool = await poolPromise;

    const query = `
        SELECT 
            dm.daily_menu_id,
            dm.date,
            dmi.item_id AS daily_menu_item_id,
            dmi.dish_id,
            dmi.status AS item_status,
            d.name AS dish_name,
            d.category,
            d.price,
            d.description,
            d.image_url
        FROM [dbo].[daily_menus] dm
        INNER JOIN [dbo].[daily_menu_items] dmi 
            ON dm.daily_menu_id = dmi.daily_menu_id
        INNER JOIN [dbo].[dishes] d 
            ON dmi.dish_id = d.dish_id
        WHERE dm.is_active = 1 
          AND CAST(dm.date AS DATE) = CAST(GETDATE() AS DATE)
          AND d.is_active = 1
          AND dmi.status = 'AVAILABLE'
    `;

    const result = await pool.request().query(query);
    return result.recordset;
}

/**
 * 📋 Lấy toàn bộ thực đơn (không lọc ngày) - Dùng cho debug/test
 */
async function getAllMenusWithDishes() {
    const pool = await poolPromise;

    const query = `
        SELECT 
            dm.daily_menu_id,
            dm.date,
            dm.is_active,
            dmi.item_id AS daily_menu_item_id,
            dmi.dish_id,
            dmi.status AS item_status,
            d.name AS dish_name,
            d.price,
            d.image_url
        FROM [dbo].[daily_menus] dm
        INNER JOIN [dbo].[daily_menu_items] dmi 
            ON dm.daily_menu_id = dmi.daily_menu_id
        INNER JOIN [dbo].[dishes] d 
            ON dmi.dish_id = d.dish_id
        ORDER BY dm.date DESC, d.name ASC
    `;

    const result = await pool.request().query(query);
    return result.recordset;
}

module.exports = {
    getTodayActiveMenuWithDishes,
    getAllMenusWithDishes,
    getDailyMenuByDate,
    getDailyMenuWithItems,
    createDailyMenu
};