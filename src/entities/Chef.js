// src/entities/Chef.js

/**
 * Lớp Thực Thể Chef (Entity Layer)
 */
class Chef {
    /**
     * @param {Object} data - Nhận object chứa dữ liệu đầu bếp thô từ DB
     */
    constructor(data) {
        if (!data) return;

        // Bẫy lỗi mapping: Thử lấy chef_id trước, nếu không có thì thử lấy id, cuối cùng mới fallback về 0
        this.chef_id = data.chef_id !== undefined ? data.chef_id : (data.id !== undefined ? data.id : 0);
        
        // 🧹 CHỦ ĐỘNG LÀM SẠCH: Loại bỏ khoảng trắng thừa phát sinh từ kiểu dữ liệu cố định của SQL Server (CHAR/NCHAR)
        this.name = data.name ? data.name.trim() : '';
        this.password_hash = data.password_hash ? data.password_hash.trim() : '';
        
        const upperRole = data.role ? data.role.toUpperCase() : 'CHEF';
        this.role = (upperRole === 'HEAD_CHEF' || upperRole === 'CHEF') ? upperRole : 'CHEF';
        this.is_active = data.is_active !== undefined ? !!data.is_active : true;
        this.created_at = data.created_at ? new Date(data.created_at) : new Date();
    }

    /**
     * Xuất bản Object sạch để phản hồi API (đã loại bỏ mật khẩu bảo mật)
     */
    toSafeObject() {
        return {
            chef_id: Number(this.chef_id), // Ép kiểu số nguyên chắc chắn
            name: this.name,
            role: this.role,
            is_active: this.is_active,
            created_at: this.created_at
        };
    }
}

module.exports = Chef;