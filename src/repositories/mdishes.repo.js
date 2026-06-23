// src/repositories/dish.repository.js
const { poolPromise, sql } = require('../../config/database');
const Dish = require('../entities/dish');

class DishRepository {
    /**
     * Lấy danh sách tất cả các món ăn
     */
    async findAll() {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT [dish_id], [master_menu_id], [name], [category], 
                       [price], [description], [image_url], [is_active]
                FROM [dbo].[dishes]
            `);

            return result.recordset.map(row => new Dish({
                dish_id: row.dish_id,
                master_menu_id: row.master_menu_id,
                name: row.name,
                category: row.category,
                price: row.price,
                description: row.description,
                image_url: row.image_url,
                is_active: row.is_active
            }));
        } catch (error) {
            error.code = error.code || 'EREQUEST';
            throw error;
        }
    }

    /**
     * Thêm món ăn mới
     */
    async create(dishData) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('mid', sql.Int, dishData.master_menu_id)
                .input('name', sql.NVarChar, dishData.name)
                .input('cat', sql.NVarChar, dishData.category)
                .input('price', sql.Decimal(18, 2), dishData.price)
                .input('desc', sql.NVarChar, dishData.description)
                .input('img', sql.NVarChar, dishData.image_url)
                .query(`
                    INSERT INTO [dbo].[dishes] 
                    ([master_menu_id], [name], [category], [price], [description], [image_url], [is_active])
                    OUTPUT INSERTED.dish_id
                    VALUES (@mid, @name, @cat, @price, @desc, @img, 1)
                `);

            return { ...dishData, dish_id: result.recordset[0].dish_id };
        } catch (error) {
            error.code = error.code || 'EREQUEST';
            throw error;
        }
    }

    /**
     * Cập nhật món ăn
     */
    async update(id, dishData) {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, dishData.name)
                .input('price', sql.Decimal(18, 2), dishData.price)
                .input('desc', sql.NVarChar, dishData.description)
                .query(`
                    UPDATE [dbo].[dishes] 
                    SET [name] = @name, [price] = @price, [description] = @desc 
                    WHERE [dish_id] = @id
                `);
            return { id, ...dishData };
        } catch (error) {
            error.code = error.code || 'EREQUEST';
            throw error;
        }
    }

    async delete(id) {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM [dbo].[dishes] WHERE [dish_id] = @id');
        return true;
    } catch (error) {
        throw error;
    }
}
}

module.exports = new DishRepository();