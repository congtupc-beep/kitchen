// test/auth.test.js
const request = require('supertest');
const app = require('../server'); // Import app Express từ server gốc
const { poolPromise } = require('../config/database');

describe('🔐 MODULE AUTH - API /api/auth/login', () => {

    // Trước khi bắt đầu chạy bộ test, đảm bảo DB sẵn sàng và sạch sẽ
    beforeAll(async () => {
        console.log('✅ Database connected for testing');
        try {
            const pool = await poolPromise;
            // Đưa toàn bộ tài khoản về trạng thái 0 ban đầu để tránh bị kẹt từ phiên chạy cũ
            await pool.request().query('UPDATE [dbo].[chefs] SET is_active = 0');
        } catch (err) {
            console.error('❌ Lỗi thiết lập ban đầu cho DB test:', err.message);
        }
    });

    // 🔄 Tự động giải phóng trạng thái is_active về 0 SAU MỖI TEST CASE
    afterEach(async () => {
        try {
            const pool = await poolPromise;
            await pool.request().query('UPDATE [dbo].[chefs] SET is_active = 0');
        } catch (err) {
            console.error('❌ Lỗi khi dọn dẹp CSDL giữa các case:', err.message);
        }
    });

    // 🔴 SỬA LỖI 1: Đóng kết nối để tránh leak connection
    afterAll(async () => {
        try {
            const pool = await poolPromise;
            await pool.close();
            console.log('✅ Database connection closed successfully.');
        } catch (err) {
            console.error('❌ Lỗi khi đóng connection pool:', err.message);
        }
    });

    // =========================================================================
    // 1. NHÓM TEST CASE THÀNH CÔNG
    // =========================================================================
    describe('✅ Test case thành công', () => {
        it('1.1. Đăng nhập HEAD_CHEF thành công', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    name: 'Nguyễn Thành Long',
                    password: 'headchef@123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Đăng nhập vào hệ thống nhà bếp thành công.');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.role).toBe('HEAD_CHEF');
        });

        it('1.2. Đăng nhập CHEF thành công', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    name: 'Trần Minh Quân',
                    password: 'chefcorp@1'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.role).toBe('CHEF');
            expect(response.body.data.chef_id).toBe(2);
        });

        it('1.3. Đăng nhập với tất cả 5 đầu bếp đều thành công', async () => {
            const listChefs = [
                { id: 1, name: 'Nguyễn Thành Long', password: 'headchef@123', role: 'HEAD_CHEF' },
                { id: 2, name: 'Trần Minh Quân', password: 'chefcorp@1', role: 'CHEF' },
                { id: 3, name: 'Lê Hồng Đức', password: 'chefcorp@2', role: 'CHEF' },
                { id: 4, name: 'Phạm Hoàng Hải', password: 'chefcorp@3', role: 'CHEF' },
                { id: 5, name: 'Vũ Tuyết Mai', password: 'chefcorp@4', role: 'CHEF' }
            ];

            for (const chef of listChefs) {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ name: chef.name, password: chef.password });

                expect(response.status).toBe(200);
                expect(response.body.data.chef_id).toBe(chef.id);
                expect(response.body.data.role).toBe(chef.role);
                
                const pool = await poolPromise;
                await pool.request().query('UPDATE [dbo].[chefs] SET is_active = 0');
            }
        });
        // Thêm case này vào cuối nhóm "1. NHÓM TEST CASE THÀNH CÔNG" trong file test/auth.test.js
it('1.4. Đăng xuất giải phóng thiết bị thành công (Hủy ca trực)', async () => {
    // 1. Đăng nhập để có dữ liệu sạch
    const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ name: 'Nguyễn Thành Long', password: 'headchef@123' });
    
    const chefId = loginRes.body.data.chef_id;

    // 2. Gọi API đăng xuất rời ca vừa thiết lập
    const logoutRes = await request(app)
        .post('/api/auth/logout')
        .send({ chefId: chefId });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.message).toMatch(/thành công/i);
});
    });

    // =========================================================================
    // 2. NHÓM TEST CASE THẤT BẠI - SAI THÔNG TIN
    // =========================================================================
    describe('❌ Test case thất bại - Sai thông tin', () => {
        it('2.1. Sai tên đăng nhập → 401', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Sai Tên Nhân Viên', password: 'headchef@123' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('2.2. Sai mật khẩu → 401', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Nguyễn Thành Long', password: 'sai_mat_khau_hoan_toan' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toMatch(/không chính xác/i);
        });

        it('2.3. Tên và mật khẩu đều sai → 401', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'User Không Tồn Tại', password: 'PasswordBấtKỳ' });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        
    });

    // =========================================================================
    // 3. NHÓM TEST CASE VALIDATION - JOI SCHEMA
    // =========================================================================
    describe('⚠️ Test case validation - Dữ liệu không hợp lệ', () => {
        it('3.1. Thiếu field name → 400', async () => {
            const response = await request(app).post('/api/auth/login').send({ password: 'headchef@123' });
            expect(response.status).toBe(400);
        });

        it('3.2. Thiếu field password → 400', async () => {
            const response = await request(app).post('/api/auth/login').send({ name: 'Nguyễn Thành Long' });
            expect(response.status).toBe(400);
        });

        it('3.3. Body rỗng → 400', async () => {
            const response = await request(app).post('/api/auth/login').send({});
            expect(response.status).toBe(400);
        });

        it('3.4. Name quá ngắn (< 3 ký tự) → 400', async () => {
            const response = await request(app).post('/api/auth/login').send({ name: 'An', password: 'headchef@123' });
            expect(response.status).toBe(400);
        });

        it('3.5. Password quá ngắn (< 6 ký tự) → 400', async () => {
            const response = await request(app).post('/api/auth/login').send({ name: 'Nguyễn Thành Long', password: '123' });
            expect(response.status).toBe(400);
        });

        it('3.6. Name là số (không phải string) → 400', async () => {
            const response = await request(app).post('/api/auth/login').send({ name: 12345, password: 'headchef@123' });
            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // 4. NHÓM TEST CASE BẢO MẬT
    // =========================================================================
    describe('🔒 Test case bảo mật', () => {
        it('4.1. Response KHÔNG chứa password_hash', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Nguyễn Thành Long', password: 'headchef@123' });

            expect(response.status).toBe(200);
            expect(response.body.data.password_hash).toBeUndefined();
            expect(response.body.data.password).toBeUndefined();
        });

        it('4.2. Sai tên và sai mật khẩu đều trả về cùng 1 message (tránh leak info)', async () => {
            const res1 = await request(app).post('/api/auth/login').send({ name: 'SaiTên', password: 'headchef@123' });
            const res2 = await request(app).post('/api/auth/login').send({ name: 'Nguyễn Thành Long', password: 'SaiMdsdsk' });

            expect(res1.body.message).toEqual(res2.body.message);
        });
    });

    // =========================================================================
    // 5. NHÓM TEST CASE HTTP METHODS
    // =========================================================================
    describe('🌐 Test case HTTP Method', () => {
        it('5.1. GET /api/auth/login → 404', async () => {
            const response = await request(app).get('/api/auth/login');
            expect(response.status).toBe(404);
        });

        it('5.2. PUT /api/auth/login → 404', async () => {
            const response = await request(app).put('/api/auth/login');
            expect(response.status).toBe(404);
        });

        it('5.3. DELETE /api/auth/login → 404', async () => {
            const response = await request(app).delete('/api/auth/login');
            expect(response.status).toBe(404);
        });
    });

    // =========================================================================
    // 6. NHÓM TEST CASE KIỂM TRA FORMAT RESPONSE
    // =========================================================================
    describe('📦 Test case format response', () => {
        it('6.1. Response thành công có đúng format chuẩn', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Nguyễn Thành Long', password: 'headchef@123' });

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('statusCode');
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('data');
        });

        it('6.2. Response lỗi có đúng format chuẩn', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Nguyễn Thành Long', password: 'Sai' }); 

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('message');
        });
    });

    // =========================================================================
    // 7. NHÓM TEST CASE CHẶN CA TRỰC TRÙNG (VÁ LỖI NGHIỆM VỤ ĐỒNG BỘ)
    // =========================================================================
    describe('🔐 Test case tài khoản bị khóa / Chặn ca trực trùng', () => {
        // 🔴 SỬA LỖI 2: Siết chặt Assertion, kiểm tra đúng mã lỗi 400
        it('7.1. Đăng nhập trùng tài khoản đang làm việc → Lập tức chặn bằng mã 400', async () => {
            // Thiết bị 1 vào chiếm chỗ thành công
            const device1 = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Nguyễn Thành Long', password: 'headchef@123' });
            expect(device1.status).toBe(200);

            // Thiết bị 2 cố tình đăng nhập trùng tài khoản đó
            const device2 = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Nguyễn Thành Long', password: 'headchef@123' });

            // Ép kiểm tra chặt chẽ, từ chối mã 200 hay 403 bừa bãi
            expect(device2.status).toBe(400);
            expect(device2.body.success).toBe(false);
            expect(device2.body).toHaveProperty('statusCode', 400);
            expect(device2.body.message).toMatch(/đang trong ca làm việc ở một thiết bị khác/i);
        });
    });

    // =========================================================================
    // 8. 🟡 THÊM MỚI: NHÓM TEST CASE CÁC EDGE CASES (TRƯỜNG HỢP BIÊN)
    // =========================================================================
    describe('🧪 Test case các trường hợp biên đặc biệt (Edge Cases)', () => {
        it('8.1. Đăng nhập với tên có ký tự viết hoa/thường lệch biệt (Case-Insensitive SQL)', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'nGuYễN tHàNh lOnG', password: 'headchef@123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Nguyễn Thành Long');
        });

        it('8.2. Mật khẩu chứa ký tự đặc biệt có rủi ro xử lý chuỗi', async () => {
            // Kiểm tra tài khoản Quân mật khẩu có ký tự @ và số 1
            const response = await request(app)
                .post('/api/auth/login')
                .send({ name: 'Trần Minh Quân', password: 'chefcorp@1' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

       
        // Thêm case này vào nhóm "8. Test case các trường hợp biên đặc biệt (Edge Cases)" trong test/auth.test.js

it('8.5. Kiểm thử trực tiếp tầng Service khi thiếu tham số để kích hoạt dòng 11', async () => {
    const authService = require('../src/services/auth.service'); // Thay đổi đường dẫn đúng file auth.service của bạn

    // Ép chạy trực tiếp vào Service với tham số rỗng (vượt qua Joi Validation vì không đi qua HTTP Route)
    await expect(authService.login('', '123456')).rejects.toThrow('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
    await expect(authService.login('Nguyễn Thành Long', '')).rejects.toThrow('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
});
    });

    // =========================================================================
    // 9. HIỆU NĂNG TỐC ĐỘ PHẢN HỒI (PERFORMANCE TEST)
    // =========================================================================
    describe('⚡ PERFORMANCE TEST', () => {
        it('API login phải phản hồi trong < 1 giây', async () => {
            const start = Date.now();
            await request(app)
                .post('/api/auth/login')
                .send({ name: 'Nguyễn Thành Long', password: 'headchef@123' });
                
            const duration = Date.now() - start;
            console.log(`⏱️  Response time: ${duration}ms`);
            expect(duration).toBeLessThan(1000);
        });
    });
});