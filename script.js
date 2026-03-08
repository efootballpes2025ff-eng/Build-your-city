/**
 * 🏙️ City Builder - نسخة مضمونة 100%
 * مع حماية كاملة من الأخطاء
 */

(function() {
    'use strict';

    console.log('🎮 City Builder - جاري البدء...');

    // ===== البيانات المدمجة =====
    const GAME_DATA = {
        settings: {
            gridSize: 10,
            startMoney: 500,
            startEnergy: 100,
            startHappiness: 50,
            incomeIntervalMs: 1000,
            autoSave: true
        },
        resources: {
            money: "💰",
            energy: "⚡",
            population: "👥",
            happiness: "😊"
        },
        buildings: [
            { id: "house", name: "منزل", cost: 50, incomePerSecond: 2, population: 5, happinessBoost: 2 },
            { id: "factory", name: "مصنع", cost: 150, incomePerSecond: 8, energyUsage: 5, happinessBoost: -3 },
            { id: "solarPlant", name: "محطة شمسية", cost: 200, energyProduction: 15, happinessBoost: 1 },
            { id: "park", name: "حديقة", cost: 80, happinessBoost: 10 },
            { id: "shop", name: "متجر", cost: 100, incomePerSecond: 5, happinessBoost: 3 }
        ],
        levels: [
            { level: 1, requiredMoney: 0 },
            { level: 2, requiredMoney: 1000 },
            { level: 3, requiredMoney: 3000 }
        ]
    };

    const SAVE_KEY = 'cityBuilderSave_v3';

    // حالة اللعبة
    let game = {
        data: null,
        state: {
            money: 500,
            energy: 100,
            population: 0,
            happiness: 50,            level: 1,
            buildings: [],
            selectedBuilding: null
        },
        grid: { size: 10, cells: [] },
        incomeTimer: null
    };

    // ===== وظائف مساعدة آمنة =====
    function $(sel) {
        try {
            return document.querySelector(sel);
        } catch (e) {
            console.error('خطأ في العثور على:', sel, e);
            return null;
        }
    }

    function $$(sel) {
        try {
            return Array.from(document.querySelectorAll(sel));
        } catch (e) {
            console.error('خطأ في العثور على:', sel, e);
            return [];
        }
    }

    // ===== إخفاء التحميل (مهم جداً) =====
    function hideLoading() {
        console.log('👋 إخفاء شاشة التحميل...');
        try {
            const loading = $('#loading');
            if (loading) {
                loading.style.display = 'none';
                console.log('✅ تم إخفاء التحميل');
            } else {
                console.warn('⚠️ عنصر التحميل غير موجود');
            }
        } catch (e) {
            console.error('❌ خطأ في إخفاء التحميل:', e);
        }
    }

    // ===== عرض خطأ =====
    function showError(msg) {
        console.error('❌ خطأ:', msg);
        try {
            hideLoading();
            const errorEl = $('#error');
            const msgEl = $('#errorMessage');            if (errorEl) errorEl.classList.remove('hidden');
            if (msgEl) msgEl.textContent = msg;
        } catch (e) {
            console.error('فشل عرض الخطأ:', e);
            alert('حدث خطأ: ' + msg);
        }
    }

    // ===== Toast =====
    function showToast(msg, type = 'info') {
        try {
            const toast = $('#toast');
            if (!toast) return;
            toast.textContent = msg;
            toast.className = 'toast ' + type + ' show';
            setTimeout(() => toast.classList.remove('show'), 3000);
        } catch (e) {
            console.log('Toast:', msg);
        }
    }

    // ===== تنسيق الأرقام =====
    function formatNumber(num) {
        if (Math.abs(num) >= 1000000) return (num/1000000).toFixed(1) + 'M';
        if (Math.abs(num) >= 1000) return (num/1000).toFixed(1) + 'K';
        return Math.round(num);
    }

    // ===== تهيئة اللعبة =====
    function init() {
        console.log('🚀 بدء تهيئة اللعبة...');
        
        try {
            // خطوة 1: تحميل البيانات
            console.log('📦 تحميل البيانات...');
            game.data = JSON.parse(JSON.stringify(GAME_DATA));
            console.log('✅ البيانات محملة');

            // خطوة 2: إعداد الحالة
            console.log('⚙️ إعداد الحالة...');
            setupState();
            console.log('✅ الحالة معدة');

            // خطوة 3: رسم الواجهة
            console.log('🎨 رسم الواجهة...');
            renderUI();
            console.log('✅ الواجهة مرسومة');

            // خطوة 4: إعداد الأحداث
            console.log('🎯 إعداد الأحداث...');            setupEvents();
            console.log('✅ الأحداث معدة');

            // خطوة 5: تحميل الحفظ
            console.log('💾 تحميل الحفظ...');
            loadSave();
            console.log('✅ الحفظ محمل');

            // خطوة 6: بدء الدخل
            console.log('💰 بدء نظام الدخل...');
            startIncomeLoop();
            console.log('✅ نظام الدخل بدأ');

            // خطوة 7: إخفاء التحميل (الأهم!)
            console.log('👋 إخفاء التحميل...');
            hideLoading();
            console.log('✅ التحميل مخفي');

            // خطوة 8: رسالة ترحيب
            showToast('🎮 مرحباً! لديك 500💰 ابدأ البناء!', 'success');
            console.log('🎉 اللعبة جاهزة!');

        } catch (err) {
            console.error('❌❌❌ خطأ فادح:', err);
            console.error('Stack:', err.stack);
            showError('حدث خطأ أثناء بدء اللعبة: ' + err.message);
        }
    }

    // ===== إعداد الحالة =====
    function setupState() {
        const s = game.data.settings;
        game.grid.size = s.gridSize;
        game.state.money = s.startMoney;
        game.state.energy = s.startEnergy;
        game.state.happiness = s.startHappiness;

        // إنشاء الشبكة
        game.grid.cells = [];
        for (let y = 0; y < game.grid.size; y++) {
            game.grid.cells[y] = [];
            for (let x = 0; x < game.grid.size; x++) {
                game.grid.cells[y][x] = { el: null, building: null };
            }
        }

        // ضبط CSS
        document.documentElement.style.setProperty('--grid-size', game.grid.size);
        console.log('حجم الشبكة:', game.grid.size);
    }
    // ===== رسم الواجهة =====
    function renderUI() {
        console.log('رسم الموارد...');
        renderResources();
        console.log('رسم الشبكة...');
        renderGrid();
        console.log('رسم المتجر...');
        renderStore();
        console.log('تحديث المستوى...');
        updateLevel();
    }

    // عرض الموارد
    function renderResources() {
        const container = $('#resourcesContainer');
        if (!container) {
            console.error('❌ container الموارد غير موجود');
            return;
        }

        const resources = game.data.resources;
        let html = '';

        for (const [key, icon] of Object.entries(resources)) {
            const value = game.state[key] || 0;
            html += `<div class="resource" data-res="${key}">
                <span class="resource-icon">${icon}</span>
                <span class="resource-value">${formatNumber(value)}</span>
            </div>`;
        }

        container.innerHTML = html;
        console.log('✅ الموارد مرسومة');
    }

    // عرض الشبكة
    function renderGrid() {
        const gridEl = $('#gameGrid');
        if (!gridEl) {
            console.error('❌ عنصر الشبكة غير موجود');
            return;
        }

        gridEl.innerHTML = '';

        for (let y = 0; y < game.grid.size; y++) {
            for (let x = 0; x < game.grid.size; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';                cell.dataset.x = x;
                cell.dataset.y = y;

                cell.addEventListener('click', () => handleCellClick(x, y));

                gridEl.appendChild(cell);
                game.grid.cells[y][x].el = cell;
            }
        }

        console.log('✅ الشبكة مرسومة:', game.grid.size, 'x', game.grid.size);
    }

    // عرض المتجر
    function renderStore() {
        const store = $('#storeGrid');
        if (!store) {
            console.error('❌ عنصر المتجر غير موجود');
            return;
        }

        store.innerHTML = '';

        game.data.buildings.forEach(b => {
            const card = document.createElement('div');
            const canAfford = game.state.money >= b.cost;
            card.className = 'building-card' + (canAfford ? '' : ' unaffordable');
            card.dataset.id = b.id;

            const icon = getBuildingIcon(b.id);
            const income = b.incomePerSecond ? `+${b.incomePerSecond}💰` : '';
            const energy = b.energyUsage ? `-⚡${b.energyUsage}` : (b.energyProduction ? `+⚡${b.energyProduction}` : '');
            const pop = b.population ? `👥${b.population}` : '';

            card.innerHTML = `
                <div class="building-name">${icon} ${b.name}</div>
                <div class="building-stats">
                    <span class="building-cost">💰${b.cost}</span>
                    ${income ? `<span class="building-income">${income}/ث</span>` : ''}
                    ${energy ? `<span class="${energy.includes('+') ? 'building-income' : 'building-negative'}">${energy}</span>` : ''}
                    ${pop ? `<span>${pop}</span>` : ''}
                </div>
            `;

            card.addEventListener('click', () => {
                if (!canAfford) {
                    showToast('💰 موارد غير كافية!', 'error');
                    return;
                }
                selectBuilding(b.id);            });

            store.appendChild(card);
        });

        console.log('✅ المتجر مرسوم:', game.data.buildings.length, 'مباني');
    }

    // ===== منطق اللعب =====
    function handleCellClick(x, y) {
        const cell = game.grid.cells[y]?.[x];
        if (!cell) return;

        if (cell.building) {
            const b = getBuildingData(cell.building.type);
            showBuildingInfo(b, {x, y});
            return;
        }

        tryBuild(x, y);
    }

    function tryBuild(x, y) {
        if (!game.state.selectedBuilding) {
            showToast('اختر مبنى أولاً من المتجر', 'error');
            return;
        }

        const b = getBuildingData(game.state.selectedBuilding);
        if (!b) return;

        if (game.grid.cells[y][x].building) {
            showToast('المربع مشغول!', 'error');
            return;
        }

        if (!canAfford(b.cost)) {
            showToast('💰 موارد غير كافية!', 'error');
            return;
        }

        if (b.energyUsage && getAvailableEnergy() < b.energyUsage) {
            showToast('⚡ طاقة غير كافية!', 'error');
            return;
        }

        // البناء!
        spendResource('money', b.cost);

        const building = {            id: b.id + '_' + x + '_' + y + '_' + Date.now(),
            type: b.id,
            x, y
        };

        game.state.buildings.push(building);
        placeBuilding(building);

        if (b.population) addResource('population', b.population);
        if (b.happinessBoost) {
            game.state.happiness = clamp(0, 100, game.state.happiness + b.happinessBoost);
        }

        updateResourcesDisplay();
        renderStore();
        showBuildingInfo(b);
        autoSave();

        showToast(`✅ تم بناء ${b.name}!`, 'success');
    }

    function placeBuilding(building) {
        const cell = game.grid.cells[building.y][building.x];
        const b = getBuildingData(building.type);
        if (!cell || !b) return;

        cell.building = building;
        cell.el.classList.add('occupied');
        cell.el.dataset.building = b.name;
        cell.el.dataset.type = building.type;
        cell.el.dataset.income = b.incomePerSecond ? `+${b.incomePerSecond}💰` : '';
    }

    function selectBuilding(id) {
        game.state.selectedBuilding = id;

        $$('.building-card').forEach(c => c.classList.remove('selected'));
        const card = $(`[data-id="${id}"]`);
        if (card) card.classList.add('selected');
    }

    // ===== الموارد =====
    function canAfford(cost) {
        return game.state.money >= cost;
    }

    function spendResource(res, amount) {
        if (game.state[res] !== undefined) {
            game.state[res] = Math.max(0, game.state[res] - amount);
            return true;        }
        return false;
    }

    function addResource(res, amount) {
        if (game.state[res] === undefined) return;
        if (res === 'happiness') {
            game.state[res] = clamp(0, 100, game.state[res] + amount);
        } else if (res === 'energy') {
            game.state[res] += amount;
        } else {
            game.state[res] = Math.max(0, game.state[res] + amount);
        }
    }

    function getAvailableEnergy() {
        let prod = 0, usage = 0;
        game.state.buildings.forEach(b => {
            const data = getBuildingData(b.type);
            if (data?.energyProduction) prod += data.energyProduction;
            if (data?.energyUsage) usage += data.energyUsage;
        });
        return prod - usage + game.state.energy;
    }

    function getBuildingData(id) {
        return game.data.buildings.find(b => b.id === id);
    }

    function getBuildingIcon(id) {
        const icons = {
            house: '🏠',
            factory: '🏭',
            solarPlant: '☀️',
            park: '🌳',
            shop: '🛒'
        };
        return icons[id] || '🏗️';
    }

    function clamp(min, max, val) {
        return Math.max(min, Math.min(max, val));
    }

    // ===== الدخل التلقائي =====
    function startIncomeLoop() {
        const interval = game.data.settings.incomeIntervalMs || 1000;

        game.incomeTimer = setInterval(() => {
            calculateIncome();        }, interval);

        console.log('✅ الدخل سيحسب كل', interval, 'مللي ثانية');
    }

    function calculateIncome() {
        let moneyInc = 0, energyInc = 0;

        game.state.buildings.forEach(b => {
            const data = getBuildingData(b.type);
            if (!data) return;
            if (data.incomePerSecond) moneyInc += data.incomePerSecond;
            if (data.energyProduction) energyInc += data.energyProduction;
            if (data.energyUsage) energyInc -= data.energyUsage;
        });

        addResource('money', moneyInc);
        addResource('energy', energyInc);

        updateIncomeDisplay(moneyInc);
        updateResourcesDisplay();
    }

    function updateIncomeDisplay(inc) {
        const el = $('#incomeDisplay');
        if (el) {
            el.textContent = `${inc >= 0 ? '+' : ''}${formatNumber(inc)}💰/ث`;
        }
    }

    // ===== تحديث العرض =====
    function updateResourcesDisplay() {
        $$('.resource').forEach(el => {
            const key = el.dataset.res;
            const value = game.state[key] || 0;
            const formatted = formatNumber(value);
            const valEl = el.querySelector('.resource-value');
            if (valEl && valEl.textContent !== formatted) {
                valEl.textContent = formatted;
                el.classList.add('resource-updated');
                setTimeout(() => el.classList.remove('resource-updated'), 300);
            }
        });
        updateLevel();
    }

    function updateLevel() {
        const levels = game.data.levels;
        const current = levels.find(l => game.state.money < (l.requiredMoney || Infinity))
            || levels[levels.length - 1];        if (current && $('#levelDisplay')) {
            game.state.level = current.level;
            $('#levelDisplay').textContent = current.level;
        }
    }

    function showBuildingInfo(b, pos = null) {
        const content = $('#infoContent');
        if (!content) return;
        if (!b) {
            content.innerHTML = '<p class="hint">اختر مبنى من المتجر ثم اضغط على المربع للبناء</p>';
            return;
        }

        const stats = Object.entries(b)
            .filter(([k]) => !['id', 'name', 'cost'].includes(k))
            .map(([k, v]) => {
                const labels = {
                    incomePerSecond: 'الدخل/ث',
                    energyUsage: 'استهلاك الطاقة',
                    energyProduction: 'إنتاج الطاقة',
                    population: 'السكان',
                    happinessBoost: 'السعادة'
                };
                const cls = (k.includes('income') || k.includes('Production') || (k === 'happinessBoost' && v > 0))
                    ? 'building-income'
                    : (k.includes('Usage') || (k === 'happinessBoost' && v < 0))
                    ? 'building-negative'
                    : '';
                return `<div class="info-item">
                    <span class="info-label">${labels[k] || k}:</span>
                    <span class="info-value ${cls}">${v > 0 ? '+' : ''}${v}</span>
                </div>`;
            }).join('');

        content.innerHTML = `
            <h4>${getBuildingIcon(b.id)} ${b.name}</h4>
            <div class="info-item">
                <span class="info-label">التكلفة:</span>
                <span class="info-value building-cost">💰${b.cost}</span>
            </div>
            ${stats}
            ${pos ? `<div class="info-item" style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,.2)">
                <span class="info-label">الموقع:</span>
                <span class="info-value">(${pos.x}, ${pos.y})</span>
            </div>` : ''}
        `;
    }

    // ===== الحفظ =====    function save() {
        try {
            const data = {
                version: '3.0',
                timestamp: Date.now(),
                state: { ...game.state, savedAt: new Date().toISOString() }
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            console.log('💾 تم الحفظ');
            return true;
        } catch (e) {
            console.error('فشل الحفظ:', e);
            return false;
        }
    }

    function loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) {
                console.log('لا يوجد حفظ سابق');
                return false;
            }

            const data = JSON.parse(raw);
            if (data.version !== '3.0') {
                console.log('إصدار الحفظ غير متوافق');
                return false;
            }

            Object.assign(game.state, data.state);

            // إعادة بناء المباني
            game.grid.cells.forEach(row => row.forEach(c => {
                if (c.el) {
                    c.el.className = 'grid-cell';
                    c.el.dataset.building = '';
                    c.el.dataset.type = '';
                    c.el.dataset.income = '';
                }
                c.building = null;
            }));

            game.state.buildings.forEach(b => placeBuilding(b));

            updateResourcesDisplay();
            renderStore();

            console.log('📥 تم تحميل الحفظ');
            return true;        } catch (e) {
            console.error('فشل التحميل:', e);
            return false;
        }
    }

    function autoSave() {
        if (game.data.settings.autoSave !== false) {
            save();
        }
    }

    function clearSave() {
        localStorage.removeItem(SAVE_KEY);
    }

    // ===== الأحداث =====
    function setupEvents() {
        const saveBtn = $('#saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (save()) showToast('💾 تم الحفظ!', 'success');
            });
        }

        const resetBtn = $('#resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('هل أنت متأكد من إعادة بدء اللعبة؟')) {
                    clearSave();
                    location.reload();
                }
            });
        }

        // حفظ تلقائي كل 30 ثانية
        setInterval(autoSave, 30000);

        // حفظ عند الخروج
        window.addEventListener('beforeunload', autoSave);

        console.log('✅ الأحداث معدة');
    }

    // ===== بدء التشغيل =====
    console.log('📋 حالة المستند:', document.readyState);

    if (document.readyState === 'loading') {
        console.log('⏳ انتظار تحميل المستند...');
        document.addEventListener('DOMContentLoaded', function() {            console.log('✅ المستند محمل، بدء اللعبة...');
            init();
        });
    } else {
        console.log('✅ المستند جاهز، بدء اللعبة فوراً...');
        init();
    }

    // نسخة احتياطية - إذا لم تبدأ اللعبة خلال 5 ثواني
    setTimeout(function() {
        const loading = $('#loading');
        if (loading && loading.style.display !== 'none') {
            console.warn('⚠️ التحميل لم يخفَ بعد 5 ثواني، إخفاء قسري...');
            hideLoading();
            showToast('⚠️ حدث تأخير في التحميل', 'warning');
        }
    }, 5000);

})();
