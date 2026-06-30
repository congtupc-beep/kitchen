// src/repositories/orderItem.repo.js
const { poolPromise, sql } = require('../../config/database'); // Sử dụng chuẩn poolPromise của hệ thống mới
const OrderItem = require('../entities/OrderItem');

class OrderItemRepository {
    /**
     * Tạo OrderItem mới (Dùng trong sql.Transaction)
     */
    async create(itemData, transaction) {
        const request = new sql.Request(transaction);
        request.input('order_id', sql.Int, itemData.order_id);
        request.input('dish_id', sql.Int, itemData.dish_id);
        request.input('quantity', sql.Int, itemData.quantity);
        request.input('note', sql.NVarChar(sql.MAX), itemData.note);
        request.input('status', sql.VarChar(20), itemData.status);
        request.input('task_id', sql.Int, itemData.task_id);
        
        await request.query(`
            INSERT INTO [dbo].[order_items] (order_id, dish_id, quantity, note, status, task_id, created_at)
            VALUES (@order_id, @dish_id, @quantity, @note, @status, @task_id, GETDATE());
        `);
    }

    /**
     * Tìm các OrderItem theo order_id
     */
    async findByOrderId(orderId) {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('orderId', sql.Int, orderId);
        
        const result = await request.query(`
            SELECT * FROM [dbo].[order_items]
            WHERE order_id = @orderId
            ORDER BY order_item_id ASC
        `);
        
        // Bẫy kiểm tra an toàn phòng vệ nếu module bị load chậm hoặc lỗi require chéo
        const ActualConstructor = typeof OrderItem === 'function' ? OrderItem : module.parent.require('../entities/OrderItem');
        return result.recordset.map(row => new ActualConstructor(row));
    }

    /**
     * Tìm các OrderItem theo task_id
     */
    async findByTaskId(taskId, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskId', sql.Int, taskId);

        const result = await request.query(`
            SELECT oi.*, d.name AS dish_name, d.price, d.image_url,
                   t.started_at, t.completed_at
            FROM [dbo].[order_items] oi
            LEFT JOIN [dbo].[dishes] d ON oi.dish_id = d.dish_id
            LEFT JOIN [dbo].[cook_tasks] t ON oi.task_id = t.task_id
            WHERE oi.task_id = @taskId
            ORDER BY oi.order_item_id ASC
        `);

        const ActualConstructor = typeof OrderItem === 'function' ? OrderItem : module.parent.require('../entities/OrderItem');
        return result.recordset.map(row => new ActualConstructor(row));
    }

    /**
     * Tìm các OrderItem theo task_id kèm giá và ảnh
     */
    async findByTaskIdWithPrice(taskId) {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('taskId', sql.Int, taskId);

        const result = await request.query(`
            SELECT oi.*, d.name AS dish_name, d.price, d.image_url,
                   t.started_at, t.completed_at
            FROM [dbo].[order_items] oi
            LEFT JOIN [dbo].[dishes] d ON oi.dish_id = d.dish_id
            LEFT JOIN [dbo].[cook_tasks] t ON oi.task_id = t.task_id
            WHERE oi.task_id = @taskId
            ORDER BY oi.order_item_id ASC
        `);

        const ActualConstructor = typeof OrderItem === 'function' ? OrderItem : module.parent.require('../entities/OrderItem');
        return result.recordset.map(row => new ActualConstructor(row));
    }

    /**
     * Tìm các OrderItem theo danh sách order_id (batch query)
     */
    async findByOrderIdList(orderIdList, transaction = null) {
        if (!orderIdList || orderIdList.length === 0) return [];

        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('orderIds', sql.NVarChar(sql.MAX), orderIdList.join(','));

        const result = await request.query(`
            SELECT * FROM [dbo].[order_items]
            WHERE order_id IN (
                SELECT TRY_CAST(value AS INT)
                FROM STRING_SPLIT(@orderIds, ',')
            )
            ORDER BY order_id, order_item_id ASC
        `);

        const ActualConstructor = typeof OrderItem === 'function' ? OrderItem : module.parent.require('../entities/OrderItem');
        return result.recordset.map(row => new ActualConstructor(row));
    }

    /**
     * Cập nhật trạng thái OrderItem
     */
    async updateStatus(orderItemId, status, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();

        request.input('itemId', sql.Int, orderItemId);
        request.input('status', sql.VarChar(20), status);

        await request.query(`
            UPDATE [dbo].[order_items]
            SET status = @status
            WHERE order_item_id = @itemId
        `);
    }

    async updateStatusBulk(orderItemIds, status, transaction = null) {
        if (!orderItemIds || orderItemIds.length === 0) return;

        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('status', sql.VarChar(20), status);
        request.input('itemIds', sql.NVarChar(sql.MAX), orderItemIds.join(','));

        await request.query(`
            UPDATE [dbo].[order_items]
            SET status = @status
            WHERE order_item_id IN (
                SELECT TRY_CAST(value AS INT)
                FROM STRING_SPLIT(@itemIds, ',')
            )
        `);
    }

    /**
     * Cập nhật số lượng OrderItem
     */
    async updateQuantity(orderItemId, newQuantity, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();

        request.input('itemId', sql.Int, orderItemId);
        request.input('quantity', sql.Int, newQuantity);

        await request.query(`
            UPDATE [dbo].[order_items]
            SET quantity = @quantity
            WHERE order_item_id = @itemId
        `);
    }

    /**
     * Cập nhật task_id cho các OrderItem theo order_id và dish_id
     */
    async updateTaskIdByOrderAndDish(orderId, dishId, taskId, transaction) {
        const request = new sql.Request(transaction);
        request.input('orderId', sql.Int, orderId);
        request.input('dishId', sql.Int, dishId);
        request.input('taskId', sql.Int, taskId);

        await request.query(`
            UPDATE [dbo].[order_items]
            SET task_id = @taskId
            WHERE order_id = @orderId AND dish_id = @dishId
        `);
    }

    /**
     * Xóa các OrderItem theo order_id
     */
    async deleteByOrderId(orderId, transaction) {
        const request = new sql.Request(transaction);
        request.input('orderId', sql.Int, orderId);

        await request.query(`
            DELETE FROM [dbo].[order_items]
            WHERE order_id = @orderId
        `);
    }

    // src/repositories/orderItem.repo.js

    /**
     * ✅ MỚI: Tìm các OrderItem theo order_id CÓ KÈM GIÁ TIỀN từ bảng dishes
     */
    async findByOrderIdWithPrice(orderId) {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('orderId', sql.Int, orderId);
        
        const result = await request.query(`
            SELECT 
                oi.order_item_id,
                oi.order_id,
                oi.dish_id,
                oi.quantity,
                oi.note,
                oi.status,
                oi.task_id,
                oi.created_at,
                d.name AS dish_name,
                d.price,
                d.image_url,
                t.started_at,
                t.completed_at
            FROM [dbo].[order_items] oi
            INNER JOIN [dbo].[dishes] d ON oi.dish_id = d.dish_id
            LEFT JOIN [dbo].[cook_tasks] t ON oi.task_id = t.task_id
            WHERE oi.order_id = @orderId
            ORDER BY oi.order_item_id ASC
        `);
        
        // Bẫy kiểm tra an toàn phòng vệ nếu module bị load chậm hoặc lỗi require chéo
        const ActualConstructor = typeof OrderItem === 'function' ? OrderItem : module.parent.require('../entities/OrderItem');
        return result.recordset.map(row => new ActualConstructor(row));
    }

    /**
     * ✅ MỚI: Tìm các OrderItem theo danh sách order_id CÓ KÈM GIÁ TIỀN
     */
    async findByOrderIdListWithPrice(orderIdList) {
        if (!orderIdList || orderIdList.length === 0) return [];
        const pool = await poolPromise;
        const request = pool.request();
        request.input('orderIds', sql.NVarChar(sql.MAX), orderIdList.join(','));
        
        const result = await request.query(`
            SELECT 
                oi.order_item_id,
                oi.order_id,
                oi.dish_id,
                oi.quantity,
                oi.note,
                oi.status,
                oi.task_id,
                oi.created_at,
                d.name AS dish_name,
                d.price,
                d.image_url
            FROM [dbo].[order_items] oi
            INNER JOIN [dbo].[dishes] d ON oi.dish_id = d.dish_id
            WHERE oi.order_id IN (
                SELECT TRY_CAST(value AS INT)
                FROM STRING_SPLIT(@orderIds, ',')
            )
            ORDER BY oi.order_id, oi.order_item_id ASC
        `);
        
        const ActualConstructor = typeof OrderItem === 'function' ? OrderItem : module.parent.require('../entities/OrderItem');
        return result.recordset.map(row => new ActualConstructor(row));
    }

    
}

module.exports = new OrderItemRepository();