// public/assets/js/order.js
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    initRealtimeSocket();
});

// 1. Tải danh sách đơn hàng thông qua API
async function loadOrders() {
    try {
        const response = await window.apiClient.get('/orders');
        if (response.success) {
            renderOrderTable(response.data);
        }
    } catch (error) {
        console.error('Không thể nạp danh sách đơn hàng:', error);
    }
}

function renderOrderTable(orders) {
    const tbody = document.getElementById('order-list-tbody');
    tbody.innerHTML = orders.map(order => `
        <tr id="order-row-${order.order_id}">
            <td><strong>#${order.order_id}</strong></td>
            <td>Bàn ${order.table_id}</td>
            <td>${order.guest_count} người</td>
            <td>${order.note || '<span style="color:#6B7280">Không có</span>'}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
        </tr>
    `).join('');
}

// 2. Lắng nghe cập nhật trạng thái đơn hàng thời gian thực từ Socket của E
function initRealtimeSocket() {
    const socket = io();
    
    // Khi đầu bếp thay đổi tiến độ trên màn hình KDS, trạng thái hóa đơn tự động cập nhật
    socket.on('update_order_status', (data) => {
        const row = document.getElementById(`order-row-${data.orderId}`);
        if (row) {
            const badge = row.querySelector('.status-badge');
            badge.className = `status-badge status-${data.status}`;
            badge.innerText = data.status;
        }
    });
}
