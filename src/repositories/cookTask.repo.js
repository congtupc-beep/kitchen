const { poolPromise, sql } = require('../../config/database');
const CookTask = require('../entities/CookTask');
const constants = require('../utils/constants');

class CookTaskRepository {
    async create(taskData, transaction) {
        const rawDishId = taskData.dish_id || taskData.dishId;
        const finalDishId = parseInt(rawDishId, 10);
        
        if (isNaN(finalDishId) || finalDishId <= 0) {
            throw new Error(`[CRITICAL] Tầng Repo chặn lỗi: dish_id không hợp lệ. Dữ liệu: ${JSON.stringify(taskData)}`);
        }
        
        const request = transaction ? new sql.Request(transaction) : new sql.Request();

        request.input('param_dish_id', sql.Int, finalDishId);
        request.input('param_dish_name', sql.NVarChar(255), taskData.dish_name || 'Món ăn');
        request.input('param_total_quantity', sql.Int, parseInt(taskData.total_quantity || 1, 10));
        request.input('param_table_ids', sql.VarChar(sql.MAX), taskData.table_ids || '');
        request.input('param_notes', sql.NVarChar(sql.MAX), taskData.notes || '');
        request.input('param_status', sql.VarChar(50), taskData.status || 'WAITING');
        
        const result = await request.query(`
            INSERT INTO [dbo].[cook_tasks]
                (dish_id, dish_name, total_quantity, table_ids, notes, status, created_at)
            OUTPUT INSERTED.task_id
            VALUES
                (@param_dish_id, @param_dish_name, @param_total_quantity, @param_table_ids, @param_notes, @param_status, GETDATE());
        `);
        return result.recordset[0].task_id;
    }

    async findMergeableTask(dishId, minutesThreshold = 5, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('dishId', sql.Int, dishId);
        request.input('minutesThreshold', sql.Int, minutesThreshold);

        const result = await request.query(`
            SELECT TOP 1 *
            FROM [dbo].[cook_tasks] WITH (UPDLOCK, ROWLOCK)
            WHERE dish_id = @dishId
              AND status = 'WAITING'
              AND DATEDIFF(MINUTE, created_at, GETDATE()) <= @minutesThreshold
            ORDER BY created_at DESC
        `);

        return result.recordset[0] ? new CookTask(result.recordset[0]) : null;
    }

    async mergeQuantity(taskId, additionalQuantity, additionalTableIds, additionalNotes, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskId', sql.Int, taskId);
        request.input('additionalQuantity', sql.Int, additionalQuantity);
        request.input('additionalTableIds', sql.NVarChar(sql.MAX), additionalTableIds);
        request.input('additionalNotes', sql.NVarChar(sql.MAX), additionalNotes);

        await request.query(`
            UPDATE [dbo].[cook_tasks] WITH (ROWLOCK)
            SET total_quantity = total_quantity + @additionalQuantity,
                table_ids = table_ids + ', ' + @additionalTableIds,
                notes = notes + ' | ' + @additionalNotes
            WHERE task_id = @taskId AND status = 'WAITING'
        `);
    }

    async findById(taskId, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskId', sql.Int, taskId);
        const result = await request.query(`
            SELECT t.*, d.price, d.image_url
            FROM [dbo].[cook_tasks] t
            LEFT JOIN [dbo].[dishes] d ON t.dish_id = d.dish_id
            WHERE t.task_id = @taskId
        `);
        return result.recordset[0] ? new CookTask(result.recordset[0]) : null;
    }

    async findByChefId(chefId) {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('chefId', sql.Int, chefId);
        const result = await request.query(`
            SELECT t.*, d.price, d.image_url
            FROM [dbo].[cook_tasks] t
            LEFT JOIN [dbo].[dishes] d ON t.dish_id = d.dish_id
            WHERE t.assigned_chef_id = @chefId
            ORDER BY t.created_at ASC
        `);
        return result.recordset.map(row => new CookTask(row));
    }

    async findAllTasks() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT t.*, d.price, d.image_url
            FROM [dbo].[cook_tasks] t
            LEFT JOIN [dbo].[dishes] d ON t.dish_id = d.dish_id
            ORDER BY t.created_at ASC
        `);
        return result.recordset.map(row => new CookTask(row));
    }

    async findPendingTasks() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT t.*, d.price, d.image_url
            FROM [dbo].[cook_tasks] t
            LEFT JOIN [dbo].[dishes] d ON t.dish_id = d.dish_id
            WHERE t.status = 'WAITING'
            ORDER BY t.created_at ASC
        `);
        return result.recordset.map(row => new CookTask(row));
    }

    async findTasksByStatus(status) {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('status', sql.VarChar(20), status);
        const result = await request.query(`
            SELECT t.*, d.price, d.image_url
            FROM [dbo].[cook_tasks] t
            LEFT JOIN [dbo].[dishes] d ON t.dish_id = d.dish_id
            WHERE t.status = @status
            ORDER BY t.created_at ASC
        `);
        return result.recordset.map(row => new CookTask(row));
    }

    async findTasksByChefAndStatus(chefId, status) {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('chefId', sql.Int, chefId);
        request.input('status', sql.VarChar(20), status);
        const result = await request.query(`
            SELECT t.*, d.price, d.image_url
            FROM [dbo].[cook_tasks] t
            LEFT JOIN [dbo].[dishes] d ON t.dish_id = d.dish_id
            WHERE t.assigned_chef_id = @chefId AND t.status = @status
            ORDER BY t.created_at ASC
        `);
        return result.recordset.map(row => new CookTask(row));
    }

    async assignTask(taskId, chefId, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskId', sql.Int, taskId);
        request.input('chefId', sql.Int, chefId);
        await request.query(`UPDATE [dbo].[cook_tasks] SET assigned_chef_id = @chefId WHERE task_id = @taskId`);
    }

    async updateStatus(taskId, status, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskId', sql.Int, taskId);
        request.input('status', sql.VarChar(20), status);

        let updateSql = `UPDATE [dbo].[cook_tasks] SET status = @status`;

        if (status === 'COOKING') {
            updateSql += `, started_at = ISNULL(started_at, GETDATE())`;
        }

        if (status === 'DONE') {
            updateSql += `, started_at = ISNULL(started_at, GETDATE()), completed_at = GETDATE()`;
        }

        updateSql += ` WHERE task_id = @taskId`;
        await request.query(updateSql);
    }

    // ✅ ĐÃ SỬA: Thêm điều kiện WHERE status và trả về rowsAffected
    async updateStartedAt(taskId, chefId, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskId', sql.Int, taskId);
        request.input('chefId', sql.Int, chefId);
        const result = await request.query(`
            UPDATE [dbo].[cook_tasks] 
            SET status = 'COOKING', assigned_chef_id = @chefId, started_at = GETDATE() 
            WHERE task_id = @taskId AND status = 'WAITING'
        `);
        return result.rowsAffected[0];
    }

    // ✅ ĐÃ SỬA: Thêm điều kiện WHERE status và trả về rowsAffected
    async updateCompletedAt(taskId, transaction = null) {
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskId', sql.Int, taskId);
        const result = await request.query(`
            UPDATE [dbo].[cook_tasks] 
            SET status = 'DONE', completed_at = GETDATE() 
            WHERE task_id = @taskId AND status = 'COOKING'
        `);
        return result.rowsAffected[0];
    }

    async findByTaskIdList(taskIdList) {
        if (!taskIdList || taskIdList.length === 0) return [];
        const pool = await poolPromise;
        const request = pool.request();
        request.input('taskIds', sql.NVarChar(sql.MAX), taskIdList.join(','));
        const result = await request.query(`
            SELECT * FROM [dbo].[cook_tasks]
            WHERE task_id IN (SELECT TRY_CAST(value AS INT) FROM STRING_SPLIT(@taskIds, ','))
        `);
        return result.recordset.map(row => new CookTask(row));
    }

    async cancelTasksByTaskIdList(taskIdList, transaction) {
        if (!taskIdList || taskIdList.length === 0) return;
        const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
        request.input('taskIds', sql.NVarChar(sql.MAX), taskIdList.join(','));
        request.input('cancelledStatus', sql.VarChar(20), constants.TASK_STATUS.CANCELLED);
        await request.query(`
            UPDATE [dbo].[cook_tasks] SET status = @cancelledStatus
            WHERE task_id IN (SELECT TRY_CAST(value AS INT) FROM STRING_SPLIT(@taskIds, ','))
        `);
    }
}

module.exports = new CookTaskRepository();