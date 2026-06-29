// src/services/order.service.js
const { poolPromise } = require('../../config/database');
const sql = require('mssql'); // Thư viện kết nối SQL Server
const orderRepo = require('../repositories/order.repo');
const cookTaskRepo = require('../repositories/cookTask.repo'); // Repo do E quản lý
const notificationService = require('./notification.service'); // Socket do E quản lý
const AppError = require('../utils/AppError');

class OrderService {
    async processNewOrder(orderData) {
        const pool = await poolPromise;
        // Khởi tạo Transaction đảm bảo an toàn dữ liệu
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();
            
            // 1. Tạo đơn hàng tổng
            const orderId = await orderRepo.createOrder({
                tableId: orderData.tableId,
                guestCount: orderData.guestCount,
                note: orderData.note
            }, transaction);

            // 2. Duyệt qua từng chi tiết món ăn trong đơn hàng
            for (const item of orderData.items) {
                
                // Lấy thông tin tên món ăn từ cơ sở dữ liệu để đồng bộ sang CookTask
                const dishResult = await transaction.request()
                    .input('dishId', item.dishId)
                    .query('SELECT name FROM [dbo].[dishes] WHERE dish_id = @dishId');
                
                if (dishResult.recordset.length === 0) {
                    throw new AppError(`Món ăn có mã [${item.dishId}] không tồn tại trên hệ thống Master Menu!`, 404);
                }
                const dishName = dishResult.recordset[0].name;

                // 3. Tự động sinh CookTask (Nhiệm vụ nấu ăn) tương ứng cho KDS
                // Gọi thẳng vào hạ tầng lưu trữ cook_tasks do thành viên E thiết kế
                const taskId = await cookTaskRepo.createTask({
                    dishId: item.dishId,
                    dishName: dishName,
                    totalQuantity: item.quantity,
                    tableIds: orderData.tableId, // Lưu vết mã bàn
                    notes: item.note || ''
                }, transaction);

                // 4. Lưu vết OrderItem kèm khóa ngoại taskId vừa sinh ra
                await orderRepo.createOrderItem({
                    orderId: orderId,
                    dishId: item.dishId,
                    quantity: item.quantity,
                    note: item.note,
                    taskId: taskId
                }, transaction);

                // 5. Bắn tín hiệu Realtime qua Socket.io báo cho màn hình bếp của E cập nhật
                notificationService.emitNewTask({
                    taskId: taskId,
                    dishName: dishName,
                    quantity: item.quantity,
                    tableId: orderData.tableId
                });
            }

            // Hoàn tất Transaction thành công
            await transaction.commit();
            return { orderId, status: 'SUCCESS' };

        } catch (error) {
            // Nếu có bất kỳ lỗi nào, hoàn nguyên toàn bộ trạng thái database
            await transaction.rollback();
            throw error;
        }
    }

    async getAllOrders() {
        return await orderRepo.getAllOrders();
    }

    async getOrderDetails(orderId) {
        const order = await orderRepo.getOrderById(orderId);
        if (!order) {
            throw new AppError('Đơn gọi món không tồn tại trên hệ thống!', 404);
        }
        return order;
    }
}

module.exports = new OrderService();
