// public/assets/js/chef/dashboard.js
// Dashboard cho CHEF (Đầu Bếp)

class ChefDashboard {
    constructor(chef) {
        this.chef = chef;
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        await this.loadAll();
        this.setupSocket();
        // Tự refresh mỗi 30 giây
        this.refreshInterval = setInterval(() => this.loadAll(), 30000);
    }

    async loadAll() {
        await Promise.allSettled([
            this.loadMyTasks(),
            this.loadRecentOrders()
        ]);
        this.updateClock();
    }

    // ===================== LẤY DỮ LIỆU =====================

    async loadMyTasks() {
        try {
            const chefId = this.chef.chef_id;
            const [waitingRes, cookingRes, doneRes] = await Promise.all([
                window.apiClient.get(`/kitchen/tasks?status=WAITING`),
                window.apiClient.get(`/kitchen/tasks?chef_id=${chefId}&status=COOKING`),
                window.apiClient.get(`/kitchen/tasks?chef_id=${chefId}&status=DONE`)
            ]);

            const waiting = waitingRes.data || [];
            const cooking = cookingRes.data || [];
            const done = doneRes.data || [];

            // Cập nhật stat cards
            this.setEl('statWaiting', waiting.length);
            this.setEl('statCooking', cooking.length);
            this.setEl('statDone', done.length);
            this.setEl('statTotal', waiting.length + cooking.length + done.length);

            // Render danh sách đang nấu (ưu tiên hiện trước)
            this.renderActiveTasks(cooking, waiting);

        } catch (err) {
            console.error('[Dashboard] loadMyTasks error:', err.message);
        }
    }

    async loadRecentOrders() {
        try {
            const res = await window.apiClient.get('/orders/recent?limit=10');
            const orders = res.data || [];
            this.renderRecentOrders(orders);
        } catch (err) {
            console.error('[Dashboard] loadRecentOrders error:', err.message);
        }
    }

    // ===================== RENDER =====================

    renderActiveTasks(cooking, waiting) {
        const container = document.getElementById('activeTasksList');
        if (!container) return;

        const all = [...cooking, ...waiting].slice(0, 6);

        if (all.length === 0) {
            container.innerHTML = `
                <div class="dash-empty">
                    <i class="fa-solid fa-mug-hot"></i>
                    <p>Không có món nào đang xử lý</p>
                </div>`;
            return;
        }

        container.innerHTML = all.map(task => {
            const isCooking = task.status === 'COOKING';
            const mins = this.calcMinutes(isCooking ? task.started_at : task.created_at);
            const urgency = mins > 15 ? 'overdue' : mins > 5 ? 'warning' : 'new';
            const urgencyLabel = mins > 15 ? 'Quá hạn' : mins > 5 ? 'Sắp hạn' : 'Mới';
            return `
            <div class="dash-task-row ${isCooking ? 'cooking' : ''}">
                <div class="dash-task-icon">
                    <i class="fa-solid ${isCooking ? 'fa-fire' : 'fa-clock'}"></i>
                </div>
                <div class="dash-task-info">
                    <div class="dash-task-name">${task.dish_name}</div>
                    <div class="dash-task-meta">
                        <span>x${task.total_quantity}</span>
                        <span><i class="fa-solid fa-chair"></i> Bàn ${task.table_ids || '?'}</span>
                    </div>
                </div>
                <div class="dash-task-right">
                    <span class="time-badge ${urgency}">${mins}p - ${urgencyLabel}</span>
                    <span class="dash-status-dot ${isCooking ? 'cooking' : 'waiting'}">
                        ${isCooking ? 'Đang nấu' : 'Chờ nấu'}
                    </span>
                </div>
            </div>`;
        }).join('');
    }

    renderRecentOrders(orders) {
        const container = document.getElementById('recentOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="dash-empty">
                    <i class="fa-solid fa-inbox"></i>
                    <p>Chưa có đơn hàng nào</p>
                </div>`;
            return;
        }

        container.innerHTML = orders.slice(0, 8).map(order => {
            const statusClass = {
                PENDING: 'status-pending',
                PROCESSING: 'status-processing',
                DONE: 'status-done',
                CANCELLED: 'status-cancelled'
            }[order.status] || 'status-pending';

            const statusText = {
                PENDING: 'Mới', PROCESSING: 'Đang nấu',
                DONE: 'Hoàn thành', CANCELLED: 'Đã hủy'
            }[order.status] || order.status;

            const itemCount = (order.items || []).length;
            return `
            <div class="dash-order-row" onclick="location.href='/chef/order-list.html'">
                <div class="dash-order-id">#${String(order.order_id).padStart(4, '0')}</div>
                <div class="dash-order-info">
                    <span><i class="fa-solid fa-chair"></i> Bàn ${order.table_id}</span>
                    <span>${itemCount} món</span>
                </div>
                <span class="order-status-badge ${statusClass}">${statusText}</span>
            </div>`;
        }).join('');
    }

    // ===================== TIỆN ÍCH =====================

    calcMinutes(dateStr) {
        if (!dateStr) return 0;
        let s = String(dateStr).trim();
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T') + 'Z';
        else if (s.includes('T') && !s.endsWith('Z') && !s.includes('+')) s += 'Z';
        const t = new Date(s);
        if (isNaN(t)) return 0;
        const diff = Date.now() - t.getTime();
        return diff > 0 ? Math.floor(diff / 60000) : 0;
    }

    setEl(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    updateClock() {
        const el = document.getElementById('dashClock');
        if (!el) return;
        const now = new Date();
        el.textContent = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    }

    setupSocket() {
        if (!window.socketClient) return;
        if (typeof window.socketClient.onNewTask === 'function') {
            window.socketClient.onNewTask(() => this.loadAll());
        }
        if (typeof window.socketClient.onTaskUpdated === 'function') {
            window.socketClient.onTaskUpdated(() => this.loadAll());
        }
        if (typeof window.socketClient.onNewOrder === 'function') {
            window.socketClient.onNewOrder(() => this.loadRecentOrders());
        }
        if (typeof window.socketClient.onOrderUpdated === 'function') {
            window.socketClient.onOrderUpdated(() => this.loadRecentOrders());
        }
    }
}

// ===================== KHỞI TẠO =====================
document.addEventListener('DOMContentLoaded', () => {
    const chef = window.checkAuthGuard(['CHEF']);
    if (!chef) return;

    document.getElementById('chefNameTxt').innerText = chef.name;
    document.getElementById('chefRoleTxt').innerText = 'Đầu Bếp';

    // Greet theo giờ
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const greetEl = document.getElementById('dashGreet');
    if (greetEl) greetEl.textContent = `${greet}, ${chef.name}!`;

    new ChefDashboard(chef);
});
