const sql = require('mssql');
require('dotenv').config(); // PHẢI CÓ ()

// Cấu hình các thông số bể kết nối (Connection Pool) bảo mật qua file .env
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE, //  DB_DATABASE (khớp với .env)
    port: parseInt(process.env.DB_PORT, 10) || 1433, // THÊM: port từ .env
    options: {
        encrypt: false,                 // Đặt false khi chạy SQL Server môi trường Local
        trustServerCertificate: true,   // Khóa chết lỗi "The certificate chain was not trusted"
        enableArithAbort: true          //  THÊM: tránh warning deprecated
    },
    pool: {
        max: 15,                        // Số lượng kết nối tối đa
        min: 0,                         // Số lượng kết nối tối thiểu
        idleTimeoutMillis: 30000        // Tự động giải phóng kết nối sau 30s
    }
};

// Khởi tạo Connection Pool và xuất ra dưới dạng một Promise
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('--> [Database] SQL Server connection pool established successfully.');
        return pool; // ⭐ TRẢ VỀ pool object
    })
    .catch(err => {
        console.error('>< [Database] Connection pool establishment failed: ', err.message);
        process.exit(1); // Ngắt tiến trình server nếu kết nối lỗi
    });

module.exports = {
    sql,          // Thư viện sql gốc (dùng sql.Int, sql.NVarChar...)
    poolPromise   // Promise<pool> - await để lấy pool object
};