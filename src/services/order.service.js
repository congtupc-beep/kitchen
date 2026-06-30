// src/services/order.service.js
const { poolPromise } = require('../../config/database');
const sql = require('mssql');
const orderRepo = require('../repositories/order.repo');
const orderItemRepo = require('../repositories/orderItem.repo');
const cookTaskRepo = require('../repositories/cookTask.repo');
const dailyMenuRepo = require('../repositories/dailyMenu.repo');
const notificationService = require('./notification.service');
const Order = require('../entities/Order');
const CookTask = require('../entities/CookTask');
const AppError = require('../utils/AppError');
const constants = require('../utils/constants');

class OrderService {
    constructor() {
        this.simulatorIntervalId = null;
    }

    async processNewOrder(orderInput) {
        console.log(' 🔵  [STEP 0] Bắt đầu processNewOrder');

        const orderEntity = new Order({
            table_id: orderInput.table_id,
            guest_count: orderInput.guest_count || 1,
            status: constants.ORDER_STATUS.PENDING,
            note: orderInput.note || ''
        });
        orderEntity.items = orderInput.items || [];
        if (!orderEntity.isValid()) {
            throw new AppError('Đơn hàng không hợp lệ!', 400);
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            console.log(' ✅  [STEP 1] Transaction bắt đầu');
            
            // 1️. Tạo Order
            console.log(' 🔵  [STEP 2] Đang tạo Order...');
            const orderId = await orderRepo.create(orderEntity.toSafeObject(), transaction);
            console.log(' ✅  [STEP 2] Đã tạo Order ID:', orderId);
            
            // 2️. Kiểm tra Thực đơn hôm nay
            console.log(' 🔵  [STEP 3] Đang lấy DailyMenu...');
            const todayMenu = await dailyMenuRepo.getTodayActiveMenuWithDishes();
            console.log(' ✅  [STEP 3] Lấy được', todayMenu.length, 'món');

            if (todayMenu.length === 0) {
                throw new AppError('Hôm nay nhà hàng chưa có thực đơn!', 400);
            }
            
            const dishMap = {};
            todayMenu.forEach(item => {
                dishMap[item.dish_id] = { name: item.dish_name, price: item.price, category: item.category };
            });
            
            const dishIds = [...new Set(orderInput.items.map(item => item.dish_id))];
            console.log(' ✅  [STEP 4] dishIds:', dishIds);
            
            const invalidDishIds = dishIds.filter(id => !dishMap[id]);
            if (invalidDishIds.length > 0) {
                throw new AppError(`Các món sau KHÔNG CÓ trong thực đơn hôm nay: ${invalidDishIds.join(', ')}`, 400);
            }
            console.log(' ✅  [STEP 5] Tất cả món hợp lệ');
            
            // 3️. GOM NHÓM TRONG JAVASCRIPT
            console.log(' 🔵  [STEP 6] Đang gom nhóm món ăn...');
            const dishAggregation = {};
            for (const item of orderInput.items) {
                const dishName = dishMap[item.dish_id].name;
                if (!dishAggregation[item.dish_id]) {
                    dishAggregation[item.dish_id] = {
                        dish_id: item.dish_id,
                        dish_name: dishName,
                        total_quantity: 0,
                        tables: [],
                        notes: []
                    };
                }
                dishAggregation[item.dish_id].total_quantity += item.quantity;
                if (!dishAggregation[item.dish_id].tables.includes(orderEntity.table_id)) {
                    dishAggregation[item.dish_id].tables.push(orderEntity.table_id);
                }
                if (item.note && item.note.trim() !== '') {
                    dishAggregation[item.dish_id].notes.push(`[${orderEntity.table_id}]: ${item.note.trim()}`);
                    const lowerNote = item.note.toLowerCase();
                    if (lowerNote.includes('dị ứng') || lowerNote.includes('di ung') || lowerNote.includes('allergy')) {
                        notificationService.emitAllergyAlert(global.io, {
                            table_id: orderEntity.table_id,
                            dish_name: dishName,
                            note: item.note
                        });
                    }
                }
            }
            console.log(' ✅  [STEP 6] Đã gom nhóm:', Object.keys(dishAggregation).length, 'món');
            
            // 4️. TẠO COOKTASK - CÓ CƠ CHẾ GỘP THÔNG MINH
            console.log(' 🔵  [STEP 7] Đang xử lý CookTask...');
            const taskMap = {};
            for (const dishId in dishAggregation) {
                const agg = dishAggregation[dishId];
                console.log(`    📝  [STEP 7] Xử lý dish_id ${dishId}`);

                // 🔍 KIỂM TRA TASK CÓ THỂ GỘP (Truyền chuẩn transaction để tránh xung đột khóa)
                const existingTask = await cookTaskRepo.findMergeableTask(agg.dish_id, 5, transaction);

                if (existingTask) {
                    // ✅ GỘP VÀO TASK CŨ
                    console.log(`    🔀  [STEP 7] Gộp vào CookTask ID ${existingTask.task_id} (hiện có ${existingTask.total_quantity})`);

                    await cookTaskRepo.mergeQuantity(
                        existingTask.task_id,
                        agg.total_quantity,
                        agg.tables.join(','),
                        agg.notes.join(' | '),
                        transaction
                    );

                    taskMap[agg.dish_id] = existingTask.task_id;
                    console.log(`    ✅  [STEP 7] Đã gộp thành công! Tổng số lượng mới: ${existingTask.total_quantity + agg.total_quantity}`);

                    // 🛑 SỬA LỖI TIMEOUT: Bắt buộc truyền transaction vào để đọc dữ liệu đang lock
                    const updatedTask = await cookTaskRepo.findById(existingTask.task_id, transaction);
                    if (updatedTask) {
                        notificationService.emitTaskUpdated(global.io, updatedTask.toSafeObject());
                    }
                } else {
                    // ✅ TẠO TASK MỚI
                    console.log(`    🆕  [STEP 7] Tạo CookTask mới cho dish_id ${dishId}`);

                    const taskId = await cookTaskRepo.create({
                        dish_id: agg.dish_id,
                        dish_name: agg.dish_name,
                        total_quantity: agg.total_quantity,
                        table_ids: agg.tables.join(','),
                        notes: agg.notes.join(' | '),
                        status: constants.TASK_STATUS.WAITING
                    }, transaction);

                    taskMap[agg.dish_id] = taskId;
                    console.log(`    ✅  [STEP 7] Đã tạo CookTask ID ${taskId}`);

                    const savedTask = new CookTask({
                        task_id: taskId,
                        dish_id: agg.dish_id,
                        dish_name: agg.dish_name,
                        total_quantity: agg.total_quantity,
                        table_ids: agg.tables.join(','),
                        notes: agg.notes.join(' | '),
                        status: constants.TASK_STATUS.WAITING,
                        created_at: new Date()
                    });
                    notificationService.emitNewTask(global.io, savedTask.toSafeObject());
                }
            }
            console.log(' ✅  [STEP 7] Đã xử lý tất cả CookTask');
            
            // 5️. TẠO ORDERITEM (CON)
            console.log(' 🔵  [STEP 8] Đang tạo OrderItem...');
            for (const item of orderInput.items) {
                console.log(`    📝  [STEP 8] Tạo OrderItem cho dish_id ${item.dish_id}`);
                await orderItemRepo.create({
                    order_id: orderId,
                    dish_id: item.dish_id,
                    quantity: item.quantity,
                    note: item.note || '',
                    status: constants.TASK_STATUS.WAITING,
                    task_id: taskMap[item.dish_id]
                }, transaction);
                console.log(`    ✅  [STEP 8] Đã tạo OrderItem`);
            }
            console.log(' ✅  [STEP 8] Đã tạo tất cả OrderItem');
            
            console.log(' 🔵  [STEP 9] Đang commit transaction...');
            await transaction.commit();
            console.log(' ✅  [STEP 9] Transaction commit thành công');
            
            const savedOrder = await orderRepo.findById(orderId);
            if (savedOrder) {
                notificationService.emitNewOrder(global.io, savedOrder.toSafeObject());
            }
            console.log(' 🎉  [STEP 10] Hoàn tất processNewOrder');
            return { order_id: orderId, message: 'Tiếp nhận đơn hàng thành công.' };
            
        } catch (error) {
            console.error(' ❌  [ERROR] Đang rollback transaction...');
            await transaction.rollback();
            console.error(' ❌  [ERROR] Đã rollback');

            if (error instanceof AppError) throw error;
            console.error(' ❌  [ERROR] Chi tiết:', error.message);
            console.error(' ❌  [ERROR] Stack:', error.stack);
            throw new AppError('Lỗi hệ thống khi xử lý đơn hàng', 500);
        }
    }

    async getOrderById(orderId) {
    console.log(`🔵 [getOrderById] Bắt đầu lấy order #${orderId}...`);
    
    const order = await orderRepo.findById(orderId);
    if (!order) {
        console.error(`❌ [getOrderById] Không tìm thấy order #${orderId}`);
        throw new AppError('Không tìm thấy đơn hàng!', 404);
    }
    
    // ✅ SỬA: Dùng method mới có giá tiền
    const items = await orderItemRepo.findByOrderIdWithPrice(orderId);
    console.log(`✅ [getOrderById] Lấy được ${items.length} món`);
    
    const safeOrder = order.toSafeObject();
    safeOrder.items = items.map(i => {
        const safeItem = i.toSafeObject();
        safeItem.price = i.price || 0;
        safeItem.dish_name = i.dish_name || 'Món ' + i.dish_id;
        safeItem.subtotal = (i.price || 0) * i.quantity;
        return safeItem;
    });

    this.normalizeOrderTimestamps(safeOrder, safeOrder.items);
    
    // Tính tổng tiền order
    safeOrder.total_amount = safeOrder.items.reduce((sum, item) => {
        return sum + (item.subtotal || 0);
    }, 0);
    
    console.log(`✅ [getOrderById] Tổng tiền: ${safeOrder.total_amount}đ`);
    return safeOrder;
}

    async getPendingOrders() {
        const orders = await orderRepo.findPendingOrders();
        return orders.map(o => o.toSafeObject());
    }

    normalizeOrderTimestamps(order, items) {
        if (!order || !items) return;

        const itemStartedAt = items
            .map(item => item.started_at)
            .filter(date => date instanceof Date && !Number.isNaN(date.getTime()));

        const itemCompletedAt = items
            .map(item => item.completed_at)
            .filter(date => date instanceof Date && !Number.isNaN(date.getTime()));

        if (!order.started_at && itemStartedAt.length > 0) {
            order.started_at = new Date(Math.min(...itemStartedAt.map(d => d.getTime())));
        }

        if (!order.completed_at && itemCompletedAt.length > 0) {
            order.completed_at = new Date(Math.max(...itemCompletedAt.map(d => d.getTime())));
        }

        if (!order.updated_at) {
            order.updated_at = order.completed_at || order.started_at || order.created_at;
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        const order = await orderRepo.findById(orderId);
        if (!order) throw new AppError('Không tìm thấy đơn hàng!', 404);
        if (order.status === constants.ORDER_STATUS.DONE) {
            throw new AppError('Không thể thay đổi trạng thái đơn hàng đã hoàn thành!', 400);
        }
        if (order.status === constants.ORDER_STATUS.CANCELLED) {
            throw new AppError('Không thể thay đổi trạng thái đơn hàng đã bị hủy!', 400);
        }
        if (order.status === newStatus) {
            return { order_id: orderId, status: newStatus, message: 'Trạng thái đơn hàng đã được giữ nguyên.' };
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        let message = 'Cập nhật trạng thái đơn hàng thành công.';

        try {
            await transaction.begin();

            const items = await orderItemRepo.findByOrderId(orderId);
            const taskIdList = [...new Set(items.map(item => item.task_id).filter(id => id != null))];

            await orderRepo.updateStatus(orderId, newStatus, transaction);

            if (newStatus === constants.ORDER_STATUS.PROCESSING) {
                const waitingItemIds = items
                    .filter(item => item.status === constants.TASK_STATUS.WAITING)
                    .map(item => item.order_item_id);

                if (waitingItemIds.length > 0) {
                    await orderItemRepo.updateStatusBulk(waitingItemIds, constants.TASK_STATUS.COOKING, transaction);
                }

                if (taskIdList.length > 0) {
                    const tasks = await cookTaskRepo.findByTaskIdList(taskIdList);
                    for (const task of tasks) {
                        if (task.status === constants.TASK_STATUS.WAITING) {
                            await cookTaskRepo.updateStatus(task.task_id, constants.TASK_STATUS.COOKING, transaction);
                        }
                    }
                }
            }

            if (newStatus === constants.ORDER_STATUS.DONE) {
                const pendingItemIds = items
                    .filter(item => item.status !== constants.TASK_STATUS.DONE && item.status !== constants.TASK_STATUS.CANCELLED)
                    .map(item => item.order_item_id);

                if (pendingItemIds.length > 0) {
                    await orderItemRepo.updateStatusBulk(pendingItemIds, constants.TASK_STATUS.DONE, transaction);
                }

                for (const taskId of taskIdList) {
                    const linkedItems = await orderItemRepo.findByTaskId(taskId, transaction);
                    const allDone = linkedItems.every(item =>
                        item.status === constants.TASK_STATUS.DONE || item.status === constants.TASK_STATUS.CANCELLED
                    );

                    if (allDone) {
                        await cookTaskRepo.updateStatus(taskId, constants.TASK_STATUS.DONE, transaction);
                    }
                }
            }

            await transaction.commit();

            if (global.io) {
                notificationService.emitOrderUpdated(global.io, {
                    order_id: orderId,
                    status: newStatus,
                    message: `Đơn hàng chuyển sang trạng thái ${newStatus}.`
                });
            }

            return { order_id: orderId, status: newStatus, message };
        } catch (error) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            console.error('[updateOrderStatus Error]:', error.message);
            throw new AppError('Lỗi hệ thống khi cập nhật trạng thái đơn hàng', 500);
        }
    }


async getRecentOrders(limit = 50) {
    console.log('🔵 [getRecentOrders] Bắt đầu lấy danh sách orders...');
    
    const orders = await orderRepo.findRecentOrders(limit);
    console.log('🔵 [getRecentOrders] Lấy được', orders.length, 'orders');
    
    // ✅ SỬA: Load items CÓ GIÁ TIỀN cho từng order
    const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
            try {
                const items = await orderItemRepo.findByOrderIdWithPrice(order.order_id);
                const safeOrder = order.toSafeObject();
                safeOrder.items = items.map(i => {
                    const safeItem = i.toSafeObject();
                    safeItem.price = i.price || 0;
                    safeItem.dish_name = i.dish_name || 'Món ' + i.dish_id;
                    safeItem.subtotal = (i.price || 0) * i.quantity;
                    return safeItem;
                });
                
                this.normalizeOrderTimestamps(safeOrder, safeOrder.items);
                
                // Tính tổng tiền
                safeOrder.total_amount = safeOrder.items.reduce((sum, item) => {
                    return sum + (item.subtotal || 0);
                }, 0);
                
                console.log(`✅ [getRecentOrders] Order #${order.order_id} có ${items.length} món, tổng: ${safeOrder.total_amount}đ`);
                return safeOrder;
            } catch (error) {
                console.error(`❌ [getRecentOrders] Lỗi load items order #${order.order_id}:`, error.message);
                const safeOrder = order.toSafeObject();
                safeOrder.items = [];
                safeOrder.total_amount = 0;
                return safeOrder;
            }
        })
    );
    
    console.log('✅ [getRecentOrders] Hoàn tất!');
    return ordersWithItems;
}

    async cancelOrder(orderId) {
        const order = await orderRepo.findById(orderId);
        if (!order) throw new AppError('Không tìm thấy đơn hàng!', 404);
        if (order.status === constants.ORDER_STATUS.DONE) throw new AppError('Không thể hủy đơn hàng đã hoàn thành!', 400);
        if (order.status === constants.ORDER_STATUS.CANCELLED) throw new AppError('Đơn hàng đã bị hủy trước đó!', 400);
        
        const items = await orderItemRepo.findByOrderId(orderId);
        const taskIdList = [...new Set(items.map(i => i.task_id).filter(id => id != null))];
        if (taskIdList.length > 0) {
            const tasks = await cookTaskRepo.findByTaskIdList(taskIdList);
            const problematicTasks = tasks.filter(t => t.status === constants.TASK_STATUS.COOKING || t.status === constants.TASK_STATUS.DONE);
            if (problematicTasks.length > 0) {
                const details = problematicTasks.map(t => `Task #${t.task_id} (${t.dish_name}) đang ${t.status}`).join('; ');
                throw new AppError(`Không thể hủy đơn vì bếp đang xử lý: ${details}`, 400);
            }
        }
        
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();
            await orderRepo.updateStatus(orderId, constants.ORDER_STATUS.CANCELLED, transaction);
            for (const item of items) {
                await orderItemRepo.updateStatus(item.order_item_id, constants.TASK_STATUS.CANCELLED, transaction);
            }
            if (taskIdList.length > 0) {
                await cookTaskRepo.cancelTasksByTaskIdList(taskIdList, transaction);
            }
            await transaction.commit();
            notificationService.emitOrderCancelled(global.io, { order_id: orderId, status: constants.ORDER_STATUS.CANCELLED });
            notificationService.emitOrderUpdated(global.io, { order_id: orderId, status: constants.ORDER_STATUS.CANCELLED, message: 'Đơn hàng vừa bị hủy.' });
            return { message: 'Hủy đơn hàng thành công.' };
        } catch (err) {
            await transaction.rollback();
            if (err instanceof AppError) throw err;
            console.error('[cancelOrder Error]:', err.message);
            throw new AppError('Lỗi hệ thống khi hủy đơn hàng', 500);
        }
    }

    startOrderSimulator() {
        if (this.simulatorIntervalId) {
            console.log(' [Simulator] Đã chạy rồi, bỏ qua.');
            return;
        }
        console.log(' 🤖  [Simulator] Khởi chạy bộ giả lập đơn hàng...');
        const runSimulation = async () => {
            try {
                const todayMenu = await dailyMenuRepo.getTodayActiveMenuWithDishes();
                if (todayMenu.length === 0) {
                    console.log(' 🤖  [Simulator] Hôm nay chưa có thực đơn, bỏ qua lượt giả lập.');
                } else {
                    const poolDishIds = todayMenu.map(item => item.dish_id);
                    const tables = ['Bàn 01', 'Bàn 03', 'Bàn 05', 'Bàn VIP 1', 'Sân thượng'];
                    const randomTable = tables[Math.floor(Math.random() * tables.length)];
                    const itemsCount = Math.floor(Math.random() * 3) + 1;
                    const items = [];
                    const shuffled = [...poolDishIds].sort(() => 0.5 - Math.random());
                    const selectedDishIds = shuffled.slice(0, Math.min(itemsCount, poolDishIds.length));
                    for (const randomDishId of selectedDishIds) {
                        const notes = ['', 'Ít cay', 'Không hành', 'Dị ứng hải sản', 'Thêm rau'];
                        items.push({
                            dish_id: randomDishId,
                            quantity: Math.floor(Math.random() * 2) + 1,
                            note: notes[Math.floor(Math.random() * notes.length)]
                        });
                    }
                    await this.processNewOrder({
                        table_id: randomTable,
                        guest_count: Math.floor(Math.random() * 4) + 1,
                        note: 'Đơn từ Bot giả lập.',
                        items
                    });
                }
            } catch (err) {
                console.error(' [Simulator Error]:', err.message);
            }
            const nextInterval = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;
            this.simulatorIntervalId = setTimeout(runSimulation, nextInterval);
        };
        this.simulatorIntervalId = setTimeout(runSimulation, 5000);
    }

    stopOrderSimulator() {
        if (this.simulatorIntervalId) {
            clearTimeout(this.simulatorIntervalId);
            this.simulatorIntervalId = null;
            console.log(' 🛑  [Simulator] Đã dừng.');
        }
    }
}

module.exports = new OrderService();