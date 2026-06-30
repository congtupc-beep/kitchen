const { poolPromise } = require('../../config/database');
const sql = require('mssql');
const cookTaskRepo = require('../repositories/cookTask.repo');
const orderRepo = require('../repositories/order.repo');
const orderItemRepo = require('../repositories/orderItem.repo');
const notificationService = require('./notification.service');
const AppError = require('../utils/AppError');
const constants = require('../utils/constants');

class KitchenService {
    
    /**
     * 🆕 1. LẤY DANH SÁCH TASK THEO ĐẦU BẾP (KHÔNG LỌC TRẠNG THÁI)
     */
    async getTasksByChef(chefId) {
        const tasks = chefId ? await cookTaskRepo.findByChefId(chefId) : await cookTaskRepo.findAllTasks();
        return tasks.map(task => (typeof task.toSafeObject === 'function') ? task.toSafeObject() : task);
    }

    /**
     * 🆕 2. LẤY DANH SÁCH TASK THEO ĐẦU BẾP VÀ TRẠNG THÁI
     */
    async getTasksByChefAndStatus(chefId, status) {
        const tasks = chefId
            ? await cookTaskRepo.findTasksByChefAndStatus(chefId, status)
            : await cookTaskRepo.findTasksByStatus(status);
        return tasks.map(task => (typeof task.toSafeObject === 'function') ? task.toSafeObject() : task);
    }

    /**
     * 🆕 3. LẤY CHI TIẾT TASK
     */
    async getTaskById(taskId) {
        const task = await cookTaskRepo.findById(taskId);
        if (!task) throw new AppError('Không tìm thấy tác vụ!', 404);
        return (typeof task.toSafeObject === 'function') ? task.toSafeObject() : task;
    }

    /**
     * 🆕 4. BẮT ĐẦU TASK (WAITING → COOKING)
     */
    async startTask(taskId, chefId) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        let transactionBegan = false;
        let updatedTask = null;
        let orderIdsToProcess = [];

        try {
            await transaction.begin();
            transactionBegan = true;

            const task = await cookTaskRepo.findById(taskId, transaction);
            if (!task) throw new AppError('Không tìm thấy tác vụ!', 404);
            if (task.status === constants.TASK_STATUS.COOKING) throw new AppError('Tác vụ đang được chế biến!', 400);
            if (task.status !== constants.TASK_STATUS.WAITING) {
                throw new AppError(`Tác vụ đang ở trạng thái ${task.status}, không thể bắt đầu!`, 400);
            }

            const rowsAffected = await cookTaskRepo.updateStartedAt(taskId, chefId, transaction);
            if (rowsAffected === 0) {
                throw new AppError('Không thể bắt đầu tác vụ, có thể đã bị nhận bởi người khác!', 409);
            }

            const linkedItems = await orderItemRepo.findByTaskId(taskId, transaction);
            orderIdsToProcess = [...new Set(linkedItems.map(item => item.order_id))];

            if (linkedItems.length > 0) {
                const itemIds = linkedItems.map(item => item.order_item_id);
                await orderItemRepo.updateStatusBulk(itemIds, constants.TASK_STATUS.COOKING, transaction);
            }

            for (const orderId of orderIdsToProcess) {
                const order = await orderRepo.findById(orderId, transaction);
                if (order && order.status === constants.ORDER_STATUS.PENDING) {
                    await orderRepo.updateStatus(orderId, constants.ORDER_STATUS.PROCESSING, transaction);
                }
            }

            updatedTask = await cookTaskRepo.findById(taskId, transaction);
            await transaction.commit();

        } catch (error) {
            if (transactionBegan) {
                try { await transaction.rollback(); } catch (err) { console.error('[Rollback Error]:', err.message); }
            }
            if (error instanceof AppError) throw error;
            console.error('[startTask Error]:', error.message);
            throw new AppError('Lỗi hệ thống khi bắt đầu nấu', 500);
        }

        if (global.io && updatedTask) {
            try {
                const safeTaskData = (typeof updatedTask.toSafeObject === 'function') ? updatedTask.toSafeObject() : updatedTask;
                notificationService.emitTaskUpdated(global.io, {
                    ...safeTaskData,
                    affected_order_ids: orderIdsToProcess
                });
                orderIdsToProcess.forEach(orderId => {
                    notificationService.emitOrderUpdated(global.io, {
                        order_id: orderId,
                        status: constants.ORDER_STATUS.PROCESSING,
                        message: 'Đơn hàng đang được chế biến.'
                    });
                });
            } catch (err) { console.error('[Socket Warning]:', err.message); }
        }

        return (typeof updatedTask.toSafeObject === 'function') ? updatedTask.toSafeObject() : updatedTask;
    }

    /**
     * ✅ 5. HOÀN THÀNH TASK (COOKING → DONE)
     * Chỉ đầu bếp đang giữ task (assigned_chef_id) mới được hoàn thành,
     * trừ HEAD_CHEF có thể hoàn thành bất kỳ task nào.
     */
    async completeTask(taskId, chefId, chefRole) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        let orderIdsToVerify = [];
        let completedOrderIds = []; 
        let updatedTask = null;
        let transactionBegan = false;

        try {
            await transaction.begin();
            transactionBegan = true; 
            
            const task = await cookTaskRepo.findById(taskId, transaction);

            if (!task) throw new AppError('Không tìm thấy tác vụ nấu ăn!', 404);
            if (task.status === constants.TASK_STATUS.DONE) throw new AppError('Tác vụ đã hoàn thành trước đó!', 400);
            if (task.status !== constants.TASK_STATUS.COOKING) {
                throw new AppError(`Tác vụ đang ở trạng thái ${task.status}, không thể hoàn thành!`, 400);
            }

            // ✅ Kiểm tra quyền: chỉ đầu bếp đang nắm task mới được hoàn thành
            // HEAD_CHEF được phép hoàn thành bất kỳ task nào
            if (chefId && chefRole !== constants.ROLE.HEAD_CHEF) {
                if (task.assigned_chef_id && Number(task.assigned_chef_id) !== Number(chefId)) {
                    throw new AppError('Bạn không có quyền hoàn thành món này. Món đang được nấu bởi đầu bếp khác!', 403);
                }
            }

            const rowsAffected = await cookTaskRepo.updateCompletedAt(taskId, transaction);
            if (rowsAffected === 0) {
                throw new AppError('Cập nhật tác vụ thất bại hoặc trạng thái đã bị thay đổi bởi người khác!', 409);
            }

            const linkedItems = await orderItemRepo.findByTaskId(taskId, transaction);
            orderIdsToVerify = [...new Set(linkedItems.map(item => item.order_id))];

            if (linkedItems.length > 0) {
                const itemIds = linkedItems.map(item => item.order_item_id);
                await orderItemRepo.updateStatusBulk(itemIds, constants.TASK_STATUS.DONE, transaction);
            }

            if (orderIdsToVerify.length > 0) {
                const allItems = await orderItemRepo.findByOrderIdList(orderIdsToVerify, transaction);
                const itemsByOrder = {};
                
                allItems.forEach(item => {
                    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
                    itemsByOrder[item.order_id].push(item);
                });

                for (const orderId of orderIdsToVerify) {
                    const items = itemsByOrder[orderId] || [];
                    const isAllItemsDone = items.every(item => 
                        item.status === constants.TASK_STATUS.DONE || 
                        item.status === constants.TASK_STATUS.CANCELLED
                    );

                    if (isAllItemsDone) {
                        const order = await orderRepo.findById(orderId, transaction);
                        if (order &&
                            order.status !== constants.ORDER_STATUS.DONE &&
                            order.status !== constants.ORDER_STATUS.CANCELLED) {

                            await orderRepo.updateStatus(orderId, constants.ORDER_STATUS.DONE, transaction);
                            completedOrderIds.push(orderId); 
                        }
                    }
                }
            }

            updatedTask = await cookTaskRepo.findById(taskId, transaction);
            await transaction.commit();

        } catch (error) {
            if (transactionBegan) {
                try { await transaction.rollback(); } catch (rollbackErr) { console.error('[Rollback Error]:', rollbackErr.message); }
            }
            if (error instanceof AppError) throw error;
            console.error('[completeTask Error]:', error.message);
            throw new AppError('Lỗi hệ thống khi hoàn thành nấu', 500);
        }

        if (global.io) {
            try {
                for (const orderId of completedOrderIds) {
                    notificationService.emitOrderUpdated(global.io, {
                        order_id: orderId,
                        status: constants.ORDER_STATUS.DONE,
                        message: 'Đơn hàng đã hoàn thành!'
                    });
                }

                if (updatedTask) {
                    const safeTaskData = (typeof updatedTask.toSafeObject === 'function') ? updatedTask.toSafeObject() : updatedTask;
                    notificationService.emitTaskUpdated(global.io, {
                        ...safeTaskData,
                        affected_order_ids: orderIdsToVerify
                    });
                }
            } catch (socketErr) {
                console.error('[Socket Warning]: Lỗi phát tín hiệu realtime nhưng DB đã lưu thành công:', socketErr.message);
            }
        }

        return updatedTask;
    }
}

module.exports = new KitchenService();