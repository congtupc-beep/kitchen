// public/assets/js/shared/socket-client.js

class SocketClient {
    constructor() {
        this.socket = null;
    }

    /**
     * Kích hoạt kết nối lên máy chủ Socket.io
     */
    init() {
        const userString = localStorage.getItem('chef_user');
        if (!userString) return; // Không kết nối nếu chưa xác định danh tính ca làm việc

        // Tự động nhận diện domain/port của Server hiện hành
        const serverUrl = window.location.origin;
        
        // Khởi tạo instance kết nối (Thư viện io nạp từ CDN hoặc file tĩnh node_modules)
        if (typeof io === 'undefined') {
            console.error('[SOCKET CRITICAL] Không tìm thấy thư viện Socket.io Client! Vui lòng nhúng script thư viện vào HTML.');
            return;
        }

        this.socket = io(serverUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        this.socket.on('connect', () => {
            console.log('%c[SOCKET CONNECTED] Đã thiết lập kênh realtime thông suốt với máy chủ bếp thành công!', 'color: #4caf50; font-weight: bold;');
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('[SOCKET DISCONNECTED] Mất kết nối mạng kênh bếp, lý do:', reason);
        });
    }

    /**
     * Lắng nghe sự kiện Bếp trưởng bắn món ăn mới cần nấu (Thành viên D, E gọi hàm này)
     */
    onNewTask(callback) {
        if (!this.socket) this.init();
        this.socket.on('new_task', (data) => {
            console.log('[SOCKET EVENT - NEW TASK RECEIVED]:', data);
            callback(data);
        });
    }

    /**
     * Lắng nghe sự kiện cập nhật tiến độ (Ví dụ: Món ăn đã nấu xong)
     */
    onTaskUpdated(callback) {
        if (!this.socket) this.init();
        this.socket.on('task_updated', (data) => {
            console.log('[SOCKET EVENT - TASK UPDATED RECEIVED]:', data);
            callback(data);
        });
    }

    /**
     * Gửi dữ liệu (Emit) từ client lên server nếu cần
     */
    emit(event, data) {
        if (!this.socket) this.init();
        this.socket.emit(event, data);
    }
}

// Khởi tạo thực thể truyền tải realtime toàn cục
window.socketClient = new SocketClient();

// Tự động chạy kết nối nếu tìm thấy session làm việc sẵn có khi F5 tải trang
if (localStorage.getItem('chef_user')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.socketClient.init();
    });
}