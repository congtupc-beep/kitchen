USE [ModuleChef];
GO

-- Xóa dữ liệu cũ theo thứ tự ràng buộc khóa ngoại (Tránh xung đột dữ liệu cũ khi chạy lại)
DELETE FROM [dbo].[order_items];
DELETE FROM [dbo].[orders];
DELETE FROM [dbo].[cook_tasks];
DELETE FROM [dbo].[daily_menu_items];
DELETE FROM [dbo].[daily_menus];
DELETE FROM [dbo].[dishes];
DELETE FROM [dbo].[master_menus];
DELETE FROM [dbo].[chefs];
GO

-- Khôi phục lại trạng thái Identity nếu cần thiết
DBCC CHECKIDENT ('[dbo].[chefs]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[master_menus]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[dishes]', RESEED, 0);
GO

-- =========================================================================
-- 1. KHỞI TẠO DANH SÁCH 05 ĐẦU BẾP (CHEFS)
-- =========================================================================
-- Thỏa mãn ràng buộc CHECK: role phải là 'CHEF' hoặc 'HEAD_CHEF' (Viết hoa hoàn toàn)
INSERT INTO [dbo].[chefs] ([name], [role], [password_hash], [is_active], [created_at])
VALUES 
(N'Nguyễn Thành Long', 'HEAD_CHEF', 'headchef@123', 0, GETDATE()), -- chef_id: 1
(N'Trần Minh Quân',    'CHEF',      'chefcorp@1',   0, GETDATE()), -- chef_id: 2
(N'Lê Hồng Đức',       'CHEF',      'chefcorp@2',   0, GETDATE()), -- chef_id: 3
(N'Phạm Hoàng Hải',    'CHEF',      'chefcorp@3',   0, GETDATE()), -- chef_id: 4
(N'Vũ Tuyết Mai',      'CHEF',      'chefcorp@4',   0, GETDATE()); -- chef_id: 5
GO

-- =========================================================================
-- 2. KHỞI TẠO THỰC ĐƠN GỐC (MASTER_MENUS)
-- =========================================================================
INSERT INTO [dbo].[master_menus] ([restaurant_name], [updated_at])
VALUES (N'Nhà Hàng Ẩm Thực Việt Grand Palace', GETDATE()); -- master_menu_id: 1
GO

-- =========================================================================
-- 3. KHỞI TẠO DANH SÁCH 40 MÓN ĂN GỐC (DISHES)
-- =========================================================================
-- Gắn kết trực tiếp tới master_menu_id = 1. Giá tiền đáp ứng điều kiện >= 0.
INSERT INTO [dbo].[dishes] ([master_menu_id], [name], [category], [price], [description], [image_url], [is_active])
VALUES
-- --- NHÓM 1: MÓN KHAI VỊ (10 Món) ---
(1, N'Gỏi Cuốn Tôm Thịt', N'Món Khai Vị', 35000.00, N'Gỏi cuốn tôm thịt heo chấm tương đậu phộng béo ngậy.', '/uploads/goi_cuon.jpg', 1),
(1, N'Chả Giò Hải Sản Crisp', N'Món Khai Vị', 45000.00, N'Chả giò chiên xù nhân tôm cua bề bề giòn rụm.', '/uploads/cha_gio.jpg', 1),
(1, N'Bánh Khọt Vũng Tàu', N'Món Khai Vị', 50000.00, N'Bánh khọt nước cốt dừa kèm tôm tươi và đu đủ bào.', '/uploads/banh_khot.jpg', 1),
(1, N'Súp Cua Tóc Tiên', N'Món Khai Vị', 40000.00, N'Súp cua thịt hầm đặc sánh với trứng bắc thảo và tóc tiên.', '/uploads/sup_cua.jpg', 1),
(1, N'Gỏi Ngó Sen Tai Heo', N'Món Khai Vị', 55000.00, N'Gỏi tai heo giòn sần sật, vị chua ngọt vừa ăn.', '/uploads/goi_ngo_sen.jpg', 1),
(1, N'Khoai Tây Chiên Bơ Tỏi', N'Món Khai Vị', 30000.00, N'Khoai tây cắt lát chiên ngập dầu xóc bơ tỏi thơm lừng.', '/uploads/khoai_tay_chien.jpg', 1),
(1, N'Cánh Gà Chiên Nước Mắm', N'Món Khai Vị', 65000.00, N'Cánh gà tẩm nước mắm kẹo ngọt đậm đà đưa vị.', '/uploads/canh_ga_mam.jpg', 1),
(1, N'Salad Ức Gà Sốt Mè Rang', N'Món Khai Vị', 48000.00, N'Rau mầm tươi sạch kèm ức gà xé và sốt mè rang.', '/uploads/salad_uc_ga.jpg', 1),
(1, N'Bánh Mì Nướng Muối Ớt', N'Món Khai Vị', 25000.00, N'Bánh mì nướng sa tế ép dẹt kèm chà bông, mỡ hành.', '/uploads/banh_mi_muoi_ot.jpg', 1),
(1, N'Hàu Nướng Mỡ Hành', N'Món Khai Vị', 80000.00, N'Hàu sữa tươi nướng mỡ hành lạc rang ngậy vị.', '/uploads/hau_nuong.jpg', 1),

-- --- NHÓM 2: MÓN CHÍNH (15 Món) ---
(1, N'Phở Bò Tái Lăn Nam Định', N'Món Chính', 65000.00, N'Phở bò xào tái lăn đậm đà nước dùng xương hầm 24h.', '/uploads/pho_bo.jpg', 1),
(1, N'Cơm Tấm Sườn Bì Chả', N'Món Chính', 55000.00, N'Cơm tấm sườn nướng mật ong truyền thống Sài Gòn.', '/uploads/com_tam.jpg', 1),
(1, N'Bún Chả Hà Nội Đậm Vị', N'Món Chính', 60000.00, N'Bún chả nướng than hoa thơm phức kèm nước chấm đu đủ.', '/uploads/bun_cha.jpg', 1),
(1, N'Bò Kho Bánh Mì', N'Món Chính', 70000.00, N'Thịt nạm bò ninh nhừ sốt vang dùng kèm bánh mì nóng.', '/uploads/bo_kho.jpg', 1),
(1, N'Cơm Chiên Hải Sản Dương Châu', N'Món Chính', 58000.00, N'Cơm chiên hạt gạo vàng giòn tơi xốp cùng mực, tôm.', '/uploads/com_chien.jpg', 1),
(1, N'Bún Bò Huế Đặc Biệt', N'Món Chính', 75000.00, N'Bún bò Huế sợi to kèm giò heo, chả cua, bò tái.', '/uploads/bun_bo_hue.jpg', 1),
(1, N'Cá Lóc Kho Tộ Miền Tây', N'Món Chính', 85000.00, N'Cá lóc đồng kho kẹo trong tộ đất thơm mùi tiêu sọ.', '/uploads/ca_loc_kho.jpg', 1),
(1, N'Thịt Kho Tàu Trứng Vịt', N'Món Chính', 60000.00, N'Thịt ba chỉ rút sườn kho nước dừa xiêm béo ngậy.', '/uploads/thit_kho_tau.jpg', 1),
(1, N'Gà Lên Mâm 3 Món', N'Món Chính', 180000.00, N'Mẹt gà gồm gà luộc xé phay, xôi lòng mề và gà quay.', '/uploads/ga_len_mam.jpg', 1),
(1, N'Mực Nhồi Thịt Sốt Cà Chua', N'Món Chính', 95000.00, N'Mực ống tươi nhồi thịt băm, mộc nhĩ nấm hương kẹo sốt.', '/uploads/muc_nhoi_thit.jpg', 1),
(1, N'Tôm Sú Rang Muối Hồng Kông', N'Món Chính', 120000.00, N'Tôm sú rang muối xóc tỏi ớt lá lốt sấy giòn.', '/uploads/tom_rang_muoi.jpg', 1),
(1, N'Sườn Non Rim Chua Ngọt', N'Món Chính', 80000.00, N'Sườn chặt nhỏ rim keo nước cốt me và hành tỏi phi.', '/uploads/suon_rim.jpg', 1),
(1, N'Bún Đậu Mắm Tôm Thập Cẩm', N'Món Chính', 65000.00, N'Mẹt bún đậu đầy đủ đậu rán giòn, chả cốm, thịt chân giò.', '/uploads/bun_dau.jpg', 1),
(1, N'Cơm Niêu Đất Xá Xíu', N'Món Chính', 55000.00, N'Cơm cháy đáy niêu sốt thịt xá xíu đậm đà.', '/uploads/com_nieu.jpg', 1),
(1, N'Bò Lúc Lắc Khoai Tây', N'Món Chính', 110000.00, N'Thịt thăn bò cắt khối vuông xào áp chảo cùng ớt chuông.', '/uploads/bo_luc_lac.jpg', 1),

-- --- NHÓM 3: CANH VÀ LẨU (8 Món) ---
(1, N'Canh Chua Cá Hú Nam Bộ', N'Canh Và Lẩu', 45000.00, N'Canh chua nấu cá hú bạc hà, dọc mùng, giá đỗ và me.', '/uploads/canh_chua_ca.jpg', 1),
(1, N'Canh Cua Rau Đay Cà Pháo', N'Canh Và Lẩu', 35000.00, N'Canh cua đồng nguyên chất ngọt mát ăn kèm cà pháo muối.', '/uploads/canh_cua_rau_day.jpg', 1),
(1, N'Canh Sườn Non Nấu Sấu', N'Canh Và Lẩu', 50000.00, N'Canh sườn heo hầm sấu tươi chua thanh thanh giải nhiệt.', '/uploads/canh_suon_sau.jpg', 1),
(1, N'Canh Khổ Qua Nhồi Thịt', N'Canh Và Lẩu', 40000.00, N'Khổ qua nhồi thịt băm mộc nhĩ thanh lọc cơ thể.', '/uploads/canh_kho_qua.jpg', 1),
(1, N'Lẩu Thái Hải Sản Cay Co', N'Canh Và Lẩu', 250000.00, N'Nồi lẩu Thái chua cay sả chanh kèm tôm, mực, ngao.', '/uploads/lau_thai.jpg', 1),
(1, N'Lẩu Riêu Cua Bắp Bò', N'Canh Và Lẩu', 280000.00, N'Lẩu riêu cua sườn sụn, bắp bò hoa kèm rau sống.', '/uploads/lau_rieu_cua.jpg', 1),
(1, N'Lẩu Gà Lá Giang Éo', N'Canh Và Lẩu', 230000.00, N'Lẩu gà ta chặt miếng hầm lá giang vị chua cay thanh nhẹ.', '/uploads/lau_ga_la_giang.jpg', 1),
(1, N'Canh Đậu Hũ Rong Biển', N'Canh Và Lẩu', 30000.00, N'Canh chay thanh mát từ đậu hũ non và rong biển Hàn Quốc.', '/uploads/canh_rong_bien.jpg', 1),

-- --- NHÓM 4: TRÁNG MIỆNG VÀ NƯỚC (7 Món) ---
(1, N'Chè Dưỡng Nhan Tuyết Yến', N'Tráng Miệng Và Nước', 25000.00, N'Chè dưỡng nhan nhựa đào, hạt sen, táo đỏ, long nhãn.', '/uploads/che_duong_nhan.jpg', 1),
(1, N'Bánh Flan Nước Cốt Dừa', N'Tráng Miệng Và Nước', 18000.00, N'Bánh flan mềm mịn thơm trứng kèm cafe sữa dừa.', '/uploads/banh_flan.jpg', 1),
(1, N'Rau Câu Trái Cừa Tươi', N'Tráng Miệng Và Nước', 30000.00, N'Rau câu đổ khuôn trong quả dừa xiêm thanh mát ngọt dịu.', '/uploads/rau_cau_dua.jpg', 1),
(1, N'Sinh Tố Bơ Sáp Đà Lạt', N'Tráng Miệng Và Nước', 35000.00, N'Bơ sáp xay đặc sánh cùng sữa đặc và nước cốt dừa.', '/uploads/sinh_to_bo.jpg', 1),
(1, N'Nước Ép Hoa Quả Tươi', N'Tráng Miệng Và Nước', 28000.00, N'Nước ép mix tùy chọn (Cam, Dứa, Dưa Hấu, Cà Rốt) nguyên chất.', '/uploads/nuoc_ep.jpg', 1),
(1, N'Trà Sữa Thạch Trân Châu', N'Tráng Miệng Và Nước', 32000.00, N'Trà sữa truyền thống tự nấu kèm trân châu đường đen.', '/uploads/tra_sua.jpg', 1),
(1, N'Đĩa Trái Cây Thập Cẩm', N'Tráng Miệng Và Nước', 50000.00, N'Trái cây tươi cắt lát theo mùa (Xoài, Dưa hấu, Ổi, Thanh long).', '/uploads/dia_trai_cay.jpg', 1);
GO

-- =========================================================================
-- KIỂM TRA TRẠNG THÁI NẠP DỮ LIỆU
-- =========================================================================
SELECT N'BẢNG ĐẦU BẾP' AS [Table], COUNT(*) AS [Total Records] FROM [dbo].[chefs] UNION ALL
SELECT N'THỰC ĐƠN GỐC', COUNT(*) FROM [dbo].[master_menus] UNION ALL
SELECT N'MÓN ĂN GỐC (DISH)', COUNT(*) FROM [dbo].[dishes];
GO
