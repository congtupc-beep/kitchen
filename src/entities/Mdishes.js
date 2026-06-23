class Dish {
    /**
     * @param {Object} data - Dữ liệu thô từ SQL Server
     */
    constructor(data = {}) {
        // ID: Xử lý fallback nếu database trả về tên trường khác nhau
        this.dish_id = data.dish_id ?? data.id ?? 0;
        this.master_menu_id = data.master_menu_id ?? 0;

        // Làm sạch các trường dạng chuỗi (tránh khoảng trắng thừa từ SQL NCHAR)
        this.name = data.name ? data.name.trim() : 'Món ăn không tên';
        this.category = data.category ? data.category.trim() : 'Khác';
        this.description = data.description ? data.description.trim() : '';
        this.image_url = data.image_url ? data.image_url.trim() : '/uploads/default.jpg';

        // Xử lý kiểu số: Đảm bảo luôn là số thực dương
        this.price = parseFloat(data.price) || 0.0;
        
        // Trạng thái
        this.is_active = data.is_active !== undefined ? !!data.is_active : true;
    }

    /**
     * Xuất object sạch, loại bỏ các thông tin nội bộ không cần thiết
     */
    toResponseObject() {
        return {
            dish_id: Number(this.dish_id),
            master_menu_id: Number(this.master_menu_id),
            name: this.name,
            category: this.category,
            price: this.price,
            description: this.description,
            image_url: this.image_url,
            is_active: this.is_active
        };
    }
}

module.exports = Dish;