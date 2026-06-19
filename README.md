# 🍳 HỆ THỐNG QUẢN LÝ BẾP NHÀ HÀNG (Kitchen Management System)

> Đồ án môn Phát Triển Hệ Thống Thông Tin - Nhóm X
> Phân hệ quản lý bếp nhà hàng với hệ thống KDS (Kitchen Display System) thời gian thực

---

## 📋 MỤC LỤC

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt và chạy](#-cài-đặt-và-chạy)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Kiến trúc 7 tầng](#-kiến-trúc-7-tầng)
- [Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
- [API Documentation](#-api-documentation)
- [Quy ước code](#-quy-ước-code)
- [Phân công module](#-phân-công-module)
- [Hướng dẫn cho thành viên mới](#-hướng-dẫn-cho-thành-viên-mới)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

##  GIỚI THIỆU

Hệ thống quản lý bếp nhà hàng giúp:

- **Bếp trưởng (Head Chef)**: Quản lý thực đơn ngày, xem danh sách món có sẵn, theo dõi đơn hàng
- **Đầu bếp (Chef)**: Nhận task nấu ăn realtime qua KDS, cập nhật trạng thái chế biến
- **Hệ thống**: Tự động phân công task, thông báo realtime qua Socket.io


---

## ✨ TÍNH NĂNG CHÍNH

### 1. Đăng nhập phân quyền
- Head Chef: Quản lý thực đơn ngày, xem báo cáo
- Chef: Nhận và xử lý task nấu ăn

### 2. Quản lý thực đơn ngày (Head Chef)
- Xem danh sách 40 món ăn có sẵn
- Chọn món cho thực đơn hôm nay (checkbox)
- Đánh dấu món hết hàng (sold out)

### 3. Kitchen Display System - KDS (Chef)
- Nhận task nấu realtime qua Socket.io
- Hiển thị danh sách task theo trạng thái
- Cập nhật trạng thái: WAITING → COOKING → DONE
- Thông báo âm thanh khi có task mới

### 4. Quản lý đơn hàng
- Tạo đơn hàng từ POS
- Theo dõi tiến độ đơn hàng
- Thống kê theo ngày

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | >= 18.0.0 | Runtime environment |
| Express | ^4.19.2 | Web framework |
| mssql | ^10.0.2 | SQL Server driver |
| Socket.io | ^4.7.5 | Realtime communication |
| Joi | ^17.13.1 | Data validation |
| dotenv | ^16.4.5 | Environment variables |
| cors | ^2.8.5 | Cross-origin requests |

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| HTML5 + CSS3 | Giao diện người dùng |
| Vanilla JavaScript | Logic (không dùng framework) |
| Socket.io-client | Realtime communication |

### Database
| Công nghệ | Phiên bản |
|-----------|-----------|
| SQL Server | 2019+ |
| SSMS | Latest |

### Testing
| Công nghệ | Mục đích |
|-----------|----------|
| Jest | ^29.7.0 | Unit testing |
| Supertest | ^7.2.2 | API testing |

---

##  CÀI ĐẶT VÀ CHẠY

### Yêu cầu hệ thống

- **Node.js** >= 18.0.0 ([Tải về](https://nodejs.org/))
- **SQL Server** 2019+ ([Tải về](https://www.microsoft.com/sql-server))
- **SQL Server Management Studio (SSMS)** ([Tải về](https://docs.microsoft.com/sql/ssms))
- **Git** ([Tải về](https://git-scm.com/))
-------------------------------------------------------------------------------------------------------------------------------------------------
### Bước 1: Clone repository

```bash
git clone https://github.com/your-username/restaurant-kitchen.git
cd restaurant-kitchen
git checkout feature-core
```

Bước 2: Cài đặt dependencies: npm install
Bước 3: Cấu hình database 
- Chạy 2 file schema.sql và seed.sql
Bước 4: Cấu hình môi trường
- Mở file .env và sửa thông tin kết nối database: như .example.env sử tên mk
Bước 5: Chạy server: npm start -hoặc- npm run dev
Bước 6: Mở trình duyệt
-Truy cập: http://localhost:3000

