// public/headchef/dailyMenu.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Xác thực quyền Bếp trưởng
    const currentChef = window.checkAuthGuard(['HEAD_CHEF']);
    if (currentChef) {
        document.getElementById('chefNameTxt').innerText = currentChef.name;
        document.getElementById('chefRoleTxt').innerText = 'Bếp Trưởng';
    }

    // Các thành phần giao diện DOM
    const menuDateInput = document.getElementById('menuDate');
    const btnCancelMenu = document.getElementById('btnCancelMenu');
    const btnSaveMenu = document.getElementById('btnSaveMenu');
    
    const btnUseMasterMenu = document.getElementById('btnUseMasterMenu');
    const btnResetToLastSaved = document.getElementById('btnResetToLastSaved');
    
    const dailyMenuTableBody = document.getElementById('dailyMenuTableBody');
    const dailyCountBadge = document.getElementById('dailyCountBadge');
    const selectAllDailyCheck = document.getElementById('selectAllDailyCheck');
    
    const masterMenuTableBody = document.getElementById('masterMenuTableBody');
    const masterCountBadge = document.getElementById('masterCountBadge');
    
    const searchDishInput = document.getElementById('searchDishInput');
    const filterCategorySelect = document.getElementById('filterCategorySelect');
    const paginationContainer = document.getElementById('paginationContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');

    // Thiết lập ngày mặc định là hôm nay
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - tzOffset);
    const todayStr = localDate.toISOString().split('T')[0];
    menuDateInput.value = todayStr;

    // Biến lưu trữ dữ liệu tại Client
    let masterDishes = [];        // Danh sách 40 món gốc lấy từ DB
    let localDailyItems = [];     // Danh sách các món ăn trong thực đơn hôm nay (Cột trái)
    
    // Quản lý Phân trang Master Menu
    let currentPage = 1;
    let itemsPerPage = 5;       // Mặc định hiển thị 5 món mỗi trang

    // Hiện/Ẩn loading
    const toggleLoading = (show) => {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    };

    // Định dạng tiền tệ VND
    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // 2. Hàm Tải Thực Đơn từ Server
    const fetchDailyMenuData = async (date) => {
        toggleLoading(true);
        try {
            // Đảm bảo gọi đúng endpoint đã được mount tại server.js
            const response = await window.apiClient.get(`/daily-menus?date=${date}`);
            if (!response || !response.success) {
                alert(response ? response.message : 'Tải thực đơn thất bại!');
                return;
            }

            const data = response.data;
            
            // Tách dữ liệu
            // masterDishes là toàn bộ món ăn (mỗi món gồm thông tin và trạng thái isSelected)
            masterDishes = data.dishes || [];
            
            // localDailyItems chứa các món đã được chọn trong thực đơn ngày
            localDailyItems = masterDishes
                .filter(dish => dish.isSelected)
                .map(dish => ({
                    dish_id: dish.dish_id,
                    name: dish.name,
                    category: dish.category,
                    price: dish.price,
                    status: dish.menu_item_status || 'AVAILABLE'
                }));

            // Reset trang phân trang của cột phải
            currentPage = 1;
            
            // Render cả 2 cột
            renderDailyMenuTable();
            renderMasterMenuTable();

        } catch (error) {
            console.error('Lỗi tải dữ liệu:', error);
            alert('Lỗi kết nối tới máy chủ!');
        } finally {
            toggleLoading(false);
        }
    };

    // 3. Render Cột Trái: Thực đơn ngày hôm nay
    const renderDailyMenuTable = () => {
        dailyMenuTableBody.innerHTML = '';
        dailyCountBadge.innerText = `${localDailyItems.length} món`;

        if (localDailyItems.length === 0) {
            dailyMenuTableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-placeholder">
                            <i class="fa-solid fa-cookie-bite"></i>
                            Chưa có món ăn nào được chọn. Thêm món từ cột bên phải!
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        localDailyItems.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            const isAvailable = item.status === 'AVAILABLE';
            const badgeClass = isAvailable ? 'available' : 'sold_out';
            const badgeText = isAvailable ? 'Available' : 'Sold Out';

            tr.innerHTML = `
                <td class="cell-checkbox"><input type="checkbox" class="daily-item-check" value="${item.dish_id}"></td>
                <td class="cell-stt">${index + 1}</td>
                <td><strong>${item.name}</strong></td>
                <td><span style="color:#64748b; font-size:12px;">${item.category}</span></td>
                <td class="cell-price">${formatVND(item.price)}</td>
                <td><span class="badge-status ${badgeClass}">${badgeText}</span></td>
                <td style="text-align: center;">
                    <select class="select-status-inline" data-id="${item.dish_id}">
                        <option value="AVAILABLE" ${isAvailable ? 'selected' : ''}>Available</option>
                        <option value="SOLD_OUT" ${!isAvailable ? 'selected' : ''}>Sold Out</option>
                    </select>
                    <button class="btn-action-icon delete" data-id="${item.dish_id}" title="Xóa khỏi thực đơn">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            // Lắng nghe sự kiện đổi trạng thái phục vụ nhanh (AVAILABLE / SOLD_OUT)
            const statusSelect = tr.querySelector('.select-status-inline');
            statusSelect.addEventListener('change', (e) => {
                const newStatus = e.target.value;
                item.status = newStatus;
                
                // Render lại bảng để đổi màu badge
                renderDailyMenuTable();
            });

            // Lắng nghe sự kiện xóa món ăn
            const deleteBtn = tr.querySelector('.btn-action-icon.delete');
            deleteBtn.addEventListener('click', () => {
                removeDishFromDailyMenu(item.dish_id);
            });

            dailyMenuTableBody.appendChild(tr);
        });
    };

    // 4. Render Cột Phải: Thực đơn gốc
    const renderMasterMenuTable = () => {
        masterMenuTableBody.innerHTML = '';

        // Thu thập từ khóa tìm kiếm và lọc danh mục
        const keyword = searchDishInput.value.toLowerCase().trim();
        const selectedCategory = filterCategorySelect.value;

        // Lọc danh sách món gốc
        const filteredDishes = masterDishes.filter(dish => {
            const matchKeyword = dish.name.toLowerCase().includes(keyword);
            const matchCategory = selectedCategory === '' || dish.category === selectedCategory;
            return matchKeyword && matchCategory;
        });

        masterCountBadge.innerText = `${filteredDishes.length} món`;

        if (filteredDishes.length === 0) {
            masterMenuTableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-placeholder">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            Không tìm thấy món ăn nào phù hợp!
                        </div>
                    </td>
                </tr>
            `;
            paginationContainer.innerHTML = '';
            return;
        }

        // Thực hiện phân trang
        const totalItems = filteredDishes.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Điều chỉnh trang hiện tại nếu vượt quá giới hạn
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedDishes = filteredDishes.slice(startIndex, endIndex);

        paginatedDishes.forEach((dish, index) => {
            const tr = document.createElement('tr');
            
            // Kiểm tra xem món này đã nằm ở cột trái chưa
            const isAdded = localDailyItems.some(item => item.dish_id === dish.dish_id);
            
            tr.innerHTML = `
                <td class="cell-stt">${startIndex + index + 1}</td>
                <td><strong>${dish.name}</strong></td>
                <td><span style="color:#64748b; font-size:12px;">${dish.category}</span></td>
                <td class="cell-price">${formatVND(dish.price)}</td>
                <td style="text-align: center;">
                    ${isAdded ? `
                        <span style="color:var(--success-green); font-weight:bold; font-size:11px;">
                            <i class="fa-solid fa-check"></i> Đã chọn
                        </span>
                    ` : `
                        <button class="btn-action-icon add" data-id="${dish.dish_id}" title="Thêm vào thực đơn hôm nay">
                            <i class="fa-solid fa-plus-circle"></i> Thêm
                        </button>
                    `}
                </td>
            `;

            // Lắng nghe sự kiện click Thêm món
            if (!isAdded) {
                const addBtn = tr.querySelector('.btn-action-icon.add');
                addBtn.addEventListener('click', () => {
                    addDishToDailyMenu(dish);
                });
            }

            masterMenuTableBody.appendChild(tr);
        });

        // Vẽ bộ nút phân trang
        renderPagination(totalPages);
    };

    // Vẽ thanh phân trang
    const renderPagination = (totalPages) => {
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        // Nút Previous
        const prevBtn = document.createElement('button');
        prevBtn.className = `btn-page ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
        if (currentPage > 1) {
            prevBtn.addEventListener('click', () => {
                currentPage--;
                renderMasterMenuTable();
            });
        }
        paginationContainer.appendChild(prevBtn);

        // Các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `btn-page ${currentPage === i ? 'active' : ''}`;
            pageBtn.innerText = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderMasterMenuTable();
            });
            paginationContainer.appendChild(pageBtn);
        }

        // Nút Next
        const nextBtn = document.createElement('button');
        nextBtn.className = `btn-page ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
        if (currentPage < totalPages) {
            nextBtn.addEventListener('click', () => {
                currentPage++;
                renderMasterMenuTable();
            });
        }
        paginationContainer.appendChild(nextBtn);
    };

    // 5. Tương tác Thêm / Xóa món ăn trên Client
    const addDishToDailyMenu = (dish) => {
        // Kiểm tra an toàn xem món đã tồn tại chưa
        const exists = localDailyItems.some(item => item.dish_id === dish.dish_id);
        if (exists) return;

        // Chèn lập tức sang cột bên trái (tự động AVAILABLE)
        localDailyItems.push({
            dish_id: dish.dish_id,
            name: dish.name,
            category: dish.category,
            price: dish.price,
            status: 'AVAILABLE'
        });

        // Render lại cả 2 cột để cập nhật UI ngay lập tức!
        renderDailyMenuTable();
        renderMasterMenuTable();
    };

    const removeDishFromDailyMenu = (dishId) => {
        // Loại bỏ lập tức khỏi danh sách
        localDailyItems = localDailyItems.filter(item => item.dish_id !== dishId);

        // Render lại cả 2 cột để cập nhật UI ngay lập tức!
        renderDailyMenuTable();
        renderMasterMenuTable();
    };

    // Chọn tất cả / Bỏ chọn tất cả ở cột trái
    selectAllDailyCheck.addEventListener('change', (e) => {
        const checked = e.target.checked;
        const checkboxes = dailyMenuTableBody.querySelectorAll('.daily-item-check');
        checkboxes.forEach(cb => cb.checked = checked);
    });

    // 6. Tính năng "Sử dụng master Menu" (Thêm toàn bộ món đang hiển thị bên phải sang bên trái)
    btnUseMasterMenu.addEventListener('click', () => {
        const keyword = searchDishInput.value.toLowerCase().trim();
        const selectedCategory = filterCategorySelect.value;

        // Lấy tất cả món khớp bộ lọc hiện tại
        const filtered = masterDishes.filter(dish => {
            const matchKeyword = dish.name.toLowerCase().includes(keyword);
            const matchCategory = selectedCategory === '' || dish.category === selectedCategory;
            return matchKeyword && matchCategory;
        });

        let addedCount = 0;
        filtered.forEach(dish => {
            const exists = localDailyItems.some(item => item.dish_id === dish.dish_id);
            if (!exists) {
                localDailyItems.push({
                    dish_id: dish.dish_id,
                    name: dish.name,
                    category: dish.category,
                    price: dish.price,
                    status: 'AVAILABLE'
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            renderDailyMenuTable();
            renderMasterMenuTable();
            alert(`Đã thêm nhanh ${addedCount} món vào thực đơn ngày hôm nay!`);
        } else {
            alert('Tất cả món hiển thị đã nằm trong thực đơn hôm nay rồi.');
        }
    });

    // Tính năng "Thiết lập thay đổi" (Reset danh sách tích chọn của ngày đó về bản đã lưu gần nhất)
    btnResetToLastSaved.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn bỏ các thay đổi chưa lưu để quay về trạng thái đã lưu gần nhất không?')) {
            fetchDailyMenuData(menuDateInput.value);
        }
    });

    // Nút "Hủy thay đổi" (Tải lại toàn bộ dữ liệu)
    btnCancelMenu.addEventListener('click', () => {
        if (confirm('Bạn muốn hủy tất cả các thay đổi vừa chỉnh sửa trên giao diện?')) {
            fetchDailyMenuData(menuDateInput.value);
        }
    });

    // 7. LƯU THỰC ĐƠN: Đồng bộ Client-side State lên Database
    btnSaveMenu.addEventListener('click', async () => {
        const date = menuDateInput.value;
        if (!date) {
            alert('Vui lòng chọn ngày áp dụng thực đơn!');
            return;
        }

        // Hiện cảnh báo xác nhận hành động lưu
        if (!confirm(`Bạn có chắc chắn muốn LƯU toàn bộ thay đổi của thực đơn ngày [${date}] vào Database không?`)) {
            return;
        }

        const chefId = currentChef ? (currentChef.chef_id || currentChef.id) : 1;
        const dishIds = localDailyItems.map(item => item.dish_id);

        toggleLoading(true);
        try {
            // Bước A: Lưu danh sách các món ăn (Insert/Delete transaction)
            const saveResponse = await window.apiClient.post('/daily-menus', {
                date: date,
                dishIds: dishIds,
                createdBy: chefId
            });

            if (!saveResponse || !saveResponse.success) {
                alert(saveResponse ? saveResponse.message : 'Lưu danh sách thực đơn thất bại!');
                return;
            }

            // Bước B: Cập nhật trạng thái phục vụ (AVAILABLE/SOLD_OUT)
            // Lọc ra các món bị đổi trạng thái thành SOLD_OUT hoặc UNAVAILABLE
            const statusChanges = localDailyItems.filter(item => item.status !== 'AVAILABLE');
            
            for (const item of statusChanges) {
                const statusResponse = await window.apiClient.put('/daily-menus/status', {
                    date: date,
                    dishId: item.dish_id,
                    status: item.status
                });
                if (!statusResponse || !statusResponse.success) {
                    console.warn(`Lỗi cập nhật trạng thái cho món [${item.name}]:`, statusResponse ? statusResponse.message : 'Lỗi');
                }
            }

            alert('Đã đồng bộ và lưu thực đơn ngày thành công vào Database!');
            
            // Load lại dữ liệu sạch từ server
            await fetchDailyMenuData(date);

        } catch (error) {
            console.error('Lỗi khi lưu thực đơn:', error);
            alert('Có lỗi xảy ra khi lưu thực đơn vào Database!');
        } finally {
            toggleLoading(false);
        }
    });

    // Theo dõi thay đổi ô tìm kiếm và danh mục lọc
    searchDishInput.addEventListener('input', () => {
        currentPage = 1;
        renderMasterMenuTable();
    });
    filterCategorySelect.addEventListener('change', () => {
        currentPage = 1;
        renderMasterMenuTable();
    });

    // Theo dõi thay đổi số lượng dòng/trang
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value, 10);
        currentPage = 1;
        renderMasterMenuTable();
    });

    // Theo dõi thay đổi ngày áp dụng
    menuDateInput.addEventListener('change', () => {
        fetchDailyMenuData(menuDateInput.value);
    });

    // Khởi động load thực đơn hôm nay khi mở trang
    fetchDailyMenuData(todayStr);
});