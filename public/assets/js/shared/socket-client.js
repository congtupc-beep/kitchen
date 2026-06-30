class SocketClient {
    constructor() {
        this.socket = null;
    }

    init() {
        const userString = localStorage.getItem('chef_user');
        if (!userString) return;

        const serverUrl = window.location.origin;
        
        if (typeof io === 'undefined') {
            console.error('[SOCKET CRITICAL] Không tìm thấy thư viện Socket.io Client!');
            return;
        }

        this.socket = io(serverUrl, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        this.socket.on('connect', () => {
            console.log('%c[SOCKET CONNECTED] Đã thiết lập kênh realtime!', 'color: #4caf50; font-weight: bold;');
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('[SOCKET DISCONNECTED] Mất kết nối:', reason);
        });
    }

    // ✅ THÊM: Lắng nghe Order mới
    onNewOrder(callback) {
        if (!this.socket) this.init();
        this.socket.on('new_order', (data) => {
            console.log('[SOCKET EVENT - NEW ORDER]:', data);
            callback(data);
        });
    }

    // ✅ THÊM: Lắng nghe Order được cập nhật
    onOrderUpdated(callback) {
        if (!this.socket) this.init();
        this.socket.on('order_updated', (data) => {
            console.log('[SOCKET EVENT - ORDER UPDATED]:', data);
            callback(data);
        });
    }

    // ✅ THÊM: Lắng nghe Order bị hủy
    onOrderCancelled(callback) {
        if (!this.socket) this.init();
        this.socket.on('order_cancelled', (data) => {
            console.log('[SOCKET EVENT - ORDER CANCELLED]:', data);
            callback(data);
        });
    }

    onNewTask(callback) {
        if (!this.socket) this.init();
        this.socket.on('new_task', (data) => {
            console.log('[SOCKET EVENT - NEW TASK]:', data);
            callback(data);
        });
    }

    onTaskUpdated(callback) {
        if (!this.socket) this.init();
        this.socket.on('task_updated', (data) => {
            console.log('[SOCKET EVENT - TASK UPDATED]:', data);
            callback(data);
        });
    }

    emit(event, data) {
        if (!this.socket) this.init();
        this.socket.emit(event, data);
    }
}

window.socketClient = new SocketClient();

if (localStorage.getItem('chef_user')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.socketClient.init();
    });
}