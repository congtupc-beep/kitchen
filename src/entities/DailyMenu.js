// src/entities/DailyMenu.js

/**
 * Lớp Thực Thể DailyMenu (Entity Layer)
 */
class DailyMenu {
    /**
     * @param {Object} data - Nhận object chứa dữ liệu thực đơn ngày thô từ DB
     */
    constructor(data) {
        if (!data) return;

        // Bẫy lỗi mapping: Lấy daily_menu_id trước, nếu không có thì lấy id
        this.daily_menu_id = data.daily_menu_id !== undefined ? data.daily_menu_id : (data.id !== undefined ? data.id : 0);
        
        // Định dạng ngày dạng YYYY-MM-DD
        if (data.date) {
            const dateObj = new Date(data.date);
            // Bù đắp múi giờ để không bị lệch ngày khi chuyển sang UTC
            const tzOffset = dateObj.getTimezoneOffset() * 60000;
            const localDate = new Date(dateObj.getTime() - tzOffset);
            this.date = localDate.toISOString().split('T')[0];
        } else {
            this.date = '';
        }
        
        this.created_by = data.created_by !== undefined ? Number(data.created_by) : 0;
        this.is_active = data.is_active !== undefined ? !!data.is_active : false;
        this.created_at = data.created_at ? new Date(data.created_at) : new Date();
        this.updated_at = data.updated_at ? new Date(data.updated_at) : new Date();
    }

    /**
     * Xuất bản Object sạch để phản hồi API
     */
    toSafeObject() {
        return {
            daily_menu_id: Number(this.daily_menu_id),
            date: this.date,
            created_by: this.created_by,
            is_active: this.is_active,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = DailyMenu;