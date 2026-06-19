// src/middlewares/constants.js

/**
 * Hằng số dùng chung cho toàn bộ ứng dụng
 * ⚠️ Mọi thành viên phải import từ đây, KHÔNG hardcode string
 */
const constants = {
    // =========================================================================
    // ROLE - Phân quyền đầu bếp
    // =========================================================================
    ROLE: {
        HEAD_CHEF: 'HEAD_CHEF',  // Bếp trưởng - quản lý thực đơn ngày
        CHEF: 'CHEF'              // Đầu bếp - nhận task nấu
    },

    // =========================================================================
    // ORDER STATUS - Trạng thái đơn hàng (bảng orders)
    // =========================================================================
    ORDER_STATUS: {
        PENDING: 'PENDING',         // Chờ xác nhận
        PROCESSING: 'PROCESSING',   // Đang xử lý
        DONE: 'DONE'                // Hoàn thành
    },

    // =========================================================================
    // TASK STATUS - Trạng thái task nấu (bảng cook_tasks & order_items)
    // =========================================================================
    TASK_STATUS: {
        WAITING: 'WAITING',     // Chờ nhận task
        COOKING: 'COOKING',     // Đang nấu
        DONE: 'DONE'            // Đã hoàn thành
    },

    // =========================================================================
    // DAILY MENU ITEM STATUS - Trạng thái món trong thực đơn ngày
    // =========================================================================
    MENU_ITEM_STATUS: {
        AVAILABLE: 'AVAILABLE',         // Còn hàng
        SOLD_OUT: 'SOLD_OUT',           // Hết hàng
        UNAVAILABLE: 'UNAVAILABLE'      // Tạm ngưng
    },

    // =========================================================================
    // DISH CATEGORY - Danh mục món ăn
    // =========================================================================
    DISH_CATEGORY: {
        APPETIZER: 'Món Khai Vị',
        MAIN: 'Món Chính',
        SOUP_HOTPOT: 'Canh Và Lẩu',
        DESSERT_DRINK: 'Tráng Miệng Và Nước'
    },

    // =========================================================================
    // SOCKET EVENTS - Tên sự kiện Socket.io (D và E phải thống nhất)
    // =========================================================================
    SOCKET_EVENT: {
        NEW_TASK: 'new_task',               // Có task nấu mới
        TASK_UPDATED: 'task_updated',       // Task thay đổi trạng thái
        NEW_ORDER: 'new_order',             // Đơn hàng mới
        ORDER_UPDATED: 'order_updated'      // Đơn hàng cập nhật
    },

    // =========================================================================
    // PAGINATION - Phân trang mặc định
    // =========================================================================
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100
    }
};

module.exports = constants;