// src/api/controllers/auth.controller.js
const authService = require('../../services/auth.service');
const responseBuilder = require('../../utils/responseBuilder'); 
const { poolPromise } = require('../../../config/database'); 

class AuthController {
    /**
     * Đăng nhập hệ thống nhà bếp và chặn đăng nhập trùng thiết bị
     */
    login = async (req, res, next) => {
        try {
            const { name, password } = req.body;
            const pool = await poolPromise;
            
            // Ép SQL Server đọc dữ liệu thời gian thực xuyên qua bộ nhớ đệm (Cache)
            const checkChef = await pool.request()
                .input('name', name)
                .query('SELECT chef_id, is_active FROM [dbo].[chefs] WITH (NOLOCK) WHERE name = @name');

            if (checkChef.recordset.length > 0) {
                const currentChefStatus = checkChef.recordset[0].is_active;
                
                // 🛑 CHẶN ĐĂNG NHẬP TRÙNG (Kiểm tra nghiêm ngặt thiết bị song song)
                if (Number(currentChefStatus) === 1) {
                    return responseBuilder.error(
                        res, 
                        `Tài khoản [${name}] đang trong ca làm việc ở một thiết bị khác. Vui lòng rời ca trên thiết bị cũ!`, 
                        400
                    );
                }
            }

            // Chuyển tiếp xuống Service để kiểm tra mật khẩu hợp lệ
            const safeChef = await authService.login(name, password);

            // Đăng nhập thành công -> Tiến hành ĐÁNH DẤU KHÓA tài khoản (Cập nhật is_active = 1)
            const currentId = safeChef.chef_id || safeChef.id;
            await pool.request()
                .input('chefId', currentId)
                .query('UPDATE [dbo].[chefs] SET is_active = 1 WHERE chef_id = @chefId');

            // Trả kết quả chuẩn hóa JSON về cho Client Frontend
            return responseBuilder.success(
                res, 
                safeChef, 
                'Đăng nhập vào hệ thống nhà bếp thành công.', 
                200
            );
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đăng xuất (Rời ca) - Giải phóng tài khoản trực ca về 0
     */
    logout = async (req, res, next) => {
        try {
            const { chefId } = req.body;
            if (!chefId) {
                return responseBuilder.error(res, 'Hệ thống thiếu mã định danh nhân sự (chefId) để hủy ca.', 400);
            }

            const pool = await poolPromise;
            await pool.request()
                .input('chefId', chefId)
                .query('UPDATE [dbo].[chefs] SET is_active = 0 WHERE chef_id = @chefId');

            return responseBuilder.success(res, null, 'Đầu bếp rời ca thành công.', 200);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();