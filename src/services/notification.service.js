// src/services/notification.service.js
// ✅ SỬA: Hardcode tên event, KHÔNG phụ thuộc constants để tránh lỗi ngầm

class NotificationService {
    emitNewTask(io, taskPayload) {
        if (io) {
            console.log(`📡 [Socket] new_task → Task #${taskPayload.task_id}`);
            io.emit('new_task', taskPayload);
        }
    }

    emitTaskUpdated(io, taskPayload) {
        if (io) {
            console.log(`📡 [Socket] task_updated → Task #${taskPayload.task_id} [${taskPayload.status}]`);
            io.emit('task_updated', taskPayload);
        }
    }

    emitNewOrder(io, orderPayload) {
        if (io) {
            console.log(`📡 [Socket] new_order → Order #${orderPayload.order_id}`);
            io.emit('new_order', orderPayload);
        }
    }

    emitOrderUpdated(io, orderPayload) {
        if (io) {
            console.log(`📡 [Socket] order_updated → Order #${orderPayload.order_id} [${orderPayload.status}]`);
            io.emit('order_updated', orderPayload);
        }
    }

    emitAllergyAlert(io, allergyPayload) {
        if (io) {
            console.log(`🚨 [Socket] allergy_alert → Bàn ${allergyPayload.table_id}: ${allergyPayload.note}`);
            io.emit('allergy_alert', allergyPayload);
        }
    }

    emitOrderCancelled(io, orderPayload) {
        if (io) {
            console.log(`📡 [Socket] order_cancelled → Order #${orderPayload.order_id}`);
            io.emit('order_cancelled', orderPayload);
        }
    }
}

module.exports = new NotificationService();