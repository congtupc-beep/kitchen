// config/socket.js
const { Server } = require('socket.io');

let io; // Biến lưu trữ Socket.io instance toàn cục

/**
 * Khởi tạo Socket.io với HTTP server
 * @param {http.Server} httpServer - HTTP server từ Express
 */
const init = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ [Socket] Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`❌ [Socket] Client disconnected: ${socket.id}`);
        });
    });

    console.log('✅ [Socket] Socket.io initialized successfully.');
    return io;
};

/**
 * Lấy Socket.io instance (dùng trong Service để emit event)
 * @returns {Server} Socket.io instance
 */
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io chưa được khởi tạo! Gọi init() trước.');
    }
    return io;
};

module.exports = {
    init,   // Hàm khởi tạo (gọi trong server.js với HTTP server)
    getIO   // Hàm lấy instance (gọi trong Service của D và E)
};