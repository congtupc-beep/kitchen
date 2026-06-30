class CookingSummaryManager {
    constructor() {
        this.tasks = [];
        this.currentStatus = 'WAITING'; // Mặc định ban đầu hiển thị danh sách chờ nấu
        this.timerInterval = null;
        this.init();
    }

    async init() {
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
    // Đảm bảo các trường completed_at, started_at, created_at tồn tại trong object task từ backend
    const source = task.status === 'DONE'
        ? (task.completed_at || task.started_at || task.created_at)
        : task.status === 'COOKING'
            ? (task.started_at || task.created_at)
            : task.created_at;
            
    return this.getDiffMinutes(source);
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
        document.getElementById('sectionTitle').textContent = titleMap[this.currentStatus] || 'Danh sách tác vụ';
    }

    async switchStatus(status, element) {
        this.currentStatus = status;
        this.updateTabState();
        await this.loadTasks();
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
    }

    renderDishes() {
        const container = document.getElementById('dishesGrid');

        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fa-solid fa-utensils"></i>
                    <h3>Không có món nào trong danh sách này</h3>
                    <p>Các món có trạng thái [${this.currentStatus}] hiện đang trống.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map(task => {
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
            const response = await window.apiClient.get(`/kitchen/tasks/${taskId}`);
            const task = response.data;
            alert(`Chi tiết Task #${taskId}\n\nMón: ${task.dish_name}\nSố lượng: ${task.total_quantity}\nBàn: ${task.table_ids}\nGhi chú: ${task.notes || 'Không có'}\nTrạng thái: ${task.status}`);
        } catch (error) {
            Toast.error('Không thể tải chi tiết task');
        }
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
            await window.apiClient.post(`/kitchen/tasks/${taskId}/complete`);
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