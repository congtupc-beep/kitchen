// =========================================================================
// KHỐI 1: KHỞI TẠO EXPRESS VÀ HTTP SERVER
// =========================================================================
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// =========================================================================
// KHỐI 2: CẤU HÌNH MIDDLEWARE TOÀN CỤC
// =========================================================================
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// =========================================================================
// KHỐI 3: KẾT NỐI DATABASE VÀ KHỞI TẠO SOCKET
// =========================================================================
const { poolPromise } = require('./config/database');
const socketManager = require('./config/socket');

socketManager.init(server);

poolPromise
    .then(() => console.log('🗄️  SQL Server Database connection pool đã sẵn sàng.'))
    .catch(err => console.error('❌ Khởi động kết nối Database thất bại:', err.message));

// =========================================================================
// KHỐI 4: MOUNT CÁC API ROUTES
// =========================================================================
const authRoutes = require('./src/api/routes/auth.routes');
app.use('/api/auth', authRoutes);

// Các route khác sẽ thêm sau
// app.use('/api/master-menu', require('./src/api/routes/masterMenu.routes'));
// app.use('/api/dishes', require('./src/api/routes/dish.routes'));
// app.use('/api/daily-menus', require('./src/api/routes/dailyMenu.routes'));
// app.use('/api/orders', require('./src/api/routes/order.routes'));
// app.use('/api/kitchen', require('./src/api/routes/kitchen.routes'));

// =========================================================================
// KHỐI 4.2: VIEW ROUTES - PHỤC VỤ GIAO DIỆN HTML
// =========================================================================

// Trang chủ → Login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khu vực Chef
app.get('/chef/:page', (req, res) => {
    const pageName = req.params.page;
    res.sendFile(path.join(__dirname, 'public', 'chef', pageName), (err) => {
        if (err) next();
    });
});

// Khu vực Head Chef
app.get('/headchef/:page', (req, res) => {
    const pageName = req.params.page;
    res.sendFile(path.join(__dirname, 'public', 'headchef', pageName), (err) => {
        if (err) next();
    });
});

// Khu vực Shared
app.get('/shared/:page', (req, res) => {
    const pageName = req.params.page;
    res.sendFile(path.join(__dirname, 'public', 'shared', pageName), (err) => {
        if (err) next();
    });
});

// =========================================================================
// KHỐI 4.3: XỬ LÝ 404
// =========================================================================
app.use((req, res, next) => {
    const error = new Error(`API hoặc Giao diện không tồn tại: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// =========================================================================
// KHỐI 5: GLOBAL ERROR HANDLER
// =========================================================================
const errorMiddleware = require('./src/middlewares/error.middleware');
app.use(errorMiddleware);

// =========================================================================
// KHỐI 6: KHỞI CHẠY SERVER
// =========================================================================
const PORT = process.env.PORT || 3000;

// ✅ EXPORT APP để test có thể dùng
module.exports = app;

// ✅ CHỈ START SERVER khi chạy trực tiếp (node server.js)
if (require.main === module) {
    server.listen(PORT, async () => {
        console.log(`================================================================`);
        console.log(`🚀 MODULE KITCHEN BACKEND SERVER RUNNING ON PORT: ${PORT}`);
        console.log(`👨‍🍳 Link giao diện đăng nhập: http://localhost:${PORT}/`);
        console.log(`================================================================`);

        // 🔄 AUTO-RESET: Giải phóng toàn bộ đầu bếp về trạng thái nghỉ ca
        try {
            const pool = await poolPromise;
            await pool.request().query('UPDATE [dbo].[chefs] SET is_active = 0');
            console.log(`🔄 [DATABASE]: Đã reset toàn bộ tài khoản về is_active = 0`);
        } catch (err) {
            console.error('❌ Lỗi reset trạng thái đầu bếp:', err.message);
        }
    });
}