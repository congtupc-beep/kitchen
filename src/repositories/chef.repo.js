// src/repositories/chef.repo.js

const { poolPromise, sql } = require('../../config/database');
const Chef = require('../entities/Chef');

class ChefRepository {
    /**
     * Tìm kiếm đầu bếp trực tiếp bằng Họ và tên (name)
     */
    async findByName(name) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .query(`
                    SELECT [chef_id], [name], [role], [password_hash], [is_active], [created_at]
                    FROM [dbo].[chefs]
                    WHERE [name] = @name
                `); // ✅ ĐÃ XÓA: Bỏ điều kiện AND [is_active] = 1 để cho phép tìm thấy đầu bếp đang nghỉ ca

            if (result.recordset.length === 0) {
                return null;
            }

            const rawChef = result.recordset[0];

            // 💡 GIẢI PHÁP TRIỆT ĐỂ: Ép dữ liệu thô từ SQL Server vào đúng cấu trúc Object phẳng
            return new Chef({
                chef_id: rawChef.chef_id,
                id: rawChef.chef_id, // Dự phòng trường hợp hệ thống cũ gọi biến 'id'
                name: rawChef.name,
                role: rawChef.role,
                password_hash: rawChef.password_hash,
                is_active: rawChef.is_active,
                created_at: rawChef.created_at
            });
        } catch (error) {
            error.code = error.code || 'EREQUEST';
            throw error;
        }
    }

    /**
     * Tìm kiếm đầu bếp theo khóa chính tự tăng (chef_id)
     */
 /*   async findById(chefId) {        // Ẩn đi khi test đăng nhập chưa dùng hầm này 
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('chefId', sql.Int, chefId)
                .query(`
                    SELECT [chef_id], [name], [role], [password_hash], [is_active], [created_at]
                    FROM [dbo].[chefs]
                    WHERE [chef_id] = @chefId
                `);

            if (result.recordset.length === 0) {
                return null;
            }

            const rawChef = result.recordset[0];
            return new Chef({
                chef_id: rawChef.chef_id,
                id: rawChef.chef_id,
                name: rawChef.name,
                role: rawChef.role,
                password_hash: rawChef.password_hash,
                is_active: rawChef.is_active,
                created_at: rawChef.created_at
            });
        } catch (error) {
            error.code = error.code || 'EREQUEST';
            throw error;
        }
    }*/
}
    

module.exports = new ChefRepository();