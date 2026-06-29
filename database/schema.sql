USE [ModuleChef]
GO
/****** Object:  Table [dbo].[chefs]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[chefs](
	[chef_id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](100) NOT NULL,
	[role] [varchar](20) NOT NULL,
	[password_hash] [varchar](255) NOT NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[chef_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[cook_tasks]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[cook_tasks](
	[task_id] [int] IDENTITY(1,1) NOT NULL,
	[dish_id] [int] NOT NULL,
	[dish_name] [varchar](100) NOT NULL,
	[total_quantity] [int] NOT NULL,
	[table_ids] [varchar](max) NULL,
	[notes] [varchar](max) NULL,
	[assigned_chef_id] [int] NULL,
	[status] [varchar](20) NOT NULL,
	[created_at] [datetime] NULL,
	[started_at] [datetime] NULL,
	[completed_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[task_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[daily_menu_items]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[daily_menu_items](
	[item_id] [int] IDENTITY(1,1) NOT NULL,
	[daily_menu_id] [int] NOT NULL,
	[dish_id] [int] NOT NULL,
	[status] [varchar](20) NOT NULL,
	[added_by] [int] NOT NULL,
	[updated_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[daily_menus]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[daily_menus](
	[daily_menu_id] [int] IDENTITY(1,1) NOT NULL,
	[date] [date] NOT NULL,
	[created_by] [int] NOT NULL,
	[is_active] [bit] NULL,
	[created_at] [datetime] NULL,
	[updated_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[daily_menu_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[dishes]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[dishes](
	[dish_id] [int] IDENTITY(1,1) NOT NULL,
	[master_menu_id] [int] NOT NULL,
	[name] [varchar](100) NOT NULL,
	[category] [varchar](50) NOT NULL,
	[price] [decimal](10, 2) NOT NULL,
	[description] [varchar](max) NULL,
	[image_url] [varchar](500) NULL,
	[is_active] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[dish_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[master_menus]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[master_menus](
	[master_menu_id] [int] IDENTITY(1,1) NOT NULL,
	[restaurant_name] [varchar](150) NOT NULL,
	[updated_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[master_menu_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[order_items]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[order_items](
	[order_item_id] [int] IDENTITY(1,1) NOT NULL,
	[order_id] [int] NOT NULL,
	[dish_id] [int] NOT NULL,
	[quantity] [int] NOT NULL,
	[note] [varchar](max) NULL,
	[status] [varchar](20) NOT NULL,
	[task_id] [int] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[order_item_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[orders]    Script Date: 6/9/2026 10:18:02 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[orders](
	[order_id] [int] IDENTITY(1,1) NOT NULL,
	[table_id] [varchar](20) NOT NULL,
	[guest_count] [int] NULL,
	[status] [varchar](20) NOT NULL,
	[note] [varchar](max) NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[order_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Index [UQ_menu_dish]    Script Date: 6/9/2026 10:18:02 PM ******/
ALTER TABLE [dbo].[daily_menu_items] ADD  CONSTRAINT [UQ_menu_dish] UNIQUE NONCLUSTERED 
(
	[daily_menu_id] ASC,
	[dish_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [UQ__daily_me__D9DE21FD6912A001]    Script Date: 6/9/2026 10:18:02 PM ******/
ALTER TABLE [dbo].[daily_menus] ADD UNIQUE NONCLUSTERED 
(
	[date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[chefs] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[chefs] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[cook_tasks] ADD  DEFAULT ('WAITING') FOR [status]
GO
ALTER TABLE [dbo].[cook_tasks] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[daily_menu_items] ADD  DEFAULT ('AVAILABLE') FOR [status]
GO
ALTER TABLE [dbo].[daily_menu_items] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[daily_menus] ADD  DEFAULT ((0)) FOR [is_active]
GO
ALTER TABLE [dbo].[daily_menus] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[daily_menus] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[dishes] ADD  DEFAULT ((1)) FOR [is_active]
GO
ALTER TABLE [dbo].[master_menus] ADD  DEFAULT (getdate()) FOR [updated_at]
GO
ALTER TABLE [dbo].[order_items] ADD  DEFAULT ('WAITING') FOR [status]
GO
ALTER TABLE [dbo].[order_items] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT ('PENDING') FOR [status]
GO
ALTER TABLE [dbo].[orders] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[cook_tasks]  WITH CHECK ADD  CONSTRAINT [FK_task_chef] FOREIGN KEY([assigned_chef_id])
REFERENCES [dbo].[chefs] ([chef_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[cook_tasks] CHECK CONSTRAINT [FK_task_chef]
GO
ALTER TABLE [dbo].[cook_tasks]  WITH CHECK ADD  CONSTRAINT [FK_task_dish] FOREIGN KEY([dish_id])
REFERENCES [dbo].[dishes] ([dish_id])
GO
ALTER TABLE [dbo].[cook_tasks] CHECK CONSTRAINT [FK_task_dish]
GO
ALTER TABLE [dbo].[daily_menu_items]  WITH CHECK ADD  CONSTRAINT [FK_item_chef] FOREIGN KEY([added_by])
REFERENCES [dbo].[chefs] ([chef_id])
GO
ALTER TABLE [dbo].[daily_menu_items] CHECK CONSTRAINT [FK_item_chef]
GO
ALTER TABLE [dbo].[daily_menu_items]  WITH CHECK ADD  CONSTRAINT [FK_item_dish] FOREIGN KEY([dish_id])
REFERENCES [dbo].[dishes] ([dish_id])
GO
ALTER TABLE [dbo].[daily_menu_items] CHECK CONSTRAINT [FK_item_dish]
GO
ALTER TABLE [dbo].[daily_menu_items]  WITH CHECK ADD  CONSTRAINT [FK_item_menu] FOREIGN KEY([daily_menu_id])
REFERENCES [dbo].[daily_menus] ([daily_menu_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[daily_menu_items] CHECK CONSTRAINT [FK_item_menu]
GO
ALTER TABLE [dbo].[daily_menus]  WITH CHECK ADD  CONSTRAINT [FK_daily_menu_chef] FOREIGN KEY([created_by])
REFERENCES [dbo].[chefs] ([chef_id])
GO
ALTER TABLE [dbo].[daily_menus] CHECK CONSTRAINT [FK_daily_menu_chef]
GO
ALTER TABLE [dbo].[dishes]  WITH CHECK ADD  CONSTRAINT [FK_dish_master] FOREIGN KEY([master_menu_id])
REFERENCES [dbo].[master_menus] ([master_menu_id])
GO
ALTER TABLE [dbo].[dishes] CHECK CONSTRAINT [FK_dish_master]
GO
ALTER TABLE [dbo].[order_items]  WITH CHECK ADD  CONSTRAINT [FK_oi_dish] FOREIGN KEY([dish_id])
REFERENCES [dbo].[dishes] ([dish_id])
GO
ALTER TABLE [dbo].[order_items] CHECK CONSTRAINT [FK_oi_dish]
GO
ALTER TABLE [dbo].[order_items]  WITH CHECK ADD  CONSTRAINT [FK_oi_order] FOREIGN KEY([order_id])
REFERENCES [dbo].[orders] ([order_id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[order_items] CHECK CONSTRAINT [FK_oi_order]
GO
ALTER TABLE [dbo].[order_items]  WITH CHECK ADD  CONSTRAINT [FK_oi_task] FOREIGN KEY([task_id])
REFERENCES [dbo].[cook_tasks] ([task_id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[order_items] CHECK CONSTRAINT [FK_oi_task]
GO
ALTER TABLE [dbo].[chefs]  WITH CHECK ADD CHECK  (([role]='CHEF' OR [role]='HEAD_CHEF'))
GO
ALTER TABLE [dbo].[cook_tasks]  WITH CHECK ADD CHECK  (([status]='DONE' OR [status]='COOKING' OR [status]='WAITING'))
GO
ALTER TABLE [dbo].[cook_tasks]  WITH CHECK ADD CHECK  (([total_quantity]>(0)))
GO
ALTER TABLE [dbo].[daily_menu_items]  WITH CHECK ADD CHECK  (([status]='SOLD_OUT' OR [status]='UNAVAILABLE' OR [status]='AVAILABLE'))
GO
ALTER TABLE [dbo].[dishes]  WITH CHECK ADD CHECK  (([price]>=(0)))
GO
ALTER TABLE [dbo].[order_items]  WITH CHECK ADD CHECK  (([quantity]>(0)))
GO
ALTER TABLE [dbo].[order_items]  WITH CHECK ADD CHECK  (([status]='DONE' OR [status]='COOKING' OR [status]='WAITING'))
GO
ALTER TABLE [dbo].[orders]  WITH CHECK ADD CHECK  (([status]='DONE' OR [status]='PROCESSING' OR [status]='PENDING'))
GO
