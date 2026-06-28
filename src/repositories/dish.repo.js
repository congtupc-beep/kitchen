const Dish = require('../models/Dish');

class DishRepository {
    async getAllDishes() {
        // Trả về dữ liệu tĩnh mô phỏng từ file seed.sql của bạn
        return [
            // --- NHÓM 1: MÓN KHAI VỊ ---
            new Dish(1, 1, 'Gỏi Cuốn Tôm Thịt', 'Món Khai Vị', 35000, 'Gỏi cuốn tôm thịt heo chấm tương đậu phộng béo ngậy.', '/uploads/goi_cuon.jpg', true),
            new Dish(2, 1, 'Chả Giò Hải Sản Crisp', 'Món Khai Vị', 45000, 'Chả giò chiên xù nhân tôm cua bề bề giòn rụm.', '/uploads/cha_gio.jpg', true),
            new Dish(3, 1, 'Bánh Khọt Vũng Tàu', 'Món Khai Vị', 50000, 'Bánh khọt nước cốt dừa kèm tôm tươi và đu đủ bào.', '/uploads/banh_khot.jpg', true),

            // --- NHÓM 2: MÓN CHÍNH ---
            new Dish(11, 1, 'Phở Bò Tái Lăn Nam Định', 'Món Chính', 65000, 'Phở bò xào tái lăn đậm đà nước dùng xương hầm 24h.', '/uploads/pho_bo.jpg', true),
            new Dish(12, 1, 'Cơm Tấm Sườn Bì Chả', 'Món Chính', 55000, 'Cơm tấm sườn nướng mật ong truyền thống Sài Gòn.', '/uploads/com_tam.jpg', true),

            // --- NHÓM 3: CANH VÀ LẨU ---
            new Dish(26, 1, 'Canh Chua Cá Hú Nam Bộ', 'Canh Và Lẩu', 45000, 'Canh chua nấu cá hú bạc hà, dọc mùng, giá đỗ và me.', '/uploads/canh_chua_ca.jpg', true),
            new Dish(30, 1, 'Lẩu Thái Hải Sản Cay Co', 'Canh Và Lẩu', 250000, 'Nồi lẩu Thái chua cay sả chanh kèm tôm, mực, ngao.', '/uploads/lau_thai.jpg', true),

            // --- NHÓM 4: TRÁNG MIỆNG VÀ NƯỚC ---
            new Dish(34, 1, 'Chè Dưỡng Nhan Tuyết Yến', 'Tráng Miệng Và Nước', 25000, 'Chè dưỡng nhan nhựa đào, hạt sen, táo đỏ, long nhãn.', '/uploads/che_duong_nhan.jpg', true),
            new Dish(35, 1, 'Bánh Flan Nước Cốt Dừa', 'Tráng Miệng Và Nước', 18000, 'Bánh flan mềm mịn thơm trứng kèm cafe sữa dừa.', '/uploads/banh_flan.jpg', true)
        ];

        /* sau này kết nối DB thật chỉ cần xóa đoạn trên và viết:
        const { poolPromise } = require('../../../config/database');
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM [dbo].[dishes]');
        return result.recordset;
        */
    }
}

module.exports = new DishRepository();