// public/assets/js/shared/api-client.js

class ApiClient {
    constructor(baseUrl = `${window.location.origin}/api`) {
        this.baseUrl = baseUrl;
    }

    /**
     * Hàm cốt lõi xử lý Request bằng fetch thuần của trình duyệt
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        options.headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        try {
            const response = await fetch(url, options);
            let result;
            
            try {
                result = await response.json();
            } catch (parseError) {
                throw new Error('Định dạng dữ liệu từ máy chủ không hợp lệ (JSON Parse Fail).');
            }

            if (!response.ok || !result.success) {
                const errorMsg = result.message || `Lỗi hệ thống (Mã lỗi: ${response.status})`;
                throw new Error(errorMsg);
            }

            return result; 
        } catch (error) {
            console.error(`[API-CLIENT ERROR] Tại tuyến đường ${endpoint}:`, error.message);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra đường truyền hoặc khởi động lại server Node.js!');
            }
            throw error;
        }
    }

    get(endpoint, headers = {}) {
        return this.request(endpoint, { method: 'GET', headers });
    }

    post(endpoint, body, headers = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers
        });
    }

    put(endpoint, body, headers = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers
        });
    }

    delete(endpoint, headers = {}) {
        return this.request(endpoint, { method: 'DELETE', headers });
    }
}

// ✅ ĐẢM BẢO TUYỆT ĐỐI: Gán vào window để file auth.js đứng dưới lôi ra dùng được ngay
window.apiClient = new ApiClient();
console.log('🚀 [API-CLIENT] Đã kích hoạt thư viện kết nối toàn cục thành công!');