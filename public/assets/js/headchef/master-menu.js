// public/assets/js/headchef/master-menu.js

class MasterMenuManager {
    constructor() {
        this.allDishes = [];
        this.filteredDishes = [];
        this.currentCategory = '';
        this.currentSearch = '';
        this.currentStatus = '';
        this.init();
    }

    async init() {
        await this.loadDishes();
        this.setupEventListeners();
        this.setupModal();
    }

    async loadDishes() {
        try {
            const response = await window.apiClient.get('/dishes');
            this.allDishes = response.data || [];
            this.buildCategoryTabs();
            this.renderStats();
            this.applyFilters();
        } catch (error) {
            console.error('❌ loadDishes failed:', error);
            Toast.error('Không thể tải danh sách món ăn: ' + error.message);
            document.getElementById('mmDishGrid').innerHTML = `
                <div class="mm-empty">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <p>Lỗi tải dữ liệu. Vui lòng thử lại.</p>
                </div>`;
        }
    }

    buildCategoryTabs() {
        const categories = [...new Set(this.allDishes.map(d => d.category).filter(Boolean))].sort();
        const container = document.getElementById('mmCatTabs');
        container.innerHTML = `<button class="mm-cat-tab active" data-cat="">Tất cả (${this.allDishes.length})</button>`;

        categories.forEach(cat => {
            const count = this.allDishes.filter(d => d.category === cat).length;
            const btn = document.createElement('button');
            btn.className = 'mm-cat-tab';
            btn.dataset.cat = cat;
            btn.textContent = `${cat} (${count})`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mm-cat-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = cat;
                this.applyFilters();
            });
            container.appendChild(btn);
        });

        container.querySelector('[data-cat=""]').addEventListener('click', (e) => {
            document.querySelectorAll('.mm-cat-tab').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            this.currentCategory = '';
            this.applyFilters();
        });
    }

    renderStats() {
        const total = this.allDishes.length;
        const active = this.allDishes.filter(d => d.is_active).length;
        const inactive = total - active;
        const categories = new Set(this.allDishes.map(d => d.category).filter(Boolean)).size;

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statActive').textContent = active;
        document.getElementById('statInactive').textContent = inactive;
        document.getElementById('statCategories').textContent = categories;
    }

    applyFilters() {
        let result = [...this.allDishes];
        if (this.currentCategory) result = result.filter(d => d.category === this.currentCategory);
        if (this.currentSearch) {
            const kw = this.currentSearch.toLowerCase();
            result = result.filter(d =>
                (d.name && d.name.toLowerCase().includes(kw)) ||
                (d.description && d.description.toLowerCase().includes(kw))
            );
        }
        if (this.currentStatus !== '') {
            const isActive = this.currentStatus === '1';
            result = result.filter(d => !!d.is_active === isActive);
        }
        this.filteredDishes = result;
        document.getElementById('mmDisplayCount').textContent = result.length;
        this.renderDishes();
    }

    renderDishes() {
        const container = document.getElementById('mmDishGrid');
        if (this.filteredDishes.length === 0) {
            container.innerHTML = `
                <div class="mm-empty">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <p>Không tìm thấy món ăn nào phù hợp.</p>
                </div>`;
            return;
        }

        container.innerHTML = this.filteredDishes.map(dish => {
            const catClass = this.getCatClass(dish.category);
            const isActive = dish.is_active;
            const price = new Intl.NumberFormat('vi-VN').format(dish.price || 0);
            return `
                <div class="mm-dish-card" data-dish-id="${dish.dish_id}" onclick="masterMenuManager.openDishDetail(${dish.dish_id})">
                    <div class="mm-dish-img">
                        ${dish.image_url
                            ? `<img src="${dish.image_url}" alt="${dish.name}" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-utensils\\'></i>'">`
                            : `<i class="fa-solid fa-utensils"></i>`}
                    </div>
                    <div class="mm-dish-body">
                        <div class="mm-dish-name">${dish.name || ''}</div>
                        <span class="mm-dish-cat ${catClass}">${dish.category || 'Khác'}</span>
                        <div class="mm-dish-desc">${dish.description || 'Chưa có mô tả.'}</div>
                        <div class="mm-dish-footer">
                            <span class="mm-dish-price">${price}đ</span>
                            <span class="mm-dish-status ${isActive ? 'active' : 'inactive'}">
                                ${isActive ? 'Đang bán' : 'Tạm ngưng'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    openDishDetail(dishId) {
        const dish = this.allDishes.find(d => d.dish_id === dishId);
        if (!dish) return;

        const catClass = this.getCatClass(dish.category);
        const price = new Intl.NumberFormat('vi-VN').format(dish.price || 0);
        const isActive = dish.is_active;

        document.getElementById('dishModalBody').innerHTML = `
            <div class="dish-modal-layout">
                <div class="dish-modal-img">
                    ${dish.image_url
                        ? `<img src="${dish.image_url}" alt="${dish.name}" onerror="this.src=''">`
                        : `<div class="dish-modal-img-placeholder"><i class="fa-solid fa-utensils"></i></div>`}
                </div>
                <div class="dish-modal-info">
                    <div class="dish-modal-header-row">
                        <h2 class="dish-modal-name">${dish.name}</h2>
                        <span class="mm-dish-status ${isActive ? 'active' : 'inactive'}" style="font-size:13px;padding:4px 12px;">
                            ${isActive ? '<i class="fa-solid fa-circle-check"></i> Đang bán' : '<i class="fa-solid fa-ban"></i> Tạm ngưng'}
                        </span>
                    </div>
                    <div class="dish-modal-meta">
                        <div class="dish-modal-meta-item">
                            <i class="fa-solid fa-tags"></i>
                            <span class="mm-dish-cat ${catClass}" style="margin:0;">${dish.category || 'Khác'}</span>
                        </div>
                        <div class="dish-modal-meta-item">
                            <i class="fa-solid fa-money-bill-wave" style="color:#0969da;"></i>
                            <strong style="font-size:20px;color:#0969da;">${price}đ</strong>
                        </div>
                        <div class="dish-modal-meta-item">
                            <i class="fa-solid fa-hashtag" style="color:#94a3b8;"></i>
                            <span style="color:#64748b;">Mã món: #${dish.dish_id}</span>
                        </div>
                        ${dish.restaurant_name ? `
                        <div class="dish-modal-meta-item">
                            <i class="fa-solid fa-store" style="color:#94a3b8;"></i>
                            <span style="color:#64748b;">${dish.restaurant_name}</span>
                        </div>` : ''}
                    </div>
                    <div class="dish-modal-desc-section">
                        <div class="dish-modal-section-title"><i class="fa-solid fa-align-left"></i> Mô tả món ăn</div>
                        <p class="dish-modal-desc">${dish.description || 'Chưa có mô tả cho món ăn này.'}</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('dishModal').classList.add('open');
    }

    setupModal() {
        // Đóng khi click overlay
        document.getElementById('dishModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('dishModal')) {
                this.closeModal();
            }
        });
        // Đóng bằng ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    closeModal() {
        document.getElementById('dishModal').classList.remove('open');
    }

    getCatClass(category) {
        if (!category) return 'cat-default';
        const c = category.toLowerCase();
        if (c.includes('khai vị')) return 'cat-khai-vi';
        if (c.includes('chính')) return 'cat-mon-chinh';
        if (c.includes('canh') || c.includes('lẩu')) return 'cat-canh';
        if (c.includes('tráng') || c.includes('nước')) return 'cat-trang-mieng';
        return 'cat-default';
    }

    setupEventListeners() {
        document.getElementById('mmSearch').addEventListener('input', (e) => {
            this.currentSearch = e.target.value.trim();
            this.applyFilters();
        });
        document.getElementById('mmStatusFilter').addEventListener('change', (e) => {
            this.currentStatus = e.target.value;
            this.applyFilters();
        });
    }
}

let masterMenuManager;
document.addEventListener('DOMContentLoaded', () => {
    const currentChef = window.checkAuthGuard(['HEAD_CHEF']);
    if (currentChef) {
        document.getElementById('chefNameTxt').textContent = currentChef.name;
        document.getElementById('chefRoleTxt').textContent = 'Bếp Trưởng';
    }
    masterMenuManager = new MasterMenuManager();
});
