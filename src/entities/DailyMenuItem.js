// src/entities/DailyMenuItem.js

/**
 * Lớp Thực Thể DailyMenuItem (Entity Layer)
 */
class DailyMenuItem {
    /**
     * @param {Object} data - Nhận object chứa dữ liệu chi tiết thực đơn thô từ DB
     */
    constructor(data) {
        if (!data) return;

        this.item_id = data.item_id !== undefined ? data.item_id : (data.id !== undefined ? data.id : 0);
        this.daily_menu_id = data.daily_menu_id !== undefined ? Number(data.daily_menu_id) : 0;
        this.dish_id = data.dish_id !== undefined ? Number(data.dish_id) : 0;
        
        // Chuẩn hóa trạng thái phục vụ của món ăn
        const statusUpper = data.status ? data.status.toUpperCase().trim() : 'AVAILABLE';
        this.status = (statusUpper === 'AVAILABLE' || statusUpper === 'SOLD_OUT' || statusUpper === 'UNAVAILABLE') ? statusUpper : 'AVAILABLE';
        
        this.added_by = data.added_by !== undefined ? Number(data.added_by) : 0;
        this.updated_at = data.updated_at ? new Date(data.updated_at) : new Date();
        
        // Mở rộng mapping thông tin chi tiết món ăn (phục vụ khi SELECT JOIN với bảng dishes)
        this.dish_name = data.dish_name ? data.dish_name.trim() : (data.name ? data.name.trim() : '');
        this.dish_category = data.dish_category ? data.dish_category.trim() : (data.category ? data.category.trim() : '');
        this.dish_price = data.dish_price !== undefined ? Number(data.dish_price) : (data.price !== undefined ? Number(data.price) : 0);
        this.dish_image_url = data.dish_image_url ? data.dish_image_url.trim() : (data.image_url ? data.image_url.trim() : '');
    }

    /**
     * Xuất bản Object sạch để phản hồi API
     */
    toSafeObject() {
        return {
            item_id: Number(this.item_id),
            daily_menu_id: this.daily_menu_id,
            dish_id: this.dish_id,
            status: this.status,
            added_by: this.added_by,
            updated_at: this.updated_at,
            // Các trường thông tin món ăn kèm theo
            dish_name: this.dish_name,
            dish_category: this.dish_category,
            dish_price: this.dish_price,
            dish_image_url: this.dish_image_url
        };
    }
}

module.exports = DailyMenuItem;