// src/api/routes/dish.routes.js
const express = require('express');
const router = express.Router();
const { poolPromise } = require('../../../config/database');
const responseBuilder = require('../../utils/responseBuilder');

/**
 * GET /api/dishes
 * Lấy toàn bộ danh sách món ăn (kèm thông tin master menu)
 * Query params: ?category=... &search=... &active=1
 */
router.get('/', async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const { category, search, active } = req.query;

        let query = `
            SELECT
                d.dish_id,
                d.master_menu_id,
                d.name,
                d.category,
                d.price,
                d.description,
                d.image_url,
                d.is_active,
                mm.restaurant_name
            FROM [dbo].[dishes] d
            LEFT JOIN [dbo].[master_menus] mm ON d.master_menu_id = mm.master_menu_id
            WHERE 1=1
        `;

        const request = pool.request();

        if (active !== undefined) {
            query += ` AND d.is_active = @active`;
            request.input('active', active === '0' ? 0 : 1);
        }

        if (category) {
            query += ` AND d.category = @category`;
            request.input('category', category);
        }

        if (search) {
            query += ` AND (d.name LIKE @search OR d.description LIKE @search)`;
            request.input('search', `%${search}%`);
        }

        query += ` ORDER BY d.category ASC, d.name ASC`;

        const result = await request.query(query);

        return responseBuilder.success(res, result.recordset, `Lấy danh sách món ăn thành công. Tổng: ${result.recordset.length} món.`);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dishes/:id
 * Lấy chi tiết một món ăn
 */
router.get('/:id', async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const { sql } = require('mssql');
        const request = pool.request();
        request.input('dishId', parseInt(req.params.id, 10));

        const result = await request.query(`
            SELECT d.*, mm.restaurant_name
            FROM [dbo].[dishes] d
            LEFT JOIN [dbo].[master_menus] mm ON d.master_menu_id = mm.master_menu_id
            WHERE d.dish_id = @dishId
        `);

        if (!result.recordset[0]) {
            return responseBuilder.error(res, 'Không tìm thấy món ăn!', 404);
        }

        return responseBuilder.success(res, result.recordset[0], 'Lấy chi tiết món ăn thành công.');
    } catch (error) {
        next(error);
    }
});

module.exports = router;
