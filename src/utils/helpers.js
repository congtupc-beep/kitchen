/**
 * Utility helpers - Bộ công cụ hàm tiện ích xử lý dữ liệu dùng chung toàn cục.
 * Giúp các thành viên (B, C, D, E) tái sử dụng mã nguồn nhanh chóng, tránh lặp lại logic.
 */
const helpers = {
    /**
     * Format số tiền sang định dạng tiền tệ Việt Nam (VD: 35000 -> "35.000 đ")
     * @param {number} amount 
     * @returns {string}
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number' && isNaN(Number(amount))) return '0 đ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace('₫', 'đ');
    },

    /**
     * Format Date sang chuỗi ISO chỉ giữ Ngày (YYYY-MM-DD)
     * Thích hợp xử lý so sánh ngày tháng cho Thực đơn ngày (Daily Menu)
     * @param {Date|string} date 
     * @returns {string|null}
     */
    formatDate(date) {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    },

    /**
     * Format DateTime sang chuỗi hiển thị tường minh "DD/MM/YYYY HH:mm"
     * Thích hợp hiển thị mốc thời gian khách gọi món hoặc thời gian bếp bắt đầu nấu (KDS)
     * @param {Date|string} datetime 
     * @returns {string|null}
     */
    formatDateTime(datetime) {
        if (!datetime) return null;
        const d = new Date(datetime);
        if (isNaN(d.getTime())) return null;
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    },

    /**
     * Ép kiểu Integer an toàn (Ngăn ngừa lỗi trả về giá trị NaN gây sập câu lệnh SQL)
     * @param {any} value 
     * @param {number} defaultValue 
     * @returns {number}
     */
    parseIntSafe(value, defaultValue = 0) {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    },

    /**
     * Parse giá trị Boolean từ nhiều định dạng chuỗi dữ liệu đầu vào ("true", "1", true)
     * Thích hợp kiểm tra trạng thái hoạt động isActive của món ăn/đầu bếp
     * @param {any} value 
     * @returns {boolean}
     */
    parseBoolean(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
        }
        return false;
    },

    /**
     * Rút gọn đối tượng Object, loại bỏ toàn bộ các trường dữ liệu undefined hoặc null
     * Thích hợp làm sạch dữ liệu filter truy vấn trước khi đẩy vào Request SQL
     * @param {Object} obj 
     * @returns {Object}
     */
    cleanObject(obj) {
        if (!obj || typeof obj !== 'object') return {};
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
        );
    },

    /**
     * Sinh mã ký tự ngẫu nhiên (Dùng cho việc cấp mã hóa đơn nhanh, hoặc mã định danh phụ)
     * @param {number} length 
     * @returns {string}
     */
    generateRandomCode(length = 6) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Lấy chuỗi ngày hôm nay theo múi giờ hệ thống local (Format: YYYY-MM-DD)
     * Phục vụ luồng đối chiếu tạo thực đơn ngày mặc định
     * @returns {string}
     */
    getTodayISO() {
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(Date.now() - tzoffset)).toISOString();
        return localISOTime.split('T')[0];
    }
};

module.exports = helpers;