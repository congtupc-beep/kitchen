// public/assets/js/headchef/dashboard.js
// Dashboard cho HEAD_CHEF (Bếp Trưởng)

class HeadChefDashboard {
    constructor(chef) {
        this.chef = chef;
        this.init();
    }

    async init() {
        await this.loadAll();
        this.setupSocket();
        setInterval(() => this.loadAll(), 30000);
        setInterval(() => this.updateClock(), 1000);
    }

    async loadAll() {
        await Promise.allSettled([
            this.loadKitchenStats(),
            this.loadRecentOrders()
        ]);
    }

    // ===================== LẤY DỮ LIỆU =====================

    async loadKitchenStats() {
        try {
            const [waitingRes, cookingRes, doneRes] = await Promise.all([
                window.apiClient.get('/kitchen/tasks?status=WAITING'),
                window.apiClient.get('/kitchen/tasks?status=COOKING'),
                window.apiClient.get('/kitchen/tasks?status=DONE')
            ]);

            const waiting = waitingRes.data || [];
            const cooking = cookingRes.data || [];
            const done = doneRes.data || [];

            // Stat cards
            this.setEl('statWaiting', waiting.length);
            this.setEl('statCooking', cooking.length);
            this.setEl('statDone', done.length);
            this.setEl('statTotal', waiting.length + cooking.length + done.length);

            // Quá hạn (chờ > 15 phút)
            const overdueWaiting = waiting.filter(t => this.calcMinutes(t.created_at) > 15);
            const overdueCooking = cooking.filter(t => this.calcMinutes(t.started_at || t.created_at) > 15);
            const totalOverdue = overdueWaiting.length + overdueCooking.length;
            this.setEl('statOverdue', totalOverdue);
            const overdueCard = document.getElementById('overdueCard');
            if (overdueCard) {
                overdueCard.classList.toggle('urgent', totalOverdue > 0);
            }

            // Render đang nấu + chờ
            this.renderActiveTasks(cooking, waiting);
            // Render top dish chart
            this.renderTopDishes([...cooking, ...waiting, ...done]);

        } catch (err) {
            console.error('[HeadChef Dashboard] loadKitchenStats error:', err.message);
        }
    }

    async loadRecentOrders() {
        try {
            // Lấy thống kê đơn hàng thực tế từ API mới
            const statsRes = await window.apiClient.get('/orders/stats');
            const stats = statsRes.data || { PENDING: 0, PROCESSING: 0, DONE: 0 };

            this.setEl('orderStatPending', stats.PENDING);
            this.setEl('orderStatProcessing', stats.PROCESSING);
            this.setEl('orderStatDone', stats.DONE);

            // Vẫn lấy danh sách 15 đơn hàng gần nhất để hiển thị ở bảng bên dưới
            const res = await window.apiClient.get('/orders/recent?limit=15');
            const orders = res.data || [];
            this.renderRecentOrders(orders);
        } catch (err) {
            console.error('[HeadChef Dashboard] loadRecentOrders error:', err.message);
        }
    }

    // ===================== RENDER =====================

    renderActiveTasks(cooking, waiting) {
        const container = document.getElementById('activeTasksList');
        if (!container) return;

        const all = [...cooking, ...waiting].slice(0, 8);
        if (all.length === 0) {
            container.innerHTML = `<div class="dash-empty"><i class="fa-solid fa-mug-hot"></i><p>Bếp đang rảnh</p></div>`;
            return;
        }

        container.innerHTML = all.map(task => {
            const isCooking = task.status === 'COOKING';
            const mins = this.calcMinutes(isCooking ? (task.started_at || task.created_at) : task.created_at);
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
                        ${task.assigned_chef_id
                            ? `<span><i class="fa-solid fa-user-tie"></i> Chef #${task.assigned_chef_id}</span>`
                            : `<span style="color:#e67e22"><i class="fa-solid fa-triangle-exclamation"></i> Chưa nhận</span>`}
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
            container.innerHTML = `<div class="dash-empty"><i class="fa-solid fa-inbox"></i><p>Chưa có đơn hàng nào</p></div>`;
            return;
        }

        container.innerHTML = orders.slice(0, 10).map(order => {
            const statusClass = {
                PENDING: 'status-pending', PROCESSING: 'status-processing',
                DONE: 'status-done', CANCELLED: 'status-cancelled'
            }[order.status] || 'status-pending';
            const statusText = {
                PENDING: 'Mới', PROCESSING: 'Đang nấu',
                DONE: 'Hoàn thành', CANCELLED: 'Đã hủy'
            }[order.status] || order.status;

            const total = (order.items || []).reduce((s, i) => s + (i.subtotal || 0), 0);
            const totalFmt = total > 0
                ? new Intl.NumberFormat('vi-VN').format(total) + 'đ'
                : `${(order.items || []).length} món`;

            return `
            <div class="dash-order-row" onclick="location.href='/headchef/order-list.html'">
                <div class="dash-order-id">#${String(order.order_id).padStart(4,'0')}</div>
                <div class="dash-order-info">
                    <span><i class="fa-solid fa-chair"></i> Bàn ${order.table_id}</span>
                    <span>${totalFmt}</span>
                </div>
                <span class="order-status-badge ${statusClass}">${statusText}</span>
            </div>`;
        }).join('');
    }

    renderTopDishes(allTasks) {
        const container = document.getElementById('topDishesList');
        if (!container || allTasks.length === 0) {
            if (container) container.innerHTML = `<div class="dash-empty"><i class="fa-solid fa-bowl-rice"></i><p>Chưa có dữ liệu</p></div>`;
            return;
        }

        // Gom nhóm theo tên món
        const map = {};
        allTasks.forEach(t => {
            const name = t.dish_name || 'Không xác định';
            if (!map[name]) map[name] = 0;
            map[name] += (t.total_quantity || 1);
        });

        const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxQty = sorted[0]?.[1] || 1;

        container.innerHTML = sorted.map(([name, qty], idx) => {
            const pct = Math.round((qty / maxQty) * 100);
            const colors = ['#0969da', '#2e7d32', '#e67e22', '#8e44ad', '#c0392b'];
            return `
            <div class="dash-dish-bar-row">
                <div class="dash-dish-rank">${idx + 1}</div>
                <div class="dash-dish-bar-info">
                    <div class="dash-dish-bar-label">${name}</div>
                    <div class="dash-dish-bar-track">
                        <div class="dash-dish-bar-fill" style="width:${pct}%;background:${colors[idx]}"></div>
                    </div>
                </div>
                <div class="dash-dish-bar-qty" style="color:${colors[idx]}">${qty}</div>
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
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    }

    setupSocket() {
        if (!window.socketClient) return;
        const reload = () => this.loadAll();
        ['onNewTask', 'onTaskUpdated', 'onNewOrder', 'onOrderUpdated'].forEach(ev => {
            if (typeof window.socketClient[ev] === 'function') {
                window.socketClient[ev](reload);
            }
        });
    }
}

// ===================== KHỞI TẠO =====================
document.addEventListener('DOMContentLoaded', () => {
    const chef = window.checkAuthGuard(['HEAD_CHEF']);
    if (!chef) return;

    document.getElementById('chefNameTxt').innerText = chef.name;
    document.getElementById('chefRoleTxt').innerText = 'Bếp Trưởng';

    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    const greetEl = document.getElementById('dashGreet');
    if (greetEl) greetEl.textContent = `${greet}, ${chef.name}!`;

    new HeadChefDashboard(chef);
});
