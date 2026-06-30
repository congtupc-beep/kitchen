-- =====================================================
-- FIX: Thêm trạng thái CANCELLED cho bảng cook_tasks và order_items
-- Chạy file này 1 lần trên SQL Server trước khi khởi động lại ứng dụng
-- =====================================================
USE [ModuleChef];
GO

-- 1. Xóa constraint cũ của cook_tasks (chỉ có WAITING/COOKING/DONE)
DECLARE @constraintName NVARCHAR(200);
SELECT @constraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('dbo.cook_tasks')
  AND definition LIKE '%DONE%COOKING%WAITING%';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[cook_tasks] DROP CONSTRAINT [' + @constraintName + ']');
    PRINT 'Đã xóa constraint cũ của cook_tasks: ' + @constraintName;
END
GO

-- 2. Thêm constraint mới cho cook_tasks (bao gồm CANCELLED)
ALTER TABLE [dbo].[cook_tasks]
    WITH CHECK ADD CHECK (([status] = 'CANCELLED' OR [status] = 'DONE' OR [status] = 'COOKING' OR [status] = 'WAITING'));
GO
PRINT 'Đã thêm constraint mới cho cook_tasks (bao gồm CANCELLED)';
GO

-- 3. Kiểm tra constraint cũ của order_items (thêm CANCELLED nếu chưa có)
DECLARE @oi_constraintName NVARCHAR(200);
SELECT @oi_constraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('dbo.order_items')
  AND definition LIKE '%status%';

IF @oi_constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[order_items] DROP CONSTRAINT [' + @oi_constraintName + ']');
    PRINT 'Đã xóa constraint cũ của order_items: ' + @oi_constraintName;
END
GO

-- 4. Thêm constraint mới cho order_items (bao gồm CANCELLED)
ALTER TABLE [dbo].[order_items]
    WITH CHECK ADD CHECK (([status] = 'CANCELLED' OR [status] = 'DONE' OR [status] = 'COOKING' OR [status] = 'WAITING'));
GO
PRINT 'Đã thêm constraint mới cho order_items (bao gồm CANCELLED)';
GO

-- 5. Kiểm tra kết quả
SELECT 
    t.name AS table_name,
    cc.name AS constraint_name,
    cc.definition
FROM sys.check_constraints cc
INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
WHERE t.name IN ('cook_tasks', 'order_items')
ORDER BY t.name;
GO
