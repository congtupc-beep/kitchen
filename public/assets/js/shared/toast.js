/**
 * Toast Notification System
 * Hiển thị thông báo đẹp mắt ở góc phải trên
 */
const Toast = {
    container: null,

    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 5000) {
        this.init();

        const colors = {
            success: { bg: '#52c41a', icon: '✅' },
            error: { bg: '#f5222d', icon: '❌' },
            warning: { bg: '#faad14', icon: '⚠️' },
            info: { bg: '#1890ff', icon: 'ℹ️' },
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${colors[type].bg};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
        `;
        
        toast.innerHTML = `
            <span style="font-size: 20px">${colors[type].icon}</span>
            <span style="flex: 1">${message}</span>
        `;

        toast.onclick = () => toast.remove();
        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success: (msg, duration) => Toast.show(msg, 'success', duration),
    error: (msg, duration) => Toast.show(msg, 'error', duration),
    warning: (msg, duration) => Toast.show(msg, 'warning', duration),
    info: (msg, duration) => Toast.show(msg, 'info', duration),
};

// CSS Animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);