// src/entities/CookTask.js
class CookTask {
    constructor(data) {
        if (!data) return;
        this.task_id = data.task_id !== undefined ? data.task_id : 0;
        this.dish_id = data.dish_id ? Number(data.dish_id) : 0;
        this.dish_name = data.dish_name ? String(data.dish_name).trim() : '';
        this.total_quantity = data.total_quantity ? Number(data.total_quantity) : 0;
        this.table_ids = data.table_ids ? String(data.table_ids).trim() : '';
        this.notes = data.notes ? String(data.notes).trim() : '';
        this.assigned_chef_id = data.assigned_chef_id ? Number(data.assigned_chef_id) : null;
        this.status = data.status ? String(data.status).toUpperCase().trim() : 'WAITING';
        this.price = data.price !== undefined ? Number(data.price) : 0;
        this.image_url = data.image_url ? String(data.image_url).trim() : '';
        this.created_at = data.created_at ? new Date(data.created_at) : new Date();
        this.started_at = data.started_at ? new Date(data.started_at) : null;
        this.completed_at = data.completed_at ? new Date(data.completed_at) : null;
        this.linkedOrderItems = []; // Lưu danh sách items đi kèm nếu cần
    }

    /**
     * 🛠️ ĐỒNG BỘ CLASS DIAGRAM: Thêm phần tử order item vào danh sách liên kết
     */
    addOrderItem(item) {
        if (item) this.linkedOrderItems.push(item);
    }

    start() {
        this.status = 'COOKING';
        this.started_at = new Date();
    }

    confirm() {
        this.status = 'DONE';
        this.completed_at = new Date();
    }

    /**
     * 🛠️ ĐỒNG BỘ CLASS DIAGRAM: Kiểm tra xem trạng thái task đã xong chưa
     */
    isCompleted() {
        return this.status === 'DONE'; // Check status === 'DONE'
    }

    /**
     * 🛠️ ĐỒNG BỘ CLASS DIAGRAM: Quét từ khóa dị ứng có trong ghi chú tổng hợp không
     */
    hasAllergyNote() {
        if (!this.notes) return false;
        const lower = this.notes.toLowerCase();
        // Quét tất cả từ khóa liên quan đến dị ứng
        return lower.includes('dị ứng') || lower.includes('di ung') || lower.includes('allergy');
    }

    getWaitingTime() {
        // Thời gian chờ: từ lúc tạo đến lúc bắt đầu nấu (hoặc đến hiện tại nếu chưa nấu)
        const end = this.started_at ? this.started_at : new Date();
        return Math.max(0, Math.floor((end - this.created_at) / 1000 / 60)); 
    }

    getCookingTime() {
        // Thời gian nấu: từ lúc bắt đầu nấu đến lúc hoàn thành (hoặc đến hiện tại nếu đang nấu)
        if (!this.started_at) return 0;
        const end = this.completed_at ? this.completed_at : new Date();
        return Math.max(0, Math.floor((end - this.started_at) / 1000 / 60)); 
    }

    toSafeObject() {
        return {
            task_id: Number(this.task_id),
            dish_id: Number(this.dish_id),
            dish_name: this.dish_name,
            total_quantity: Number(this.total_quantity),
            table_ids: this.table_ids,
            notes: this.notes,
            assigned_chef_id: this.assigned_chef_id,
            status: this.status,
            price: this.price,
            image_url: this.image_url,
            has_allergy: this.hasAllergyNote(),
            waiting_time_mins: this.getWaitingTime(),
            cooking_time_mins: this.getCookingTime(),
            // Serialize thành ISO string có Z để frontend parseDate() nhận đúng UTC
            created_at: this.created_at ? this.created_at.toISOString() : null,
            started_at: this.started_at ? this.started_at.toISOString() : null,
            completed_at: this.completed_at ? this.completed_at.toISOString() : null
        };
    }
}
module.exports = CookTask;