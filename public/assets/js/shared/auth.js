// public/assets/js/shared/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // 🌟 KHẮC PHỤC LỖI TỰ ĐỘNG NHẢY TRANG (AUTO-LOGIN LOOP)
    // Kiểm tra nếu người dùng đang chủ động quay lại hoặc đứng ở trang đăng nhập gốc
    const isLoginPage = window.location.pathname === '/index.html' || 
                        window.location.pathname === '/' || 
                        window.location.pathname.endsWith('index.html');

    if (isLoginPage) {
        // 🧹 Tự động dọn dẹp tài khoản cũ kẹt trong LocalStorage của thiết bị này
        // Nhường chỗ hoàn toàn cho phiên đăng nhập mới sạch sẽ của đầu bếp khác
        localStorage.removeItem('chef_user');
    }

    const loginForm = document.getElementById('loginForm');
    const chefNameInput = document.getElementById('chefName');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    const lblErrorText = document.getElementById('errorText'); 
    const btnSubmit = document.getElementById('btnSubmit');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            e.stopPropagation();

            if (errorMessage) errorMessage.style.display = 'none';
            if (lblErrorText) lblErrorText.innerText = '';
            
            const name = chefNameInput ? chefNameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!name || !password) {
                showLoginError('Vui lòng chọn hoặc điền đầy đủ họ tên và mật khẩu!');
                return;
            }

            setLoadingState(true);

            try {
                if (!window.apiClient) {
                    throw new Error('Hệ thống thiếu thư viện kết nối api-client.js!');
                }

                // 🔄 ĐỒNG BỘ ĐƯỜNG DẪN API THEO SERVER.JS
                const res = await window.apiClient.post('/auth/login', { name, password });
                
                // 🎉 ĐĂNG NHẬP THÀNH CÔNG -> Lấy thông tin từ Server trả về qua responseBuilder
                const chefUser = res.data; 
                
                // ⏱️ Ghi nhận thời gian bấm nút vào ca thực tế (định dạng ISO)
                chefUser.login_at = new Date().toISOString();

                // 🔄 QUAY LẠI: Lưu vào localStorage theo yêu cầu của bạn
                localStorage.setItem('chef_user', JSON.stringify(chefUser));

                // Điều hướng phân quyền chuẩn vào đúng thư mục ca trực
                if (chefUser.role === 'HEAD_CHEF') {
                    window.location.href = '/headchef/dashboard.html';
                } else if (chefUser.role === 'CHEF') {
                    window.location.href = '/chef/dashboard.html';
                } else {
                    throw new Error('Hệ thống không nhận diện được vai trò của tài khoản này!');
                }
            } catch (error) {
                // 🔄 BÓC TÁCH NỘI DUNG LỖI CHẶN TRÙNG TỪ SERVER TRẢ VỀ CHUẨN AXIOS
                const msg = error.response && error.response.data && error.response.data.message 
                    ? error.response.data.message 
                    : error.message;
                showLoginError(msg);
                setLoadingState(false);
            }
        });
    }

    function showLoginError(msg) {
        if (lblErrorText && errorMessage) {
            lblErrorText.innerText = msg;
            errorMessage.style.display = 'flex';
        } else {
            alert(msg);
        }
    }

    function setLoadingState(isLoading) {
        if (!btnSubmit) return;
        if (isLoading) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span>ĐANG XÁC THỰC VÀO CA... <i class="fa-solid fa-spinner fa-spin"></i></span>';
        } else {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span>XÁC NHẬN VÀO CA <i class="fa-solid fa-arrow-right-to-bracket"></i></span>';
        }
    }
});

/**
 * 🛡 * BỘ LỌC ROUTE GUARD - Đã sửa thuật toán Anti-Loop (Chống nháy/Treo máy trên VS Code)
 */
window.checkAuthGuard = function(allowedRoles = []) {
    // 🔄 QUAY LẠI: Đọc dữ liệu từ localStorage
    const userString = localStorage.getItem('chef_user');
    
    // 1. Nếu chưa vào ca, đá thẳng về màn hình đăng nhập gốc index.html
    if (!userString) {
        window.location.href = '/index.html';
        return null;
    }
    
    const chef = JSON.parse(userString);
    
    // 2. Nếu tài khoản sai phân quyền (Ví dụ: CHEF vào trang của HEAD_CHEF)
    if (allowedRoles.length > 0 && !allowedRoles.includes(chef.role)) {
        alert('Tài khoản của bạn không có quyền hạn truy cập khu vực nghiệp vụ này!');
        
        // 🔥 CẮT ĐỨT VÒNG LẶP: Xóa sạch bộ nhớ lỗi kẹt và đẩy thẳng về index.html để đăng nhập lại từ đầu
        localStorage.removeItem('chef_user');
        window.location.href = '/index.html';
        return null;
    }
    
    return chef;
};

/**
 * 🔓 RỜI CA - Gọi API đồng bộ trạng thái is_active về 0 trong Database
 */
window.logoutChef = async function() {
    try {
        const userString = localStorage.getItem('chef_user');
        if (userString) {
            const chef = JSON.parse(userString);
            
            // Gọi API thông báo Server mở khóa tài khoản
            if (window.apiClient) {
                await window.apiClient.post('/auth/logout', { 
                    chefId: chef.chef_id || chef.id 
                });
            }
        }
    } catch (error) {
        // public/assets/js/shared/auth.js (Chỉ cập nhật khối catch (error) trong sự kiện submit)

            try {
                if (!window.apiClient) {
                    throw new Error('Hệ thống thiếu thư viện kết nối api-client.js!');
                }

                const res = await window.apiClient.post('/auth/login', { name, password });
                const chefUser = res.data; 
                chefUser.login_at = new Date().toISOString();
                localStorage.setItem('chef_user', JSON.stringify(chefUser));

                if (chefUser.role === 'HEAD_CHEF') {
                    window.location.href = '/headchef/dashboard.html';
                } else if (chefUser.role === 'CHEF') {
                    window.location.href = '/chef/dashboard.html';
                }
            } catch (error) {
                // 🔄 FIX ĐỒNG BỘ: Ép bắt đúng thông báo lỗi "đang trong ca làm việc ở thiết bị khác" từ Server gửi về
                let msg = 'Đăng nhập thất bại!';
                if (error.response && error.response.data && error.response.data.message) {
                    msg = error.response.data.message;
                } else {
                    msg = error.message;
                }
                
                showLoginError(msg);
                setLoadingState(false);
            }
    } finally {
        // 🔄 Giải phóng vùng nhớ localStorage tại client và quay về trang chủ
        localStorage.removeItem('chef_user');
        window.location.href = '/index.html';
    }
};