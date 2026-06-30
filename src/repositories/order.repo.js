// src/repositories/order.repo.js
const { poolPromise, sql } = require('../../config/database');
const Order = require('../entities/Order');
const constants = require('../utils/constants');

class OrderRepository {
    async create(orderData, transaction) {
        console.log('🔵 [orderRepo.create] ===== BẮT ĐẦU =====');
        console.log('🔵 [orderRepo.create] orderData:', JSON.stringify(orderData));
        console.log('🔵 [orderRepo.create] transaction:', transaction ? 'Có' : 'Không');
        
        try {
            const pool = await poolPromise;
            const request = transaction ? new sql.Request(transaction) : pool.request();
            
            request.input('table_id', sql.NVarChar(50), orderData.table_id);
            request.input('guest_count', sql.Int, orderData.guest_count);
            request.input('status', sql.VarChar(20), orderData.status);
            request.input('note', sql.NVarChar(sql.MAX), orderData.note);

            const sqlQuery = `
                INSERT INTO [dbo].[orders] 
                    (table_id, guest_count, status, note, created_at)
                VALUES 
                    (@table_id, @guest_count, @status, @note, GETDATE());
                SELECT SCOPE_IDENTITY() AS order_id;
            `;
            
            console.log('🔵 [orderRepo.create] Câu lệnh SQL:', sqlQuery);
            console.log('🔵 [orderRepo.create] Đang thực thi...');
            
            const result = await request.query(sqlQuery);
            
            console.log('✅ [orderRepo.create] Thành công!');
            console.log('✅ [orderRepo.create] result.recordset:', result.recordset);
            
            const orderId = result.recordset[0].order_id;
            console.log('✅ [orderRepo.create] order_id:', orderId);
            console.log('🔵 [orderRepo.create] ===== KẾT THÚC =====');
            
            return orderId;
        } catch (error) {
            console.error('❌ [orderRepo.create] LỖI:', error.message);
            console.error('❌ [orderRepo.create] Stack:', error.stack);
            throw error;
        }
    }

    async findById(orderId, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        const result = await request
            .input('orderId', sql.Int, orderId)
            .query(`SELECT * FROM [dbo].[orders] WHERE order_id = @orderId`);
        
        return result.recordset[0] ? new Order(result.recordset[0]) : null;
    }

    /**
     * 🛡️ Tìm kiếm Order và Lock Row bằng UPDLOCK, ROWLOCK trong Transaction
     * Giúp chống trùng lặp / race condition khi nhiều bếp cùng hoàn thành món của 1 đơn hàng cùng lúc
     */
    async findByIdWithLock(orderId, transaction) {
        if (!transaction) {
            throw new Error('[findByIdWithLock] Yêu cầu phải có một Transaction hợp lệ để thực hiện Lock!');
        }
        const request = new sql.Request(transaction);
        const result = await request
            .input('orderId', sql.Int, orderId)
            .query(`
                SELECT * FROM [dbo].[orders] 
                WITH (UPDLOCK, ROWLOCK) 
                WHERE order_id = @orderId
            `);
        
        return result.recordset[0] ? new Order(result.recordset[0]) : null;
    }

    async findPendingOrders() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM [dbo].[orders] 
            WHERE status = '${constants.ORDER_STATUS.PENDING}' 
            ORDER BY created_at DESC
        `);
        return result.recordset.map(row => new Order(row));
    }

    async findRecentOrders(limit = 50) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`SELECT TOP (@limit) * FROM [dbo].[orders] ORDER BY created_at DESC`);
        return result.recordset.map(row => new Order(row));
    }

    async updateStatus(orderId, status, transaction = null) {
        const pool = await poolPromise;
        const request = transaction ? new sql.Request(transaction) : pool.request();
        
        request.input('orderId', sql.Int, orderId);
        request.input('status', sql.VarChar(20), status);

        let updateSql = `UPDATE [dbo].[orders] SET status = @status, updated_at = GETDATE()`;

        if (status === constants.ORDER_STATUS.PROCESSING) {
            updateSql += `, started_at = ISNULL(started_at, GETDATE())`;
        }

        if (status === constants.ORDER_STATUS.DONE) {
            updateSql += `, started_at = ISNULL(started_at, GETDATE()), completed_at = GETDATE()`;
        }

        updateSql += ` WHERE order_id = @orderId`;

        await request.query(updateSql);
    }
}

module.exports = new OrderRepository();