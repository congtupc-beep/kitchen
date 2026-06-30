class OrderListManager {
    constructor(currentChef = null) {
        this.orders = [];
        this.filteredOrders = [];
        this.currentFilter = 'all';
        this.selectedOrderId = null;
        this.currentChef = currentChef;
        this.isHeadChef = currentChef && currentChef.role === 'HEAD_CHEF';
        this.init();
    }

    async init() {
        await this.loadOrders();
        this.setupEventListeners();
        this.setupSocketListeners();
        // Auto refresh every 30 seconds
        setInterval(() => this.loadOrders(), 30000);
    }

    async loadOrders() {
    try {
        console.log('🔵 [DEBUG] Đang gọi API /orders/recent...');
        const response = await window.apiClient.get('/orders/recent?limit=50');
        console.log('🟢 [DEBUG] API response:', response);
        console.log('🟢 [DEBUG] Data:', response.data);
        
        this.orders = response.data || [];
        console.log('🟢 [DEBUG] Số lượng orders:', this.orders.length);
        
        this.applyFilter();
    } catch (error) {
        console.error('❌ [ERROR] loadOrders failed:', error);
        Toast.error('Không thể tải danh sách order: ' + error.message);
    }
}

    applyFilter() {
        if (this.currentFilter === 'all') {
            this.filteredOrders = this.orders;
        } else {
            this.filteredOrders = this.orders.filter(o => o.status === this.currentFilter);
        }
        this.renderOrderList();
    }

    renderOrderList() {
        const container = document.getElementById('orderListContent');
        
        if (this.filteredOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    <h3>Không có đơn hàng nào</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredOrders.map(order => {
            const totalAmount = order.items ? order.items.reduce((sum, item) => {
                return sum + (item.price || 0) * item.quantity;
            }, 0) : 0;

            return `
                <div class="order-item-card ${this.selectedOrderId === order.order_id ? 'active' : ''}" 
                     data-order-id="${order.order_id}"
                     onclick="orderListManager.selectOrder(${order.order_id})">
                    <div class="order-card-header">
                        <span class="order-id">#ORD-${String(order.order_id).padStart(5, '0')}</span>
                        <span class="order-status-badge status-${order.status.toLowerCase()}">${this.getStatusText(order.status)}</span>
                    </div>
                    <div class="order-card-info">
                        <div><strong>Bàn ${order.table_id}</strong></div>
                        <div><i class="fa-solid fa-users"></i> ${order.guest_count || 0} khách</div>
                        <div><i class="fa-solid fa-utensils"></i> ${order.items?.length || 0} món</div>
                    </div>
                    <div class="order-card-footer">
                        <span class="order-total">${this.formatMoney(totalAmount)} đ</span>
                        <span class="order-time">${this.formatTime(order.created_at)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async selectOrder(orderId) {
        this.selectedOrderId = orderId;
        this.renderOrderList();
        
        try {
            const response = await window.apiClient.get(`/orders/${orderId}`);
            const order = response.data;
            this.renderOrderDetail(order);
        } catch (error) {
            console.error('Error loading order detail:', error);
            Toast.error('Không thể tải chi tiết order');
        }
    }

    renderOrderDetail(order) {
        const panel = document.getElementById('orderDetailPanel');
        const totalAmount = order.items ? order.items.reduce((sum, item) => {
            return sum + (item.price || 0) * item.quantity;
        }, 0) : 0;
        
        panel.innerHTML = `
            <div class="order-detail-header">
                <div class="order-detail-info">
                    <h2>#ORD-${String(order.order_id).padStart(5, '0')}</h2>
                    <div class="order-meta">
                        <span><i class="fa-solid fa-chair"></i> Bàn ${order.table_id}</span>
                        <span><i class="fa-solid fa-users"></i> ${order.guest_count || 0} khách</span>
                        <span><i class="fa-solid fa-clock"></i> ${this.formatDateTime(order.created_at)}</span>
                    </div>
                </div>
                <span class="order-status-badge status-${order.status.toLowerCase()}">${this.getStatusText(order.status)}</span>
            </div>

            <div class="order-detail-content">
                <div class="order-section">
                    <h3 class="order-section-title">Danh sách món</h3>
                    <table class="order-items-table">
                        <thead>
                            <tr>
                                <th>Món ăn</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>
                                        <div class="dish-info">
                                            <div class="dish-thumb">
                                        ${item.image_url ? `<img src="${item.image_url}" alt="${item.dish_name || 'Món ăn'}" />` : `<div class="dish-thumb-placeholder"><i class="fa-solid fa-utensils"></i></div>`}
                                    </div>
                                    <div>
                                                <div class="dish-name">${item.dish_name || 'Món ' + item.dish_id}</div>
                                                ${item.note ? `<div class="dish-note"><i class="fa-solid fa-note-sticky"></i> ${item.note}</div>` : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td>${item.quantity}</td>
                                    <td>${this.formatMoney(item.price || 0)} đ</td>
                                    <td>${this.formatMoney((item.price || 0) * item.quantity)} đ</td>
                                    <td><span class="order-status-badge status-${item.status.toLowerCase()}">${this.getStatusText(item.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; color: #0969da;">
                        Tổng cộng: ${this.formatMoney(totalAmount)} đ
                    </div>
                </div>

                <div class="order-section">
                    <h3 class="order-section-title">Tiến trình chế biến</h3>
                    <div class="cooking-progress">
                        <div class="progress-step ${this.isStatusBefore(order.status, 'PENDING') ? 'completed' : ''} ${order.status === 'PENDING' ? 'active' : ''}" 
                             onclick="orderListManager.updateOrderStatus(${order.order_id}, 'PENDING')">
                            <i class="fa-solid fa-clipboard-check"></i><br>
                            Tiếp nhận
                        </div>
                        <div class="progress-step ${this.isStatusBefore(order.status, 'PROCESSING') ? 'completed' : ''} ${order.status === 'PROCESSING' ? 'active' : ''}"
                             onclick="orderListManager.updateOrderStatus(${order.order_id}, 'PROCESSING')">
                            <i class="fa-solid fa-fire-burner"></i><br>
                            Đang nấu
                        </div>
                        <div class="progress-step ${order.status === 'DONE' ? 'active completed' : ''}"
                             onclick="orderListManager.updateOrderStatus(${order.order_id}, 'DONE')">
                            <i class="fa-solid fa-check-circle"></i><br>
                            Hoàn thành
                        </div>
                    </div>
                </div>

                <div class="order-section">
                    <h3 class="order-section-title">Lịch sử xử lý</h3>
                    <div class="order-timeline">
                        <div class="timeline-item">
                            <div class="timeline-dot"><i class="fa-solid fa-plus"></i></div>
                            <div class="timeline-content">
                                <div class="timeline-time">${this.formatDateTime(order.created_at)}</div>
                                <div class="timeline-text">Order được tạo</div>
                            </div>
                        </div>
                        ${order.status !== 'PENDING' ? `
                        <div class="timeline-item">
                            <div class="timeline-dot"><i class="fa-solid fa-play"></i></div>
                            <div class="timeline-content">
                                <div class="timeline-time">${this.formatDateTime(order.started_at || order.created_at)}</div>
                                <div class="timeline-text">Bắt đầu chế biến</div>
                            </div>
                        </div>
                        ` : ''}
                        ${order.status === 'DONE' ? `
                        <div class="timeline-item">
                            <div class="timeline-dot"><i class="fa-solid fa-check"></i></div>
                            <div class="timeline-content">
                                <div class="timeline-time">${this.formatDateTime(order.completed_at || order.updated_at || order.created_at)}</div>
                                <div class="timeline-text">Hoàn thành order</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="order-actions">
                ${order.status !== 'DONE' && order.status !== 'CANCELLED' && this.isHeadChef ? `
                <button class="btn-action btn-danger" onclick="orderListManager.cancelOrder(${order.order_id})">
                    <i class="fa-solid fa-times"></i> Hủy order
                </button>
                ` : ''}
                <button class="btn-action btn-secondary" onclick="window.print()">
                    <i class="fa-solid fa-print"></i> In order
                </button>
            </div>
        `;
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            // Call backend API to update order status
            await window.apiClient.post(`/orders/${orderId}/status`, { status: newStatus });
            Toast.success(`Đã cập nhật trạng thái order thành ${this.getStatusText(newStatus)}`);
            await this.loadOrders();
            if (this.selectedOrderId === orderId) {
                this.selectOrder(orderId);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            Toast.error('Không thể cập nhật trạng thái');
        }
    }

    async cancelOrder(orderId) {
        if (!confirm('Bạn có chắc chắn muốn hủy order này?')) return;
        
        try {
            await window.apiClient.post(`/orders/${orderId}/cancel`);
            Toast.success('Đã hủy order thành công');
            await this.loadOrders();
            if (this.selectedOrderId === orderId) {
                this.selectOrder(orderId);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            Toast.error(error.message || 'Không thể hủy order');
        }
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.applyFilter();
            });
        });

        // Search
        document.getElementById('orderSearch').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm) {
                this.filteredOrders = this.orders.filter(o => 
                    String(o.order_id).includes(searchTerm) ||
                    (o.table_id && o.table_id.toLowerCase().includes(searchTerm))
                );
            } else {
                this.applyFilter();
            }
            this.renderOrderList();
        });
    }

    setupSocketListeners() {
    if (window.socketClient) {
        // ✅ THÊM CHECK: Kiểm tra method tồn tại trước khi gọi
        if (typeof window.socketClient.onNewOrder === 'function') {
            window.socketClient.onNewOrder((data) => {
                console.log('📬 New order:', data);
                this.loadOrders();
                Toast.success(`Order #${data.order_id} mới từ bàn ${data.table_id}!`);
            });
        }

        if (typeof window.socketClient.onOrderUpdated === 'function') {
            window.socketClient.onOrderUpdated((data) => {
                console.log('🔄 Order updated:', data);
                this.loadOrders();
                
                if (this.selectedOrderId === data.order_id) {
                    this.selectOrder(data.order_id);
                    
                    if (data.status === 'PROCESSING') {
                        Toast.info(`Order #${data.order_id} đang được chế biến 🍳`);
                    } else if (data.status === 'DONE') {
                        Toast.success(`Order #${data.order_id} đã hoàn thành ✅`);
                    }
                }
            });
        }

        if (typeof window.socketClient.onOrderCancelled === 'function') {
            window.socketClient.onOrderCancelled((data) => {
                console.log('❌ Order cancelled:', data);
                this.loadOrders();
                if (this.selectedOrderId === data.order_id) {
                    this.selectedOrderId = null;
                    document.getElementById('orderDetailPanel').innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-hand-pointer"></i>
                            <h3>Chọn một đơn hàng để xem chi tiết</h3>
                        </div>
                    `;
                }
            });
        }

        if (typeof window.socketClient.onTaskUpdated === 'function') {
            window.socketClient.onTaskUpdated((data) => {
                console.log('🔄 Task updated (order sync):', data);
                this.loadOrders();
                if (this.selectedOrderId && Array.isArray(data.affected_order_ids) && data.affected_order_ids.includes(this.selectedOrderId)) {
                    this.selectOrder(this.selectedOrderId);
                }
            });
        }
    }
}

    getStatusText(status) {
        const statusMap = {
            'PENDING': 'Mới',
            'PROCESSING': 'Đang nấu',
            'WAITING': 'Chờ xử lý',
            'COOKING': 'Đang nấu',
            'DONE': 'Hoàn thành',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    isStatusBefore(currentStatus, targetStatus) {
        const statusOrder = ['PENDING', 'PROCESSING', 'DONE'];
        return statusOrder.indexOf(currentStatus) > statusOrder.indexOf(targetStatus);
    }

    formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN').format(amount);
    }

    parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    let input = String(value).trim();
    
    // Nếu chuỗi có dạng "YYYY-MM-DD HH:mm:ss"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(input)) {
        input = input.replace(' ', 'T') + 'Z'; // THÊM chữ 'Z' vào cuối để ép trình duyệt hiểu đây là giờ UTC
    } else if (input.includes('T') && !input.endsWith('Z') && !input.includes('+')) {
        input = input + 'Z'; // Nếu có T nhưng thiếu Z thì bù Z vào
    }
    
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date;
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

    formatDateTime(date) {
        const parsed = this.parseDate(date);
        if (!parsed) return '-';
        return parsed.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Initialize
let orderListManager;
document.addEventListener('DOMContentLoaded', () => {
    const currentChef = window.checkAuthGuard(['HEAD_CHEF', 'CHEF']);
    if (currentChef) {
        document.getElementById('chefNameTxt').innerText = currentChef.name;
        document.getElementById('chefRoleTxt').innerText = currentChef.role === 'HEAD_CHEF' ? 'Bếp Trưởng' : 'Đầu Bếp';
    }
    orderListManager = new OrderListManager(currentChef);
});