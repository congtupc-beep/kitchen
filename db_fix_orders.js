const { poolPromise } = require('./config/database');

async function fix() {
    try {
        const pool = await poolPromise;
        console.log('Adding missing columns to orders table...');
        
        // Check columns again to make sure they don't exist before adding
        const ordersCols = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'orders'
        `);
        const existing = ordersCols.recordset.map(r => r.COLUMN_NAME.toLowerCase());
        
        if (!existing.includes('started_at')) {
            console.log('Adding started_at...');
            await pool.request().query('ALTER TABLE [dbo].[orders] ADD [started_at] [datetime] NULL');
        }
        if (!existing.includes('completed_at')) {
            console.log('Adding completed_at...');
            await pool.request().query('ALTER TABLE [dbo].[orders] ADD [completed_at] [datetime] NULL');
        }
        if (!existing.includes('updated_at')) {
            console.log('Adding updated_at...');
            await pool.request().query('ALTER TABLE [dbo].[orders] ADD [updated_at] [datetime] NULL');
            try {
                await pool.request().query("ALTER TABLE [dbo].[orders] ADD DEFAULT (getdate()) FOR [updated_at]");
            } catch (err) {
                console.log('Note: Could not add default constraint for updated_at, it might already exist or be handled by SQL Server.', err.message);
            }
        }
        
        console.log('Orders table fixed successfully!');
    } catch (e) {
        console.error('Error fixing database:', e);
    } finally {
        process.exit(0);
    }
}

fix();
