class OrderItem {
    constructor(data) {
        if (!data) return;
        this.order_item_id = data.order_item_id !== undefined ? data.order_item_id : 0;
        this.order_id = data.order_id ? Number(data.order_id) : 0;
        this.dish_id = data.dish_id ? Number(data.dish_id) : 0;
        this.quantity = data.quantity ? Math.max(1, parseInt(data.quantity, 10)) : 1;
        this.note = data.note ? String(data.note).trim() : '';
        this.status = data.status ? String(data.status).toUpperCase().trim() : 'WAITING';
        this.task_id = data.task_id !== undefined ? data.task_id : null;
        this.created_at = data.created_at ? new Date(data.created_at) : new Date();
        this.started_at = data.started_at ? new Date(data.started_at) : null;
        this.completed_at = data.completed_at ? new Date(data.completed_at) : null;
        
        // ✅ THÊM: Field price và ảnh món từ bảng dishes (không lưu vào DB)
        this.price = data.price ? Number(data.price) : 0;
        this.dish_name = data.dish_name || '';
        this.image_url = data.image_url ? String(data.image_url).trim() : '';
    }

    isAllergy() {
        const lowerNote = this.note.toLowerCase();
        return lowerNote.includes('dị ứng') || lowerNote.includes('di ung') || lowerNote.includes('allergy');
    }

    updateStatus(status) {
        const validStatuses = ['WAITING', 'COOKING', 'DONE', 'CANCELLED'];
        if (validStatuses.includes(status.toUpperCase())) {
            this.status = status.toUpperCase();
        }
    }

    toSafeObject() {
        return {
            order_item_id: Number(this.order_item_id),
            order_id: Number(this.order_id),
            dish_id: Number(this.dish_id),
            dish_name: this.dish_name,  // ✅ THÊM
            quantity: Number(this.quantity),
            price: Number(this.price),   // ✅ THÊM
            image_url: this.image_url,
            note: this.note,
            status: this.status,
            task_id: this.task_id,
            started_at: this.started_at,
            completed_at: this.completed_at,
            is_allergy: this.isAllergy(),
            created_at: this.created_at
        };
    }
}

module.exports = OrderItem;