class CookingSummaryManager {
    constructor() {
        this.tasks = [];
        this.currentStatus = 'WAITING'; // Mặc định ban đầu hiển thị danh sách chờ nấu
        this.activeCardFilter = null;   // Lưu trữ bộ lọc từ thẻ số liệu được click
        this.timerInterval = null;
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get('status');
        const filterParam = urlParams.get('filter');

        if (statusParam) {
            this.currentStatus = statusParam;
        }
        if (filterParam) {
            this.activeCardFilter = filterParam;
            
            const applyInitialFilterClass = () => {
                const card = document.querySelector(`.stat-card[data-filter="${this.activeCardFilter}"]`);
                if (card) {
                    card.classList.add('active-filter');
                }
            };
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applyInitialFilterClass);
            } else {
                applyInitialFilterClass();
            }
        }

        this.updateTabState();
        await this.loadTasks();
        this.setupSocketListeners();
        this.setupRealtimeClock();
        // Tự động tải lại mỗi 30 giây dựa trên trạng thái hiện tại
        setInterval(() => this.loadTasks(), 30000);
    }

    setupRealtimeClock() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            if (this.tasks?.length > 0) {
                this.renderStats();
                this.renderDishes();
            }
        }, 10000);
    }

    parseDate(value) {
        if (!value) return null;
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }
        let input = String(value).trim();
        // Nếu chuỗi có dạng "YYYY-MM-DD HH:mm:ss" -> thêm T và Z để ép trình duyệt hiểu là UTC
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(input)) {
            input = input.replace(' ', 'T') + 'Z';
        } else if (input.includes('T') && !input.endsWith('Z') && !input.includes('+')) {
            input = input + 'Z';
        }
        const date = new Date(input);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    getTaskMinutes(task) {
        // WAITING: thời gian chờ = hiện tại - created_at
        // COOKING: thời gian đang nấu = hiện tại - started_at
        // DONE: thời gian đã nấu xong = completed_at - started_at (không đếm tiếp)
        if (task.status === 'DONE') {
            const start = this.parseDate(task.started_at || task.created_at);
            const end = this.parseDate(task.completed_at);
            if (!start || !end) return 0;
            const diff = end.getTime() - start.getTime();
            return diff > 0 ? Math.floor(diff / 60000) : 0;
        } else if (task.status === 'COOKING') {
            return this.getDiffMinutes(task.started_at || task.created_at);
        } else {
            return this.getDiffMinutes(task.created_at);
        }
    }

    formatDateTime(value) {
        const date = this.parseDate(value);
        if (!date) return '-';
        return date.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatTime(date) {
        const parsed = this.parseDate(date);
        if (!parsed) return '-';
        return parsed.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    }

    formatTableIds(tableIds) {
        if (!tableIds) return 'N/A';
        return tableIds.split(',').map(id => {
            const name = id.trim();
            if (name.toLowerCase().startsWith('bàn')) {
                return name;
            }
            return `Bàn ${name}`;
        }).join(', ');
    }


    updateTabState() {
        document.querySelectorAll('.status-tab').forEach(btn => btn.classList.remove('active'));
        const activeBtn = Array.from(document.querySelectorAll('.status-tab')).find(btn => btn.dataset.status === this.currentStatus);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        const titleMap = {
            'WAITING': 'Danh sách món Đang chờ nấu',
            'COOKING': 'Danh sách món Đang nấu',
            'DONE': 'Danh sách món Đã hoàn thành'
        };
        
        let title = titleMap[this.currentStatus] || 'Danh sách tác vụ';
        if (this.activeCardFilter) {
            const filterNames = {
                'total': ' (Tất cả)',
                'warning': ' (Sắp quá hạn 5-15p)',
                'overdue': ' (Đã quá hạn >15p)',
                'new': ' (Mới nhận <5p)'
            };
            title += filterNames[this.activeCardFilter] || '';
        }
        document.getElementById('sectionTitle').textContent = title;
    }

    async switchStatus(status, element) {
        this.currentStatus = status;
        this.activeCardFilter = null; // Reset bộ lọc thẻ khi chuyển trạng thái tab chính
        document.querySelectorAll('.stat-card').forEach(card => card.classList.remove('active-filter'));
        this.updateTabState();
        await this.loadTasks();
    }

    toggleCardFilter(filterType, element) {
        if (this.activeCardFilter === filterType) {
            this.activeCardFilter = null;
        } else {
            this.activeCardFilter = filterType;
        }

        // Cập nhật class active-filter cho các thẻ số liệu
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.remove('active-filter');
        });

        if (this.activeCardFilter) {
            element.classList.add('active-filter');
        }

        this.updateTabState();
        this.renderDishes();
    }

    matchesFilter(task, filterType) {
        if (!filterType || filterType === 'total') return true;
        const minutes = this.getTaskMinutes(task);
        if (filterType === 'overdue') {
            return (task.status === 'WAITING' || task.status === 'COOKING') && minutes > 15;
        }
        if (filterType === 'warning') {
            if (task.status === 'WAITING') {
                return minutes > 5 && minutes <= 15;
            }
            if (task.status === 'COOKING') {
                return minutes <= 15;
            }
            return false;
        }
        if (filterType === 'new') {
            return task.status === 'WAITING' && minutes <= 5;
        }
        return true;
    }

    async loadTasks() {
        try {
            console.log(`Đang gọi API /api/kitchen/tasks?status=${this.currentStatus}...`);
            // Truy vấn API động theo filter status
            const response = await window.apiClient.get(`/kitchen/tasks?status=${this.currentStatus}`);
            console.log('🟢 Response tasks:', response);

            this.tasks = response.data || [];
            this.renderStats();
            this.renderDishes();
        } catch (error) {
            console.error('❌ Error loading tasks:', error);
            Toast.error('Không thể tải danh sách món: ' + (error.message || 'Lỗi hệ thống'));
        }
    }

    // Tính số phút chênh lệch giữa thời điểm hiện tại và mốc thời gian của task
    getDiffMinutes(createdAtString) {
        const taskTime = this.parseDate(createdAtString);
        if (!taskTime) return 0;
        const diffMs = Date.now() - taskTime.getTime();
        return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
    }

    renderStats() {
        let total = this.tasks.length;
        let waiting = 0;
        let overdue = 0;
        let newOrders = 0;

        this.tasks.forEach(task => {
            const minutes = this.getTaskMinutes(task);
            if (task.status === 'WAITING') {
                if (minutes > 15) overdue++;
                else if (minutes > 5) waiting++;
                else newOrders++;
            } else if (task.status === 'COOKING') {
                if (minutes > 15) overdue++;
                else waiting++;
            }
        });

        document.getElementById('totalOrders').textContent = total;
        document.getElementById('waitingOrders').textContent = waiting;
        document.getElementById('overdueOrders').textContent = overdue;
        document.getElementById('newOrders').textContent = newOrders;

        // Cập nhật nhãn của thẻ đầu tiên dựa trên trạng thái hiện tại
        const labelMap = {
            'WAITING': 'Tổng món đang chờ',
            'COOKING': 'Tổng món đang nấu',
            'DONE': 'Tổng món đã hoàn thành'
        };
        const totalLabelEl = document.querySelector('.stat-card[data-filter="total"] .stat-label');
        if (totalLabelEl) {
            totalLabelEl.textContent = labelMap[this.currentStatus] || 'Tổng tác vụ';
        }

        // Ẩn/Hiện các thẻ thống kê không liên quan theo từng tab trạng thái
        const cardWarning = document.querySelector('.stat-card[data-filter="warning"]');
        const cardOverdue = document.querySelector('.stat-card[data-filter="overdue"]');
        const cardNew = document.querySelector('.stat-card[data-filter="new"]');

        if (this.currentStatus === 'DONE') {
            if (cardWarning) cardWarning.style.display = 'none';
            if (cardOverdue) cardOverdue.style.display = 'none';
            if (cardNew) cardNew.style.display = 'none';
        } else if (this.currentStatus === 'COOKING') {
            if (cardWarning) cardWarning.style.display = 'flex';
            if (cardOverdue) cardOverdue.style.display = 'flex';
            if (cardNew) cardNew.style.display = 'none';
        } else {
            if (cardWarning) cardWarning.style.display = 'flex';
            if (cardOverdue) cardOverdue.style.display = 'flex';
            if (cardNew) cardNew.style.display = 'flex';
        }
    }

    renderDishes() {
        const container = document.getElementById('dishesGrid');

        // Lọc tasks theo bộ lọc từ thẻ số liệu được click
        const filteredTasks = this.tasks.filter(task => this.matchesFilter(task, this.activeCardFilter));

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fa-solid fa-utensils"></i>
                    <h3>Không có món nào khớp với bộ lọc này</h3>
                    <p>Danh sách hiển thị hiện đang trống.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTasks.map(task => {
            const minutes = this.getTaskMinutes(task);
            let timeBadge = '';
            let timeClass = '';

            if (task.status === 'COOKING') {
                timeBadge = `${minutes} phút - ĐANG NẤU`;
                timeClass = minutes > 15 ? 'overdue' : 'warning';
            } else if (task.status === 'WAITING') {
                if (minutes > 15) {
                    timeBadge = `${minutes} phút - QUÁ HẠN`;
                    timeClass = 'overdue';
                } else if (minutes > 5) {
                    timeBadge = `${minutes} phút - SẮP QUÁ HẠN`;
                    timeClass = 'warning';
                } else {
                    timeBadge = `${minutes} phút - MỚI`;
                    timeClass = 'new';
                }
            } else {
                timeBadge = `${minutes} phút - HOÀN THÀNH`;
                timeClass = 'done';
            }

            // ✅ Kiểm soát động nút hành động dựa trên trạng thái chính xác từ Backend
            let actionButton = '';
            if (task.status === 'WAITING') {
                actionButton = `
                    <button class="btn-assign" onclick="cookingSummaryManager.startCooking(${task.task_id})">
                        <i class="fa-solid fa-play"></i> Bắt đầu nấu
                    </button>`;
            } else if (task.status === 'COOKING') {
                actionButton = `
                    <button class="btn-assign" style="background-color: #2e7d32;" onclick="cookingSummaryManager.completeCooking(${task.task_id})">
                        <i class="fa-solid fa-check"></i> Hoàn thành món
                    </button>`;
            } else {
                actionButton = `
                    <button class="btn-assign" style="background-color: #757575;" disabled>
                        <i class="fa-solid fa-circle-check"></i> Đã xong
                    </button>`;
            }

            return `
                <div class="dish-card">
                    <div class="dish-card-header">
                        <span class="time-badge ${timeClass}">${timeBadge}</span>
                        <span class="quantity-badge">x${task.total_quantity}</span>
                    </div>
                    <div class="dish-card-image">
                        ${task.image_url ? `<img src="${task.image_url}" alt="${task.dish_name || 'Món ăn'}" />` : `<i class="fa-solid fa-utensils"></i>`}
                    </div>
                    <h4 class="dish-card-name">${task.dish_name}</h4>
                    <div class="dish-card-info">
                        <div class="dish-note">
                            <i class="fa-solid fa-note-sticky"></i>
                            ${task.notes || 'Không có ghi chú'}
                        </div>
                        <div class="dish-tables">
                            <i class="fa-solid fa-chair"></i>
                            Bàn: ${this.formatTableIds(task.table_ids)}
                        </div>
                        <div class="dish-tables">
                            <i class="fa-solid fa-clock"></i>
                            Thời gian đặt: ${this.formatTime(task.created_at)}
                        </div>
                    </div>
                    <div class="dish-card-actions">
                        <button class="btn-detail" onclick="cookingSummaryManager.viewTaskDetail(${task.task_id})">
                            <i class="fa-solid fa-eye"></i> Chi tiết
                        </button>
                        ${actionButton}
                    </div>
                </div>
            `;
        }).join('');
    }

    async viewTaskDetail(taskId) {
        try {
            // Hiện modal loading
            this.openTaskModal('<div style="text-align:center;padding:40px 20px;color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;"></i><p style="margin-top:12px;">Đang tải chi tiết...</p></div>');

            const response = await window.apiClient.get(`/kitchen/tasks/${taskId}`);
            const task = response.data;

            // Lấy order items liên quan đến task này
            let orderItemsHtml = '';
            try {
                const ordersRes = await window.apiClient.get(`/orders/recent?limit=100`);
                const allOrders = ordersRes.data || [];

                // Lọc orders có chứa item thuộc task này
                const relatedOrders = [];
                for (const order of allOrders) {
                    if (order.items && order.items.some(item => item.task_id === taskId)) {
                        relatedOrders.push(order);
                    }
                }

                if (relatedOrders.length > 0) {
                    orderItemsHtml = `
                        <div class="task-modal-section">
                            <div class="task-modal-section-title">
                                <i class="fa-solid fa-receipt"></i> Đơn hàng liên quan (${relatedOrders.length} đơn)
                            </div>
                            <div class="task-orders-list">
                                ${relatedOrders.map(order => {
                                    const linkedItems = order.items.filter(i => i.task_id === taskId);
                                    const statusBadge = `<span class="order-status-badge status-${order.status.toLowerCase()}">${this.getStatusText(order.status)}</span>`;
                                    return `
                                        <div class="task-order-card">
                                            <div class="task-order-header">
                                                <span class="task-order-id"><i class="fa-solid fa-hashtag"></i> ORD-${String(order.order_id).padStart(5,'0')}</span>
                                                <span><i class="fa-solid fa-chair"></i> Bàn ${order.table_id}</span>
                                                ${statusBadge}
                                                <span class="task-order-time">${this.formatDateTime(order.created_at)}</span>
                                            </div>
                                            <div class="task-order-items">
                                                ${linkedItems.map(item => `
                                                    <div class="task-order-item">
                                                        <span class="task-item-qty">x${item.quantity}</span>
                                                        <span class="task-item-name">${item.dish_name || 'Món #' + item.dish_id}</span>
                                                        ${item.note ? `<span class="task-item-note"><i class="fa-solid fa-note-sticky"></i> ${item.note}</span>` : ''}
                                                        <span class="order-status-badge status-${item.status.toLowerCase()}">${this.getStatusText(item.status)}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>`;
                } else {
                    orderItemsHtml = `
                        <div class="task-modal-section">
                            <div class="task-modal-section-title"><i class="fa-solid fa-receipt"></i> Đơn hàng liên quan</div>
                            <p style="color:#94a3b8;font-size:13px;margin:8px 0 0;">Không tìm thấy đơn hàng liên quan.</p>
                        </div>`;
                }
            } catch (_) {
                orderItemsHtml = '';
            }

            const price = new Intl.NumberFormat('vi-VN').format(task.price || 0);
            const statusClass = task.status === 'WAITING' ? 'status-pending'
                              : task.status === 'COOKING' ? 'status-processing'
                              : task.status === 'DONE'    ? 'status-done'
                              : 'status-cancelled';

            const html = `
                <div class="task-modal-layout">
                    <!-- Ảnh + tên món -->
                    <div class="task-modal-img-col">
                        <div class="task-modal-img">
                            ${task.image_url
                                ? `<img src="${task.image_url}" alt="${task.dish_name}" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-utensils\\'></i>'">`
                                : `<i class="fa-solid fa-utensils"></i>`}
                        </div>
                        <div style="text-align:center;margin-top:12px;">
                            <div style="font-weight:800;font-size:17px;color:#1a1a1a;">${task.dish_name}</div>
                            <div style="font-size:20px;font-weight:700;color:#0969da;margin-top:4px;">${price}đ</div>
                        </div>
                    </div>

                    <!-- Thông số task -->
                    <div class="task-modal-info-col">
                        <div class="task-modal-section">
                            <div class="task-modal-section-title"><i class="fa-solid fa-chart-bar"></i> Thông số tác vụ</div>
                            <div class="task-modal-stats-grid">
                                <div class="task-modal-stat">
                                    <div class="task-modal-stat-val">${task.total_quantity}</div>
                                    <div class="task-modal-stat-lbl">Tổng số lượng</div>
                                </div>
                                <div class="task-modal-stat">
                                    <div class="task-modal-stat-val">${task.waiting_time_mins ?? '-'}<small>p</small></div>
                                    <div class="task-modal-stat-lbl">Thời gian chờ</div>
                                </div>
                                <div class="task-modal-stat">
                                    <div class="task-modal-stat-val">${task.cooking_time_mins ?? '-'}<small>p</small></div>
                                    <div class="task-modal-stat-lbl">Thời gian nấu</div>
                                </div>
                            </div>
                        </div>

                        <div class="task-modal-section">
                            <div class="task-modal-section-title"><i class="fa-solid fa-circle-info"></i> Thông tin chi tiết</div>
                            <div class="task-modal-detail-rows">
                                <div class="task-modal-row">
                                    <span class="task-modal-row-label">Trạng thái</span>
                                    <span class="order-status-badge ${statusClass}">${this.getStatusText(task.status)}</span>
                                </div>
                                <div class="task-modal-row">
                                    <span class="task-modal-row-label">Bàn phục vụ</span>
                                    <span><i class="fa-solid fa-chair" style="color:#94a3b8;margin-right:4px;"></i>${task.table_ids || 'N/A'}</span>
                                </div>
                                ${task.assigned_chef_id ? `
                                <div class="task-modal-row">
                                    <span class="task-modal-row-label">Đầu bếp nhận</span>
                                    <span><i class="fa-solid fa-user-tie" style="color:#94a3b8;margin-right:4px;"></i>Chef #${task.assigned_chef_id}</span>
                                </div>` : ''}
                                <div class="task-modal-row">
                                    <span class="task-modal-row-label">Tạo lúc</span>
                                    <span>${this.formatDateTime(task.created_at)}</span>
                                </div>
                                ${task.started_at ? `
                                <div class="task-modal-row">
                                    <span class="task-modal-row-label">Bắt đầu nấu</span>
                                    <span>${this.formatDateTime(task.started_at)}</span>
                                </div>` : ''}
                                ${task.completed_at ? `
                                <div class="task-modal-row">
                                    <span class="task-modal-row-label">Hoàn thành</span>
                                    <span>${this.formatDateTime(task.completed_at)}</span>
                                </div>` : ''}
                            </div>
                        </div>

                        ${task.notes ? `
                        <div class="task-modal-section">
                            <div class="task-modal-section-title"><i class="fa-solid fa-note-sticky"></i> Ghi chú</div>
                            <div class="task-modal-notes">${task.notes}</div>
                        </div>` : ''}

                        ${task.has_allergy ? `
                        <div class="task-modal-allergy">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Cảnh báo dị ứng — Kiểm tra ghi chú kỹ trước khi chế biến!
                        </div>` : ''}
                    </div>
                </div>

                <!-- Orders liên quan bên dưới full width -->
                <div style="padding: 0 24px 24px;">
                    ${orderItemsHtml}
                </div>
            `;

            this.openTaskModal(html);
        } catch (error) {
            Toast.error('Không thể tải chi tiết task');
            document.getElementById('taskDetailModalOverlay').classList.remove('open');
        }
    }

    openTaskModal(html) {
        document.getElementById('taskDetailModalBody').innerHTML = html;
        document.getElementById('taskDetailModalOverlay').classList.add('open');
    }

    closeTaskModal() {
        document.getElementById('taskDetailModalOverlay').classList.remove('open');
    }

    getStatusText(status) {
        const map = {
            'PENDING':'Mới','PROCESSING':'Đang nấu','WAITING':'Chờ nấu',
            'COOKING':'Đang nấu','DONE':'Hoàn thành','CANCELLED':'Đã hủy'
        };
        return map[status] || status;
    }

    async startCooking(taskId) {
        try {
            const chef = JSON.parse(localStorage.getItem('chef_user'));
            if (!chef || !chef.chef_id) {
                Toast.error('Không tìm thấy thông tin đầu bếp');
                return;
            }
            await window.apiClient.post(`/kitchen/tasks/${taskId}/start`, {
                chef_id: chef.chef_id
            });

            this.currentStatus = 'COOKING';
            this.updateTabState();
            Toast.success('Đã bắt đầu chế biến món ăn');
            await this.loadTasks();
        } catch (error) {
            console.error('Error starting cooking:', error);
            Toast.error(error.message || 'Không thể bắt đầu nấu');
        }
    }

    async completeCooking(taskId) {
        const btn = document.querySelector(`button[onclick*="completeCooking(${taskId})"]`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...`;
        }

        try {
            const chef = JSON.parse(localStorage.getItem('chef_user'));
            if (!chef || !chef.chef_id) {
                Toast.error('Không tìm thấy thông tin đầu bếp');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<i class="fa-solid fa-check"></i> Hoàn thành món`;
                }
                return;
            }
            await window.apiClient.post(`/kitchen/tasks/${taskId}/complete`, {
                chef_id: chef.chef_id,
                chef_role: chef.role
            });
            this.currentStatus = 'DONE';
            this.updateTabState();
            Toast.success('Món ăn đã chế biến xong, sẵn sàng phục vụ!');
            await this.loadTasks();
        } catch (error) {
            console.error('Error completing cooking:', error);
            Toast.error(error.message || 'Không thể hoàn thành món');
            
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Hoàn thành món`;
            }
        }
    }


    setupSocketListeners() {
        if (window.socketClient) {
            window.socketClient.onNewTask((data) => {
                console.log('New task received:', data);
                this.loadTasks();
                Toast.success('Có món mới cần chế biến!');
            });
            window.socketClient.onTaskUpdated((data) => {
                console.log('Task updated:', data);
                this.loadTasks();
            });
        }
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount);
    }
}

// Khởi tạo hệ thống
let cookingSummaryManager;
document.addEventListener('DOMContentLoaded', () => {
    const currentChef = window.checkAuthGuard(['HEAD_CHEF', 'CHEF']);
    if (currentChef) {
        document.getElementById('chefNameTxt').innerText = currentChef.name;
        document.getElementById('chefRoleTxt').innerText = currentChef.role === 'HEAD_CHEF' ? 'Bếp Trưởng' : 'Đầu Bếp';
    }
    cookingSummaryManager = new CookingSummaryManager();
});