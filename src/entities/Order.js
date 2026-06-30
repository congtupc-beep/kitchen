// src/entities/Order.js
const constants = require('../utils/constants');

/**
 * Order Entity - Lớp đối tượng nghiệp vụ cho bảng orders
 * ✅ Đồng bộ: Dùng constants, có isValid() và toSafeObject()
 */
class Order {
    constructor(data = {}) {
        this.order_id = data.order_id || null;
        this.table_id = data.table_id || '';
        this.guest_count = data.guest_count || 1;
        this.status = data.status || constants.ORDER_STATUS.PENDING;
        this.note = data.note || '';
        this.created_at = data.created_at ? new Date(data.created_at) : new Date();
        this.started_at = data.started_at ? new Date(data.started_at) : null;
        this.completed_at = data.completed_at ? new Date(data.completed_at) : null;
        this.updated_at = data.updated_at ? new Date(data.updated_at) : null;
        
        // ✅ Property chứa danh sách OrderItem (chỉ dùng trong service, không lưu DB)
        this.items = data.items || [];
    }

    /**
     * Kiểm tra đơn hàng có hợp lệ không
     */
    isValid() {
        return this.table_id && 
               this.table_id.trim() !== '' && 
               this.guest_count > 0 &&
               this.items && 
               this.items.length > 0;
    }

    /**
     * Chuyển đổi sang object an toàn để trả về API (không chứa thông tin nhạy cảm)
     */
    toSafeObject() {
        return {
            order_id: this.order_id,
            table_id: this.table_id,
            guest_count: this.guest_count,
            status: this.status,
            note: this.note,
            created_at: this.created_at,
            started_at: this.started_at,
            completed_at: this.completed_at,
            updated_at: this.updated_at,
            items: this.items
        };
    }
}

// ✅ QUAN TRỌNG: Export class (KHÔNG phải instance)
module.exports = Order;