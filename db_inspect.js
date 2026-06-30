const { poolPromise } = require('./config/database');

async function inspect() {
    try {
        const pool = await poolPromise;
        console.log('Inspecting orders columns...');
        const ordersCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'orders'
        `);
        console.log(ordersCols.recordset);

        console.log('Inspecting cook_tasks columns...');
        const tasksCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'cook_tasks'
        `);
        console.log(tasksCols.recordset);

        console.log('Inspecting order_items columns...');
        const itemsCols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'order_items'
        `);
        console.log(itemsCols.recordset);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

inspect();
