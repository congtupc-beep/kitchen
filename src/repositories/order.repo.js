// src/repositories/order.repo.js
const { poolPromise } = require('../../config/database');

class OrderRepository {
    // 1. Lưu hóa đơn tổng (Order) vào Database
    async createOrder(orderData, transaction) {
        const request = transaction ? transaction.request() : (await poolPromise).request();
        
        const result = await request
            .input('tableId', orderData.tableId)
            .input('guestCount', orderData.guestCount)
            .input('note', orderData.note || null)
            .query(`
                INSERT INTO [dbo].[orders] (table_id, guest_count, status, note, created_at)
                OUTPUT INSERTED.order_id
                VALUES (@tableId, @guestCount, 'PENDING', @note, GETDATE());
            `);
            
        return result.recordset[0].order_id;
    }

    // 2. Lưu chi tiết từng món ăn (OrderItem)
    async createOrderItem(itemData, transaction) {
        const request = transaction ? transaction.request() : (await poolPromise).request();
        
        const result = await request
            .input('orderId', itemData.orderId)
            .input('dishId', itemData.dishId)
            .input('quantity', itemData.quantity)
            .input('note', itemData.note || null)
            .input('taskId', itemData.taskId || null) // FK liên kết sang CookTask của E
            .query(`
                INSERT INTO [dbo].[order_items] (order_id, dish_id, quantity, note, status, task_id, created_at)
                OUTPUT INSERTED.order_item_id
                VALUES (@orderId, @dishId, @quantity, @note, 'WAITING', @taskId, GETDATE());
            `);
            
        return result.recordset[0].order_item_id;
    }

    // 3. Lấy danh sách toàn bộ hóa đơn kèm theo
    async getAllOrders() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT order_id, table_id, guest_count, status, note, created_at 
            FROM [dbo].[orders] 
            ORDER BY created_at DESC
        `);
        return result.recordset;
    }

    // 4. Lấy chi tiết một đơn hàng cụ thể
    async getOrderById(orderId) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('orderId', orderId)
            .query(`
                SELECT order_id, table_id, guest_count, status, note, created_at 
                FROM [dbo].[orders] 
                WHERE order_id = @orderId
            `);
        return result.recordset[0];
    }
}

module.exports = new OrderRepository();
