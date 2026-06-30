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

// Logging middleware giám sát hệ thống
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// =========================================================================
// KHỐI 3: KẾT NỐI DATABASE VÀ KHỞI TẠO SOCKET
// =========================================================================
const { poolPromise } = require('./config/database');
const socketManager = require('./config/socket');

// 📡 Khởi tạo Socket.io Server nội bộ
socketManager.init(server);

// 🚀 Trích xuất instance io và gắn vào biến global để tầng Service (D & E) dùng chung bắn realtime
const io = socketManager.getIO();
global.io = io;

poolPromise
    .then(() => console.log('🗄️  SQL Server Database connection pool đã sẵn sàng.'))
    .catch(err => console.error('❌ Khởi động kết nối Database thất bại:', err.message));

// =========================================================================
// KHỐI 4: MOUNT CÁC API ROUTES (Đầy đủ cho cả 5 thành viên)
// =========================================================================
const authRoutes = require('./src/api/routes/auth.routes');
const dishRoutes = require('./src/api/routes/dish.routes');

const dailyMenuRoutes = require('./src/api/routes/dailyMenu.routes');
const orderRoutes = require('./src/api/routes/order.routes');
const kitchenRoutes = require('./src/api/routes/kitchen.routes');

app.use('/api/auth', authRoutes);                  // Thành viên A - Xác thực tài khoản
app.use('/api/dishes', dishRoutes);                // Danh sách món ăn (Read-only, tất cả role)
app.use('/api/daily-menus', dailyMenuRoutes);      // Thành viên C - Quản lý thực đơn ngày (Head Chef)

// 🐛 DEBUG: Kiểm tra xem biến nào đang bị lỗi
console.log('--- DEBUG ROUTES ---');
console.log('authRoutes type:', typeof authRoutes);
console.log('orderRoutes type:', typeof orderRoutes);
console.log('kitchenRoutes type:', typeof kitchenRoutes);
console.log('---------------------');

app.use('/api/orders', orderRoutes);                // Thành viên D - Quản lý đơn hàng & Simulator Realtime
app.use('/api/kitchen', kitchenRoutes);             // Thành viên E - Quản lý KDS màn hình bếp (Phân chia Task)

// =========================================================================
// KHỐI 4.2: VIEW ROUTES - PHỤC VỤ GIAO DIỆN HTML TRÊN TRÌNH DUYỆT
// =========================================================================

// Trang chủ → Login đăng nhập hệ thống
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khu vực Chef (KDS Đứng bếp - Realtime)
app.get('/chef/:page', (req, res, next) => {
    const pageName = req.params.page;
    res.sendFile(path.join(__dirname, 'public', 'chef', pageName), (err) => {
        if (err) next();
    });
});

// Khu vực Head Chef (Bếp Trưởng Quản lý)
app.get('/headchef/:page', (req, res, next) => {
    const pageName = req.params.page;
    res.sendFile(path.join(__dirname, 'public', 'headchef', pageName), (err) => {
        if (err) next();
    });
});

// Khu vực Shared (Thông tin dùng chung)
app.get('/shared/:page', (req, res, next) => {
    const pageName = req.params.page;
    res.sendFile(path.join(__dirname, 'public', 'shared', pageName), (err) => {
        if (err) next();
    });
});

// =========================================================================
// KHỐI 4.3: XỬ LÝ 404 KHI SAI URL
// =========================================================================
app.use((req, res, next) => {
    const error = new Error(`API hoặc Giao diện không tồn tại trên hệ thống: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// =========================================================================
// KHỐI 5: GLOBAL ERROR HANDLER (Gom lỗi toàn cục không lo sập app)
// =========================================================================
const errorMiddleware = require('./src/middlewares/error.middleware');
app.use(errorMiddleware);

// =========================================================================
// KHỐI 6: KHỞI CHẠY SERVER
// =========================================================================
const PORT = process.env.PORT || 3000;

// ✅ EXPORT APP để phục vụ viết Unit/Integration Tests
module.exports = app;

// ✅ CHỈ KHỞI CHẠY SERVER khi thực thi trực tiếp bằng lệnh (node server.js)
if (require.main === module) {
    server.listen(PORT, async () => {
        console.log(`================================================================`);
        console.log(`🚀 MODULE KITCHEN BACKEND SERVER RUNNING ON PORT: ${PORT}`);
        console.log(`👨‍🍳 Link giao diện đăng nhập: http://localhost:${PORT}/`);
        console.log(`================================================================`);

        // 🔄 AUTO-RESET: Khởi động dọn dẹp đưa trạng thái ca kíp đầu bếp về ban đầu
        try {
            const pool = await poolPromise;
            await pool.request().query('UPDATE [dbo].[chefs] SET is_active = 0');
            console.log(`🔄 [DATABASE]: Đã reset toàn bộ tài khoản về is_active = 0`);
        } catch (err) {
            console.error('❌ Lỗi reset trạng thái đầu bếp:', err.message);
        }

        // 🤖 KÍCH HOẠT BỘ GIẢ LẬP ORDER NGẪU NHIÊN CỦA THÀNH VIÊN D
        try {
            const orderService = require('./src/services/order.service');
            // nếu muốn tắt Simulator, hãy comment dòng dưới đây
            orderService.startOrderSimulator();
        } catch (simError) {
            console.error('❌ Trình giả lập Simulator của D gặp lỗi nạp module:', simError.message);
        }
    });
}