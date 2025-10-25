// ===== API SYNC FUNCTIONS =====
const API_URL = window.location.origin;

async function loadFromServer() {
    try {
        const response = await fetch(API_URL + '/api/data');
        const data = await response.json();
        
        // Load modules
        if (data.modules && Object.keys(data.modules).length > 0) {
            MODULES = data.modules;
            console.log('✅ Modules loaded from server:', Object.keys(MODULES).length);
        }
        
        // Load users
        if (data.users && Object.keys(data.users).length > 0) {
            USER_DATABASE = data.users;
            console.log('✅ Users loaded from server:', Object.keys(USER_DATABASE).length);
        }
        
        return true;
    } catch (e) {
        console.error('❌ Failed to load from server:', e);
        return false;
    }
}

async function saveToServer() {
    try {
        const data = {
            modules: MODULES,
            users: USER_DATABASE
        };
        
        const response = await fetch(API_URL + '/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('✅ Data saved to server');
        return true;
    } catch (e) {
        console.error('❌ Failed to save to server:', e);
        return false;
    }
}

// ===== USER DATABASE =====
let USER_DATABASE = {};

function loadUsersDatabase() {
    const savedUsers = localStorage.getItem('dwbi_users_database');
    if (savedUsers) {
        try {
            USER_DATABASE = JSON.parse(savedUsers);
            console.log('✅ پایگاه کاربران بارگیری شد:', Object.keys(USER_DATABASE).length);
        } catch (e) {
            console.error('خطا در بارگیری کاربران:', e);
            createDefaultUsers();
        }
    } else {
        createDefaultUsers();
    }
}

function createDefaultUsers() {
    USER_DATABASE = {
        'admin': {
            password: 'admin123',
            role: 'admin',
            fullName: 'مدیر سیستم',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        },
        'editor1': {
            password: 'editor123',
            role: 'editor',
            fullName: 'ویرایشگر اول',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        },
        'user1': {
            password: 'user123',
            role: 'user',
            fullName: 'کاربر معمولی',
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        }
    };
    saveUsersDatabase();
    console.log('✅ کاربران پیش‌فرض ایجاد شد');
}

function saveUsersDatabase() {
    localStorage.setItem('dwbi_users_database', JSON.stringify(USER_DATABASE));
    saveToServer();
}

// ===== GLOBAL VARIABLES =====
const USER_KEY = 'dwbi_session_token';
const MODULES_KEY = 'dwbi_modules';
const BACKUP_PATH_KEY = 'dwbi_backup_path';

let currentUser = null;
let currentRole = null;
let currentModule = null;
let isEditMode = false;
let MODULES = {};

// ===== PERMISSIONS =====
const PERMISSIONS = {
    admin: { 
        edit: true, 
        addRow: true, 
        addCol: true, 
        deleteRow: true, 
        deleteCol: true, 
        addModule: true,
        editModule: true,
        deleteModule: true,
        viewUsers: true,
        manageUsers: true,
        viewBackup: true,
        createBackup: true,
        restoreBackup: true,
        autoBackup: true
    },
    editor: { 
        edit: true, 
        addRow: true, 
        addCol: false, 
        deleteRow: true, 
        deleteCol: false, 
        addModule: true,
        editModule: false,
        deleteModule: false,
        viewUsers: false,
        manageUsers: false,
        viewBackup: false,
        createBackup: false,
        restoreBackup: false,
        autoBackup: false
    },
    user: { 
        edit: false, 
        addRow: false, 
        addCol: false, 
        deleteRow: false, 
        deleteCol: false, 
        addModule: false,
        editModule: false,
        deleteModule: false,
        viewUsers: false,
        manageUsers: false,
        viewBackup: false,
        createBackup: false,
        restoreBackup: false,
        autoBackup: false
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 اپلیکیشن در حال راه‌اندازی...');
    
    loadUsersDatabase();
    loadModules();
    
    // Load from server first
    await loadFromServer();
    
    initLogin();
    initEventListeners();
    loadUserSession();
    loadBackupPath();
    
    console.log('✅ راه‌اندازی کامل شد');
});

// ===== MODULE SYSTEM =====
function loadModules() {
    const saved = localStorage.getItem(MODULES_KEY);
    if (saved) {
        try {
            MODULES = JSON.parse(saved);
            console.log('✅ ماژول‌ها بارگیری شد:', Object.keys(MODULES).length);
        } catch (e) {
            console.error('خطا در بارگیری ماژول‌ها:', e);
            createDefaultModules();
        }
    } else {
        createDefaultModules();
    }
}

function createDefaultModules() {
    MODULES = {
        'servers': {
            id: 'servers',
            name: 'سرورها',
            columns: ['نام سرور', 'IP', 'وضعیت', 'سیستم‌عامل', 'CPU', 'RAM', 'توضیحات'],
            data: [
                ['Server-01', '192.168.1.10', 'فعال', 'Ubuntu 22.04', '8 Core', '32GB', 'سرور وب اصلی'],
                ['Server-02', '192.168.1.11', 'فعال', 'CentOS 8', '16 Core', '64GB', 'سرور دیتابیس'],
                ['Server-03', '192.168.1.12', 'غیرفعال', 'Windows Server 2019', '4 Core', '16GB', 'سرور بکاپ']
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        },
        'network': {
            id: 'network',
            name: 'شبکه',
            columns: ['نام تجهیز', 'نوع', 'IP', 'پورت', 'وضعیت', 'مدل', 'محل'],
            data: [
                ['Switch-Core', 'سوئیچ', '192.168.1.1', '48', 'فعال', 'Cisco 2960', 'اتاق سرور'],
                ['Router-Main', 'روتر', '192.168.1.254', '24', 'فعال', 'Mikrotik RB4011', 'اتاق شبکه'],
                ['Firewall-01', 'فایروال', '192.168.1.2', '8', 'فعال', 'pfSense', 'اتاق سرور']
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        },
        'software': {
            id: 'software',
            name: 'نرم‌افزارها',
            columns: ['نام نرم‌افزار', 'نسخه', 'سازنده', 'لایسنس', 'تعداد', 'انقضا', 'وضعیت'],
            data: [
                ['Windows 10 Pro', '21H2', 'Microsoft', 'Volume', '50', '2025-12-31', 'فعال'],
                ['Microsoft Office', '2021', 'Microsoft', 'Retail', '25', '2026-06-30', 'فعال'],
                ['AutoCAD', '2024', 'Autodesk', 'Network', '10', '2025-03-15', 'فعال']
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        },
        'hardware': {
            id: 'hardware',
            name: 'سخت‌افزار',
            columns: ['نام', 'نوع', 'مدل', 'سریال', 'محل', 'خریداری', 'وضعیت'],
            data: [
                ['PC-001', 'کامپیوتر', 'Dell OptiPlex 7090', 'ABC123456', 'واحد IT', '1402/01/15', 'فعال'],
                ['Printer-01', 'پرینتر', 'HP LaserJet Pro', 'XYZ789012', 'اتاق اداری', '1401/08/22', 'فعال'],
                ['UPS-Main', 'یو‌پی‌اس', 'APC Smart 3000VA', 'UPS456789', 'اتاق سرور', '1400/12/10', 'فعال']
            ],
            createdAt: new Date().toISOString(),
            createdBy: 'system'
        }
    };
    saveModules();
    console.log('✅ ماژول‌های پیش‌فرض ایجاد شد');
}

function saveModules() {
    localStorage.setItem(MODULES_KEY, JSON.stringify(MODULES));
    saveToServer();
    console.log('💾 ماژول‌ها ذخیره شد');
}

function renderModulesMenu() {
    const submenu = document.getElementById('resourcesSubmenu');
    submenu.innerHTML = '';
    
    Object.values(MODULES).forEach(module => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'nav-item';
        item.dataset.module = module.id;
        item.innerHTML = `
            <span>📋</span>
            <span>${module.name}</span>
        `;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchToModule(module.id);
        });
        submenu.appendChild(item);
    });
}

function createModulePage(moduleId) {
    const module = MODULES[moduleId];
    const container = document.getElementById('modulePagesContainer');
    
    console.log('✅ در حال ساخت صفحه برای ماژول:', moduleId, module.name);
    
    const existing = document.getElementById(`module-${moduleId}`);
    if (existing) existing.remove();
    
    const page = document.createElement('div');
    page.id = `module-${moduleId}`;
    page.className = 'page';
    page.innerHTML = `
        <div class="page-header">
            <div>
                <h1>📋 ${module.name}</h1>
                <p>مدیریت ${module.name}</p>
            </div>
            <div class="header-actions">
                <button class="btn btn-primary module-edit-btn" data-module="${moduleId}">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
                    <span class="edit-mode-text">فعال ویرایش</span>
                </button>
                <button class="btn btn-success module-save-btn" data-module="${moduleId}" style="display: none;">💾 ذخیره</button>
                <button class="btn btn-secondary module-cancel-btn" data-module="${moduleId}" style="display: none;">❌ لغو</button>
            </div>
        </div>
        
        <div class="toolbar">
            <div class="toolbar-group">
                <button class="btn btn-sm module-add-row-btn" data-module="${moduleId}" disabled>➕ ردیف</button>
                <button class="btn btn-sm module-add-col-btn" data-module="${moduleId}" disabled>➕ ستون</button>
                <button class="btn btn-sm btn-danger module-delete-row-btn" data-module="${moduleId}" disabled>🗑️ حذف ردیف‌ها</button>
                <button class="btn btn-sm btn-danger module-delete-col-btn" data-module="${moduleId}" disabled>🗑️ حذف ستون‌ها</button>
            </div>
            <div class="toolbar-group" style="display: flex; gap: 8px; align-items: center;">
                <input type="text" class="search-input module-search-input" data-module="${moduleId}" placeholder="🔍 جستجو..." style="margin: 0;">
                <button class="btn btn-sm module-edit-name-btn" data-module="${moduleId}" style="background: #8b5cf6; color: white;">✏️ ویرایش نام</button>
                <button class="btn btn-sm module-delete-btn" data-module="${moduleId}" style="background: #ef4444; color: white;">🗑️ حذف ماژول</button>
            </div>
            <div class="toolbar-group" style="display: flex; gap: 8px; align-items: center;">
                <input type="file" id="excelUpload-${moduleId}" accept=".xlsx,.xls" style="display: none;">
                <button class="btn btn-sm btn-success module-upload-excel-btn" data-module="${moduleId}" style="background: #10b981; color: white;">📊 آپلود اکسل</button>
                <button class="btn btn-sm btn-info module-export-excel-btn" data-module="${moduleId}" style="background: #3b82f6; color: white;">📈 دانلود اکسل</button>
                <button class="btn btn-sm btn-warning module-generate-report-btn" data-module="${moduleId}" style="background: #f59e0b; color: white;">📋 گزارش</button>
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table module-table" data-module="${moduleId}">
                <thead class="module-thead"></thead>
                <tbody class="module-tbody"></tbody>
            </table>
        </div>
    `;
    
    container.appendChild(page);
    console.log('✅ صفحه ماژول ساخته شد، در حال رندر جدول...');
    renderModuleTable(moduleId);
    console.log('✅ در حال اتصال Event Listeners...');
    attachModuleEvents(moduleId);
    console.log('✅ ماژول کامل شد!');
}

function renderModuleTable(moduleId) {
    const module = MODULES[moduleId];
    if (!module) {
        console.error('❌ ماژول یافت نشد:', moduleId);
        return;
    }
    
    const thead = document.querySelector(`#module-${moduleId} .module-thead`);
    const tbody = document.querySelector(`#module-${moduleId} .module-tbody`);
    
    if (!thead || !tbody) {
        console.error('❌ جدول یافت نشد برای ماژول:', moduleId);
        return;
    }
    
    const showCheckboxes = PERMISSIONS[currentRole].deleteRow || PERMISSIONS[currentRole].deleteCol;
    
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    if (showCheckboxes) {
        const thCheckbox = document.createElement('th');
        thCheckbox.innerHTML = '<input type="checkbox" class="column-checkbox select-all-rows" data-module="' + moduleId + '">';
        headerRow.appendChild(thCheckbox);
    }
    
    module.columns.forEach((col, index) => {
        const th = document.createElement('th');
        th.className = 'selectable';
        
        if (showCheckboxes && PERMISSIONS[currentRole].deleteCol) {
            th.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <input type="checkbox" class="column-checkbox" data-module="${moduleId}" data-col="${index}">
                    <span>${col}</span>
                </div>
            `;
        } else {
            th.innerHTML = `<span>${col}</span>`;
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    tbody.innerHTML = '';
    module.data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        tr.dataset.rowIndex = rowIndex;
        
        if (showCheckboxes) {
            const tdCheckbox = document.createElement('td');
            tdCheckbox.className = 'checkbox-cell';
            tdCheckbox.innerHTML = `<input type="checkbox" class="table-checkbox row-checkbox" data-module="${moduleId}" data-row="${rowIndex}">`;
            tr.appendChild(tdCheckbox);
        }
        
        row.forEach((cell) => {
            const td = document.createElement('td');
            td.textContent = cell || '';
            td.contentEditable = 'false';
            td.style.cursor = 'default';
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    console.log('✅ جدول رندر شد:', moduleId, 'ردیف‌ها:', module.data.length);
    updateDeleteButtonsState(moduleId);
}

function attachModuleEvents(moduleId) {
    console.log('🔌 اتصال Event Listeners برای ماژول:', moduleId);
    
    const canEdit = PERMISSIONS[currentRole].edit;
    const canAddRow = PERMISSIONS[currentRole].addRow;
    const canAddCol = PERMISSIONS[currentRole].addCol;
    const canDeleteRow = PERMISSIONS[currentRole].deleteRow;
    const canDeleteCol = PERMISSIONS[currentRole].deleteCol;
    const canEditModule = PERMISSIONS[currentRole].editModule;
    const canDeleteModule = PERMISSIONS[currentRole].deleteModule;
    
    console.log('🔐 مجوزهای کاربر:', { 
        role: currentRole, 
        canEdit, 
        canAddRow, 
        canAddCol, 
        canDeleteRow, 
        canDeleteCol,
        canEditModule,
        canDeleteModule
    });
    
    const editBtn = document.querySelector(`.module-edit-btn[data-module="${moduleId}"]`);
    if (editBtn) {
        if (canEdit) {
            editBtn.onclick = () => toggleModuleEditMode(moduleId);
            editBtn.style.display = 'inline-flex';
            console.log('✅ دکمه ویرایش فعال شد');
        } else {
            editBtn.style.display = 'none';
            console.log('❌ دکمه ویرایش مخفی شد (بدون مجوز)');
        }
    }
    
    const saveBtn = document.querySelector(`.module-save-btn[data-module="${moduleId}"]`);
    if (saveBtn) {
        saveBtn.onclick = () => saveModuleChanges(moduleId);
    }
    
    const cancelBtn = document.querySelector(`.module-cancel-btn[data-module="${moduleId}"]`);
    if (cancelBtn) {
        cancelBtn.onclick = () => cancelModuleChanges(moduleId);
    }
    
    const addRowBtn = document.querySelector(`.module-add-row-btn[data-module="${moduleId}"]`);
    if (addRowBtn) {
        if (canAddRow) {
            addRowBtn.onclick = () => addModuleRow(moduleId);
        } else {
            addRowBtn.style.display = 'none';
            console.log('❌ دکمه افزودن ردیف مخفی شد');
        }
    }
    
    const addColBtn = document.querySelector(`.module-add-col-btn[data-module="${moduleId}"]`);
    if (addColBtn) {
        if (canAddCol) {
            addColBtn.onclick = () => addModuleColumn(moduleId);
        } else {
            addColBtn.style.display = 'none';
            console.log('❌ دکمه افزودن ستون مخفی شد');
        }
    }
    
    const deleteRowBtn = document.querySelector(`.module-delete-row-btn[data-module="${moduleId}"]`);
    if (deleteRowBtn) {
        if (canDeleteRow) {
            deleteRowBtn.onclick = () => deleteSelectedRows(moduleId);
        } else {
            deleteRowBtn.style.display = 'none';
            console.log('❌ دکمه حذف ردیف مخفی شد');
        }
    }
    
    const deleteColBtn = document.querySelector(`.module-delete-col-btn[data-module="${moduleId}"]`);
    if (deleteColBtn) {
        if (canDeleteCol) {
            deleteColBtn.onclick = () => deleteSelectedColumns(moduleId);
        } else {
            deleteColBtn.style.display = 'none';
            console.log('❌ دکمه حذف ستون مخفی شد');
        }
    }
    
    const editNameBtn = document.querySelector(`.module-edit-name-btn[data-module="${moduleId}"]`);
    if (editNameBtn) {
        if (canEditModule) {
            editNameBtn.onclick = () => {
                console.log('🖊️ کلیک روی ویرایش نام ماژول:', moduleId);
                editModuleName(moduleId);
            };
            editNameBtn.style.display = 'inline-block';
            console.log('✅ دکمه ویرایش نام فعال شد');
        } else {
            editNameBtn.style.display = 'none';
            console.log('❌ دکمه ویرایش نام مخفی شد (بدون مجوز)');
        }
    }
    
    const deleteModuleBtn = document.querySelector(`.module-delete-btn[data-module="${moduleId}"]`);
    if (deleteModuleBtn) {
        if (canDeleteModule) {
            deleteModuleBtn.onclick = () => {
                console.log('🗑️ کلیک روی حذف ماژول:', moduleId);
                deleteModule(moduleId);
            };
            deleteModuleBtn.style.display = 'inline-block';
            console.log('✅ دکمه حذف ماژول فعال شد');
        } else {
            deleteModuleBtn.style.display = 'none';
            console.log('❌ دکمه حذف ماژول مخفی شد (بدون مجوز)');
        }
    }
    
    const searchInput = document.querySelector(`.module-search-input[data-module="${moduleId}"]`);
    if (searchInput) {
        searchInput.oninput = (e) => searchModuleTable(moduleId, e.target.value);
    }
    
    // Excel Upload Button
    const uploadExcelBtn = document.querySelector(`.module-upload-excel-btn[data-module="${moduleId}"]`);
    if (uploadExcelBtn) {
        uploadExcelBtn.onclick = () => {
            document.getElementById(`excelUpload-${moduleId}`).click();
        };
    }
    
    // Excel Upload File Input
    const excelUploadInput = document.getElementById(`excelUpload-${moduleId}`);
    if (excelUploadInput) {
        excelUploadInput.onchange = (e) => {
            if (e.target.files[0]) {
                uploadExcelFile(moduleId, e.target.files[0]);
            }
        };
    }
    
    // Excel Export Button
    const exportExcelBtn = document.querySelector(`.module-export-excel-btn[data-module="${moduleId}"]`);
    if (exportExcelBtn) {
        exportExcelBtn.onclick = () => exportToExcel(moduleId);
    }
    
    // Generate Report Button
    const generateReportBtn = document.querySelector(`.module-generate-report-btn[data-module="${moduleId}"]`);
    if (generateReportBtn) {
        generateReportBtn.onclick = () => generateModuleReport(moduleId);
    }
    
    if (canDeleteRow || canDeleteCol) {
        const selectAllCheckbox = document.querySelector(`.select-all-rows[data-module="${moduleId}"]`);
        if (selectAllCheckbox) {
            selectAllCheckbox.onchange = (e) => toggleAllRows(moduleId, e.target.checked);
        }
        
        document.querySelectorAll(`.row-checkbox[data-module="${moduleId}"]`).forEach(cb => {
            cb.onchange = () => updateDeleteButtonsState(moduleId);
        });
        
        document.querySelectorAll(`.column-checkbox[data-module="${moduleId}"]`).forEach(cb => {
            cb.onchange = () => updateDeleteButtonsState(moduleId);
        });
    }
    
    console.log('✅ همه Event Listeners متصل شدند');
}

function toggleAllRows(moduleId, checked) {
    document.querySelectorAll(`.row-checkbox[data-module="${moduleId}"]`).forEach(cb => {
        cb.checked = checked;
    });
    updateDeleteButtonsState(moduleId);
}

function updateDeleteButtonsState(moduleId) {
    const selectedRows = document.querySelectorAll(`.row-checkbox[data-module="${moduleId}"]:checked`).length;
    const selectedCols = document.querySelectorAll(`.column-checkbox[data-module="${moduleId}"][data-col]:checked`).length;
    
    const deleteRowBtn = document.querySelector(`.module-delete-row-btn[data-module="${moduleId}"]`);
    const deleteColBtn = document.querySelector(`.module-delete-col-btn[data-module="${moduleId}"]`);
    
    if (deleteRowBtn) deleteRowBtn.disabled = selectedRows === 0;
    if (deleteColBtn) deleteColBtn.disabled = selectedCols === 0;
}

function toggleModuleEditMode(moduleId) {
    if (!PERMISSIONS[currentRole].edit) {
        showToast('⛔ شما مجاز به ویرایش نیستید', 'error');
        return;
    }
    
    const table = document.querySelector(`#module-${moduleId} .module-table`);
    const firstCell = table.querySelector('tbody td:not(.checkbox-cell)');
    
    const isCurrentlyEditable = firstCell && firstCell.contentEditable === 'true';
    const shouldEnableEdit = !isCurrentlyEditable;
    
    console.log('🔧 Toggle Edit Mode:', { moduleId, isCurrentlyEditable, shouldEnableEdit });
    
    document.querySelectorAll(`#module-${moduleId} .module-table tbody td:not(.checkbox-cell)`).forEach(td => {
        td.contentEditable = shouldEnableEdit;
        if (shouldEnableEdit) {
            td.style.cursor = 'text';
            td.style.backgroundColor = '#fffbeb';
        } else {
            td.style.cursor = 'default';
            td.style.backgroundColor = '';
        }
    });
    
    const editBtn = document.querySelector(`.module-edit-btn[data-module="${moduleId}"]`);
    const saveBtn = document.querySelector(`.module-save-btn[data-module="${moduleId}"]`);
    const cancelBtn = document.querySelector(`.module-cancel-btn[data-module="${moduleId}"]`);
    const addRowBtn = document.querySelector(`.module-add-row-btn[data-module="${moduleId}"]`);
    const addColBtn = document.querySelector(`.module-add-col-btn[data-module="${moduleId}"]`);
    
    if (shouldEnableEdit) {
        if (editBtn) editBtn.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';
        if (addRowBtn && PERMISSIONS[currentRole].addRow) addRowBtn.disabled = false;
        if (addColBtn && PERMISSIONS[currentRole].addCol) addColBtn.disabled = false;
        showToast('✏️ حالت ویرایش فعال شد - می‌توانید روی سلول‌ها کلیک کنید', 'info');
    } else {
        if (editBtn) editBtn.style.display = 'inline-flex';
        if (saveBtn) saveBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (addRowBtn) addRowBtn.disabled = true;
        if (addColBtn) addColBtn.disabled = true;
        showToast('حالت ویرایش غیرفعال شد', 'info');
    }
}

function saveModuleChanges(moduleId) {
    const module = MODULES[moduleId];
    const tbody = document.querySelector(`#module-${moduleId} .module-tbody`);
    
    const newData = Array.from(tbody.querySelectorAll('tr')).map(tr => {
        return Array.from(tr.querySelectorAll('td:not(.checkbox-cell)')).map(td => td.textContent.trim());
    });
    
    module.data = newData;
    module.lastModified = new Date().toISOString();
    module.modifiedBy = currentUser.username;
    
    saveModules();
    
    document.querySelectorAll(`#module-${moduleId} .module-table tbody td:not(.checkbox-cell)`).forEach(td => {
        td.contentEditable = 'false';
        td.style.cursor = 'default';
        td.style.backgroundColor = '';
    });
    
    const editBtn = document.querySelector(`.module-edit-btn[data-module="${moduleId}"]`);
    const saveBtn = document.querySelector(`.module-save-btn[data-module="${moduleId}"]`);
    const cancelBtn = document.querySelector(`.module-cancel-btn[data-module="${moduleId}"]`);
    const addRowBtn = document.querySelector(`.module-add-row-btn[data-module="${moduleId}"]`);
    const addColBtn = document.querySelector(`.module-add-col-btn[data-module="${moduleId}"]`);
    
    if (editBtn) editBtn.style.display = 'inline-flex';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (addRowBtn) addRowBtn.disabled = true;
    if (addColBtn) addColBtn.disabled = true;
    
    updateDashboardStats();
    showToast('✅ تغییرات ذخیره شد', 'success');
}

function cancelModuleChanges(moduleId) {
    if (confirm('آیا مطمئن هستید که می‌خواهید تغییرات را لغو کنید؟')) {
        renderModuleTable(moduleId);
        attachModuleEvents(moduleId);
        showToast('تغییرات لغو شد', 'info');
    }
}

function addModuleRow(moduleId) {
    if (!PERMISSIONS[currentRole].addRow) {
        showToast('⛔ شما مجاز به افزودن ردیف نیستید', 'error');
        return;
    }
    
    const module = MODULES[moduleId];
    const tbody = document.querySelector(`#module-${moduleId} .module-tbody`);
    
    const tr = document.createElement('tr');
    tr.dataset.rowIndex = module.data.length;
    
    const showCheckboxes = PERMISSIONS[currentRole].deleteRow || PERMISSIONS[currentRole].deleteCol;
    if (showCheckboxes) {
        const tdCheckbox = document.createElement('td');
        tdCheckbox.className = 'checkbox-cell';
        tdCheckbox.innerHTML = `<input type="checkbox" class="table-checkbox row-checkbox" data-module="${moduleId}" data-row="${module.data.length}">`;
        tr.appendChild(tdCheckbox);
    }
    
    module.columns.forEach(() => {
        const td = document.createElement('td');
        td.contentEditable = 'true';
        td.style.cursor = 'text';
        td.style.backgroundColor = '#fffbeb';
        tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
    
    if (showCheckboxes) {
        const checkbox = tr.querySelector('.row-checkbox');
        if (checkbox) checkbox.onchange = () => updateDeleteButtonsState(moduleId);
    }
    
    showToast('ردیف جدید اضافه شد', 'success');
}

function addModuleColumn(moduleId) {
    if (!PERMISSIONS[currentRole].addCol) {
        showToast('⛔ شما مجاز به افزودن ستون نیستید', 'error');
        return;
    }
    
    const columnName = prompt('نام ستون جدید را وارد کنید:');
    if (!columnName || !columnName.trim()) return;
    
    const module = MODULES[moduleId];
    module.columns.push(columnName.trim());
    
    const showCheckboxes = PERMISSIONS[currentRole].deleteRow || PERMISSIONS[currentRole].deleteCol;
    
    const thead = document.querySelector(`#module-${moduleId} .module-thead tr`);
    const th = document.createElement('th');
    th.className = 'selectable';
    const colIndex = module.columns.length - 1;
    
    if (showCheckboxes && PERMISSIONS[currentRole].deleteCol) {
        th.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <input type="checkbox" class="column-checkbox" data-module="${moduleId}" data-col="${colIndex}">
                <span>${columnName.trim()}</span>
            </div>
        `;
    } else {
        th.innerHTML = `<span>${columnName.trim()}</span>`;
    }
    thead.appendChild(th);
    
    document.querySelectorAll(`#module-${moduleId} .module-tbody tr`).forEach(tr => {
        const td = document.createElement('td');
        td.contentEditable = 'true';
        td.style.cursor = 'text';
        td.style.backgroundColor = '#fffbeb';
        tr.appendChild(td);
    });
    
    if (showCheckboxes && PERMISSIONS[currentRole].deleteCol) {
        const checkbox = th.querySelector('.column-checkbox');
        if (checkbox) checkbox.onchange = () => updateDeleteButtonsState(moduleId);
    }
    
    showToast(`ستون "${columnName.trim()}" اضافه شد`, 'success');
}

function deleteSelectedRows(moduleId) {
    if (!PERMISSIONS[currentRole].deleteRow) {
        showToast('⛔ شما مجاز به حذف ردیف نیستید', 'error');
        return;
    }
    
    const selectedCheckboxes = document.querySelectorAll(`.row-checkbox[data-module="${moduleId}"]:checked`);
    
    if (selectedCheckboxes.length === 0) {
        showToast('لطفاً ردیف‌هایی را برای حذف انتخاب کنید', 'error');
        return;
    }
    
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ${selectedCheckboxes.length} ردیف را حذف کنید؟`)) {
        return;
    }
    
    const indices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.row)).sort((a, b) => b - a);
    
    indices.forEach(index => {
        MODULES[moduleId].data.splice(index, 1);
    });
    
    renderModuleTable(moduleId);
    attachModuleEvents(moduleId);
    saveModules();
    showToast(`${selectedCheckboxes.length} ردیف حذف شد`, 'success');
}

function deleteSelectedColumns(moduleId) {
    if (!PERMISSIONS[currentRole].deleteCol) {
        showToast('⛔ شما مجاز به حذف ستون نیستید', 'error');
        return;
    }
    
    const selectedCheckboxes = document.querySelectorAll(`.column-checkbox[data-module="${moduleId}"][data-col]:checked`);
    
    if (selectedCheckboxes.length === 0) {
        showToast('لطفاً ستون‌هایی را برای حذف انتخاب کنید', 'error');
        return;
    }
    
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ${selectedCheckboxes.length} ستون را حذف کنید؟`)) {
        return;
    }
    
    const indices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.col)).sort((a, b) => b - a);
    const module = MODULES[moduleId];
    
    indices.forEach(index => {
        module.columns.splice(index, 1);
        module.data.forEach(row => {
            row.splice(index, 1);
        });
    });
    
    renderModuleTable(moduleId);
    attachModuleEvents(moduleId);
    saveModules();
    showToast(`${selectedCheckboxes.length} ستون حذف شد`, 'success');
}

function searchModuleTable(moduleId, term) {
    const rows = document.querySelectorAll(`#module-${moduleId} .module-tbody tr`);
    
    rows.forEach(row => {
        const text = Array.from(row.querySelectorAll('td:not(.checkbox-cell)'))
            .map(td => td.textContent.toLowerCase())
            .join(' ');
        
        row.style.display = text.includes(term.toLowerCase()) ? '' : 'none';
    });
}

function editModuleName(moduleId) {
    if (!PERMISSIONS[currentRole].editModule) {
        showToast('⛔ شما مجاز به ویرایش ماژول نیستید', 'error');
        return;
    }
    
    console.log('📝 شروع ویرایش نام ماژول:', moduleId);
    const module = MODULES[moduleId];
    const newName = prompt('نام جدید ماژول را وارد کنید:', module.name);
    
    if (!newName || !newName.trim()) {
        console.log('❌ نام خالی وارد شد');
        return;
    }
    if (newName.trim() === module.name) {
        console.log('❌ نام تغییر نکرد');
        return;
    }
    
    console.log('✅ نام جدید:', newName.trim());
    module.name = newName.trim();
    saveModules();
    
    renderModulesMenu();
    
    const pageTitle = document.querySelector(`#module-${moduleId} .page-header h1`);
    if (pageTitle) {
        pageTitle.textContent = `📋 ${module.name}`;
    }
    
    const pageSubtitle = document.querySelector(`#module-${moduleId} .page-header p`);
    if (pageSubtitle) {
        pageSubtitle.textContent = `مدیریت ${module.name}`;
    }
    
    showToast(`نام ماژول به "${newName.trim()}" تغییر یافت`, 'success');
}

function deleteModule(moduleId) {
    if (!PERMISSIONS[currentRole].deleteModule) {
        showToast('⛔ شما مجاز به حذف ماژول نیستید', 'error');
        return;
    }
    
    console.log('🗑️ شروع حذف ماژول:', moduleId);
    const module = MODULES[moduleId];
    
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ماژول "${module.name}" را حذف کنید؟\n\n⚠️ این عملیات غیرقابل بازگشت است و تمام داده‌های این ماژول حذف خواهند شد!`)) {
        console.log('❌ حذف لغو شد');
        return;
    }
    
    console.log('✅ حذف تایید شد');
    
    delete MODULES[moduleId];
    saveModules();
    
    const modulePage = document.getElementById(`module-${moduleId}`);
    if (modulePage) {
        modulePage.remove();
    }
    
    switchPage('dashboard');
    
    renderModulesMenu();
    updateDashboardStats();
    
    showToast(`ماژول "${module.name}" حذف شد`, 'success');
    console.log('✅ ماژول حذف شد:', module.name);
}

function switchToModule(moduleId) {
    currentModule = moduleId;
    
    if (!document.getElementById(`module-${moduleId}`)) {
        createModulePage(moduleId);
    } else {
        attachModuleEvents(moduleId);
    }
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`module-${moduleId}`).classList.add('active');
    const navItem = document.querySelector(`[data-module="${moduleId}"]`);
    if (navItem) navItem.classList.add('active');
    
    console.log('📂 ماژول فعال:', moduleId);
}

// ===== LOGIN SYSTEM =====
function initLogin() {
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    
    function validateInputs() {
        const isValid = username.value.trim() !== '' && password.value !== '';
        loginBtn.disabled = !isValid;
        return isValid;
    }
    
    username.addEventListener('input', validateInputs);
    password.addEventListener('input', validateInputs);
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    togglePassword.addEventListener('click', function() {
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        
        const path = type === 'text' 
            ? 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z'
            : 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
        this.querySelector('path').setAttribute('d', path);
    });
}

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    
    usernameError.textContent = '';
    passwordError.textContent = '';
    document.getElementById('username').classList.remove('error');
    document.getElementById('password').classList.remove('error');
    
    loginBtn.disabled = true;
    loginText.style.display = 'none';
    loginSpinner.style.display = 'block';
    
    setTimeout(() => {
        const userRecord = USER_DATABASE[username];
        
        if (!userRecord) {
            document.getElementById('username').classList.add('error');
            usernameError.textContent = 'نام کاربری یافت نشد';
            showToast('نام کاربری اشتباه است', 'error');
            resetLoginButton();
            return;
        }
        
        if (userRecord.password !== password) {
            document.getElementById('password').classList.add('error');
            passwordError.textContent = 'رمز عبور اشتباه است';
            showToast('رمز عبور نادرست است', 'error');
            resetLoginButton();
            return;
        }
        
        currentUser = {
            username: username,
            fullName: userRecord.fullName,
            role: userRecord.role,
            loginTime: new Date().toISOString()
        };
        currentRole = userRecord.role;
        
        const sessionToken = btoa(JSON.stringify({
            username: username,
            role: userRecord.role,
            timestamp: Date.now()
        }));
        
        localStorage.setItem(USER_KEY, sessionToken);
        
        console.log('✅ ورود موفق:', currentUser);
        
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        
        updateUserDisplay();
        applyPermissions();
        renderModulesMenu();
        updateDashboardStats();
        
        showToast(`خوش آمدید ${userRecord.fullName}!`, 'success');
        
        if (PERMISSIONS[currentRole].autoBackup) {
            setTimeout(() => {
                createBackup(true);
            }, 2000);
        }
        
        resetLoginButton();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }, 1000);
}

function resetLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    loginText.style.display = 'block';
    loginSpinner.style.display = 'none';
    loginBtn.disabled = false;
}

function loadUserSession() {
    const savedToken = localStorage.getItem(USER_KEY);
    if (savedToken) {
        try {
            const sessionData = JSON.parse(atob(savedToken));
            const hoursPassed = (Date.now() - sessionData.timestamp) / (1000 * 60 * 60);
            
            if (hoursPassed < 24) {
                const userRecord = USER_DATABASE[sessionData.username];
                if (userRecord && userRecord.role === sessionData.role) {
                    currentUser = {
                        username: sessionData.username,
                        fullName: userRecord.fullName,
                        role: userRecord.role
                    };
                    currentRole = userRecord.role;
                    
                    document.getElementById('loginModal').style.display = 'none';
                    document.getElementById('mainApp').style.display = 'flex';
                    updateUserDisplay();
                    applyPermissions();
                    renderModulesMenu();
                    updateDashboardStats();
                    return true;
                }
            }
            localStorage.removeItem(USER_KEY);
        } catch (e) {
            localStorage.removeItem(USER_KEY);
        }
    }
    return false;
}

function updateUserDisplay() {
    document.getElementById('sidebarAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
    document.getElementById('sidebarUsername').textContent = currentUser.fullName;
    document.getElementById('sidebarRole').textContent = getRoleDisplayName(currentRole);
}

function getRoleDisplayName(role) {
    const names = { admin: '👑 مدیر', editor: '✏️ ویرایشگر', user: '👁️ کاربر' };
    return names[role] || role;
}

function applyPermissions() {
    console.log('🔐 اعمال مجوزها برای نقش:', currentRole);
    
    const usersNavItem = document.getElementById('usersNavItem');
    if (usersNavItem) {
        if (PERMISSIONS[currentRole].viewUsers) {
            usersNavItem.style.display = 'flex';
            console.log('✅ دسترسی به بخش کاربران: فعال');
        } else {
            usersNavItem.style.display = 'none';
            console.log('❌ دسترسی به بخش کاربران: غیرفعال');
        }
    }
    
    const backupNavItem = document.querySelector('[data-page="backup"]');
    if (backupNavItem) {
        if (PERMISSIONS[currentRole].viewBackup) {
            backupNavItem.style.display = 'flex';
            console.log('✅ دسترسی به بخش پشتیبان: فعال');
        } else {
            backupNavItem.style.display = 'none';
            console.log('❌ دسترسی به بخش پشتیبان: غیرفعال');
        }
    }
    
    const addModuleBtn = document.getElementById('addModuleBtn');
    if (addModuleBtn) {
        if (PERMISSIONS[currentRole].addModule) {
            addModuleBtn.style.display = 'flex';
            console.log('✅ دکمه افزودن ماژول: فعال');
        } else {
            addModuleBtn.style.display = 'none';
            console.log('❌ دکمه افزودن ماژول: غیرفعال');
        }
    }
    
    const dashboardBackupBtn = document.getElementById('dashboardBackupBtn');
    if (dashboardBackupBtn) {
        if (PERMISSIONS[currentRole].createBackup) {
            dashboardBackupBtn.style.display = 'flex';
            console.log('✅ دکمه بکاپ داشبورد: فعال');
        } else {
            dashboardBackupBtn.style.display = 'none';
            console.log('❌ دکمه بکاپ داشبورد: غیرفعال');
        }
    }
}

function handleLogout() {
    if (!confirm('آیا مطمئن هستید که می‌خواهید خارج شوید؟')) return;
    
    localStorage.removeItem(USER_KEY);
    currentUser = null;
    currentRole = null;
    
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginModal').style.display = 'flex';
    
    showToast('شما از سیستم خارج شدید', 'info');
}

// ===== PAGE NAVIGATION =====
function switchPage(pageName) {
    if (pageName === 'users' && !PERMISSIONS[currentRole].viewUsers) {
        showToast('⛔ شما به این بخش دسترسی ندارید', 'error');
        console.log('❌ تلاش برای دسترسی غیرمجاز به بخش کاربران');
        return;
    }
    
    if (pageName === 'backup' && !PERMISSIONS[currentRole].viewBackup) {
        showToast('⛔ شما به این بخش دسترسی ندارید', 'error');
        console.log('❌ تلاش برای دسترسی غیرمجاز به بخش پشتیبان');
        return;
    }
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(pageName + 'Page').classList.add('active');
    const navItem = document.querySelector(`[data-page="${pageName}"]`);
    if (navItem) navItem.classList.add('active');
    
    if (pageName === 'users') loadUsersList();
    if (pageName === 'backup') {
        updateBackupInfo();
        loadBackupPath();
    }
}

// ===== USER MANAGEMENT =====
function loadUsersList() {
    if (!PERMISSIONS[currentRole].viewUsers) {
        showToast('⛔ شما به این بخش دسترسی ندارید', 'error');
        return;
    }
    
    const grid = document.getElementById('usersGrid');
    grid.innerHTML = '';
    
    const table = document.createElement('table');
    table.className = 'users-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>کاربر</th>
            <th>نقش</th>
            <th>تاریخ ایجاد</th>
            <th>ایجاد شده توسط</th>
            <th style="text-align: center;">عملیات</th>
        </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    Object.keys(USER_DATABASE).forEach(username => {
        const user = USER_DATABASE[username];
        const tr = document.createElement('tr');
        
        const date = new Date(user.createdAt).toLocaleDateString('fa-IR');
        const roleClass = user.role;
        
        // Safe HTML creation to prevent XSS
        const safeUsername = escapeHtml(username);
        const safeFullName = escapeHtml(user.fullName || '');
        const safeCreatedBy = escapeHtml(user.createdBy || 'system');
        
        tr.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-table-avatar">${safeUsername.charAt(0).toUpperCase()}</div>
                    <div class="user-cell-info">
                        <div class="user-cell-name">${safeFullName}</div>
                        <div class="user-cell-username">@${safeUsername}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="user-role-badge ${roleClass}">${getRoleDisplayName(user.role)}</span>
            </td>
            <td>
                <span class="user-date">${date}</span>
            </td>
            <td>
                <span class="user-date">${safeCreatedBy}</span>
            </td>
            <td>
                <div class="user-actions-cell">
                    <button class="btn btn-sm btn-primary" onclick="editUser('${safeUsername}')" title="ویرایش اطلاعات">✏️ ویرایش</button>
                    <button class="btn btn-sm" onclick="changeUserPassword('${safeUsername}')" style="background: #f59e0b; color: white;" title="تغییر رمز عبور">🔑 رمز عبور</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${safeUsername}')" 
                        ${safeUsername === currentUser?.username ? 'disabled' : ''} title="حذف کاربر">🗑️ حذف</button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    grid.appendChild(table);
}

function openUserModal() {
    if (!PERMISSIONS[currentRole].manageUsers) {
        showToast('⛔ شما مجاز به مدیریت کاربران نیستید', 'error');
        return;
    }
    document.getElementById('userModal').style.display = 'flex';
    document.getElementById('userModalTitle').textContent = 'افزودن کاربر';
    document.getElementById('userForm').reset();
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function addNewUser(username, password, fullName, role) {
    if (!PERMISSIONS[currentRole].manageUsers) {
        showToast('⛔ شما مجاز به افزودن کاربر نیستید', 'error');
        return false;
    }
    
    if (USER_DATABASE[username]) {
        showToast('این نام کاربری قبلاً ثبت شده', 'error');
        return false;
    }
    
    USER_DATABASE[username] = {
        password: password,
        role: role,
        fullName: fullName,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username
    };
    
    saveUsersDatabase();
    loadUsersList();
    updateDashboardStats();
    showToast(`کاربر "${username}" اضافه شد`, 'success');
    closeUserModal();
}

function editUser(username) {
    if (!PERMISSIONS[currentRole].manageUsers) {
        showToast('⛔ شما مجاز به ویرایش کاربر نیستید', 'error');
        return;
    }
    
    const user = USER_DATABASE[username];
    const newFullName = prompt('نام کامل:', user.fullName);
    if (!newFullName) return;
    
    const newRole = prompt('نقش (admin/editor/user):', user.role);
    if (!['admin', 'editor', 'user'].includes(newRole)) {
        showToast('نقش نامعتبر', 'error');
        return;
    }
    
    USER_DATABASE[username] = { ...user, fullName: newFullName, role: newRole };
    saveUsersDatabase();
    loadUsersList();
    showToast(`کاربر "${username}" به‌روز شد`, 'success');
}

function changeUserPassword(username) {
    if (!PERMISSIONS[currentRole].manageUsers) {
        showToast('⛔ شما مجاز به تغییر رمز عبور نیستید', 'error');
        return;
    }
    
    const user = USER_DATABASE[username];
    
    if (!user) {
        showToast('کاربر یافت نشد', 'error');
        return;
    }
    
    const newPassword = prompt(`تغییر رمز عبور برای "${user.fullName}":\n\nرمز عبور جدید را وارد کنید:`);
    
    if (!newPassword || !newPassword.trim()) {
        showToast('رمز عبور نمی‌تواند خالی باشد', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('رمز عبور باید حداقل 6 کاراکتر باشد', 'error');
        return;
    }
    
    const confirmPassword = prompt('تایید رمز عبور جدید:');
    
    if (newPassword !== confirmPassword) {
        showToast('رمز عبور و تایید آن یکسان نیستند', 'error');
        return;
    }
    
    USER_DATABASE[username].password = newPassword;
    USER_DATABASE[username].lastPasswordChange = new Date().toISOString();
    USER_DATABASE[username].passwordChangedBy = currentUser.username;
    
    saveUsersDatabase();
    showToast(`رمز عبور کاربر "${username}" تغییر یافت`, 'success');
    console.log('✅ رمز عبور تغییر یافت برای:', username);
}

function deleteUser(username) {
    if (!PERMISSIONS[currentRole].manageUsers) {
        showToast('⛔ شما مجاز به حذف کاربر نیستید', 'error');
        return;
    }
    
    if (username === currentUser.username) {
        showToast('نمی‌توانید خودتان را حذف کنید!', 'error');
        return;
    }
    
    if (confirm(`کاربر "${username}" حذف شود؟`)) {
        delete USER_DATABASE[username];
        saveUsersDatabase();
        loadUsersList();
        updateDashboardStats();
        showToast(`کاربر "${username}" حذف شد`, 'success');
    }
}

// ===== ADD MODULE =====
function openAddModuleModal() {
    if (!PERMISSIONS[currentRole].addModule) {
        showToast('⛔ شما مجاز به افزودن ماژول نیستید', 'error');
        return;
    }
    document.getElementById('addModuleModal').style.display = 'flex';
    document.getElementById('addModuleForm').reset();
}

function closeModuleModal() {
    document.getElementById('addModuleModal').style.display = 'none';
}

function addNewModule(name, columns) {
    if (!PERMISSIONS[currentRole].addModule) {
        showToast('⛔ شما مجاز به افزودن ماژول نیستید', 'error');
        return;
    }
    
    const id = 'module_' + Date.now();
    
    MODULES[id] = {
        id: id,
        name: name,
        columns: columns,
        data: [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username
    };
    
    saveModules();
    renderModulesMenu();
    createModulePage(id);
    updateDashboardStats();
    showToast(`ماژول "${name}" اضافه شد`, 'success');
    closeModuleModal();
    
    setTimeout(() => {
        switchToModule(id);
    }, 100);
}

// ===== BACKUP SYSTEM =====
function loadBackupPath() {
    const savedPath = localStorage.getItem(BACKUP_PATH_KEY);
    if (savedPath) {
        document.getElementById('backupPathInput').value = savedPath;
        document.getElementById('currentBackupPath').textContent = savedPath;
    } else {
        document.getElementById('currentBackupPath').textContent = 'تنظیم نشده';
    }
}

function saveBackupPath() {
    if (!PERMISSIONS[currentRole].createBackup) {
        showToast('⛔ شما مجاز به تنظیم مسیر بکاپ نیستید', 'error');
        return;
    }
    
    const path = document.getElementById('backupPathInput').value.trim();
    
    if (!path) {
        showToast('لطفاً مسیر را وارد کنید', 'error');
        return;
    }
    
    localStorage.setItem(BACKUP_PATH_KEY, path);
    document.getElementById('currentBackupPath').textContent = path;
    showToast('✅ مسیر بکاپ ذخیره شد', 'success');
    console.log('💾 مسیر بکاپ:', path);
}

function createBackup(isAuto = false) {
    if (!PERMISSIONS[currentRole].createBackup) {
        showToast('⛔ شما مجاز به ایجاد بکاپ نیستید', 'error');
        return;
    }
    
    const backupPath = localStorage.getItem(BACKUP_PATH_KEY);
    
    const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportedBy: currentUser ? currentUser.username : 'unknown',
        backupPath: backupPath || 'دانلود دستی',
        backupType: isAuto ? 'خودکار' : 'دستی',
        data: {
            modules: localStorage.getItem(MODULES_KEY),
            users: localStorage.getItem('dwbi_users_database')
        },
        metadata: {
            modulesCount: Object.keys(MODULES).length,
            totalResources: Object.values(MODULES).reduce((sum, m) => sum + m.data.length, 0),
            usersCount: Object.keys(USER_DATABASE).length
        }
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5).replace(':', '-');
    const filename = `dwbi_backup_${isAuto ? 'auto_' : ''}${date}_${time}.json`;
    
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const now = new Date().toLocaleString('fa-IR');
    localStorage.setItem('dwbi_last_backup', now);
    updateBackupInfo();
    
    if (isAuto) {
        if (backupPath) {
            showToast(`🔄 بکاپ خودکار انجام شد!\n\n📁 فایل را در مسیر زیر ذخیره کنید:\n${backupPath}\n\nنام فایل: ${filename}`, 'info');
        } else {
            showToast(`⚠️ بکاپ خودکار انجام شد اما مسیر تنظیم نشده!\n\nلطفاً مسیر بکاپ را در بخش پشتیبان تنظیم کنید.`, 'info');
        }
        console.log('🔄 بکاپ خودکار ایجاد شد:', filename);
    } else {
        if (backupPath) {
            showToast(`✅ بکاپ دستی ایجاد شد!\n\n📁 فایل را در مسیر:\n${backupPath}\nذخیره کنید.`, 'success');
        } else {
            showToast('✅ بکاپ دانلود شد', 'success');
        }
        console.log('💾 بکاپ دستی ایجاد شد:', filename);
    }
}

function restoreBackup(file) {
    if (!PERMISSIONS[currentRole].restoreBackup) {
        showToast('⛔ شما مجاز به بازیابی بکاپ نیستید', 'error');
        return;
    }
    
    if (!file || !file.name.endsWith('.json')) {
        showToast('فایل JSON انتخاب کنید', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.version || !backup.data) {
                throw new Error('فرمت نامعتبر');
            }
            
            if (confirm(`بکاپ بازیابی شود؟\n\n📊 ماژول‌ها: ${backup.metadata.modulesCount}\n👥 کاربران: ${backup.metadata.usersCount}\n📅 تاریخ: ${new Date(backup.exportDate).toLocaleString('fa-IR')}`)) {
                if (backup.data.modules) localStorage.setItem(MODULES_KEY, backup.data.modules);
                if (backup.data.users) localStorage.setItem('dwbi_users_database', backup.data.users);
                
                showToast('✅ بکاپ بازیابی شد!', 'success');
                setTimeout(() => location.reload(), 2000);
            }
        } catch (error) {
            showToast('خطا در بازیابی بکاپ', 'error');
        }
    };
    reader.readAsText(file);
}

function updateBackupInfo() {
    const lastBackup = localStorage.getItem('dwbi_last_backup');
    if (lastBackup) {
        document.getElementById('lastBackupDate').textContent = lastBackup;
    }
    
    const totalResources = Object.values(MODULES).reduce((sum, m) => sum + m.data.length, 0);
    document.getElementById('backupResources').textContent = totalResources;
    document.getElementById('backupUsers').textContent = Object.keys(USER_DATABASE).length;
}

// ===== DASHBOARD =====
function updateDashboardStats() {
    const totalResources = Object.values(MODULES).reduce((sum, m) => sum + m.data.length, 0);
    const modulesCount = Object.keys(MODULES).length;
    const usersCount = Object.keys(USER_DATABASE).length;
    
    document.getElementById('statTotalResources').textContent = totalResources;
    document.getElementById('statModules').textContent = modulesCount;
    document.getElementById('statUsers').textContent = usersCount;
    
    const lastMod = Object.values(MODULES)
        .filter(m => m.lastModified)
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))[0];
    
    if (lastMod) {
        const date = new Date(lastMod.lastModified);
        const time = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        document.getElementById('statLastSaved').textContent = time;
    }
}

// ===== EXCEL FUNCTIONS =====
function uploadExcelFile(moduleId, file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length === 0) {
                showToast('فایل اکسل خالی است', 'error');
                return;
            }
            
            // First row as headers
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            // Update module columns if different
            const module = MODULES[moduleId];
            if (JSON.stringify(headers) !== JSON.stringify(module.columns)) {
                if (confirm('ستون‌های فایل اکسل با ماژول متفاوت است. آیا می‌خواهید ستون‌ها را به‌روزرسانی کنید؟')) {
                    module.columns = headers;
                }
            }
            
            // Clear existing data and add new data
            module.data = rows.filter(row => row.some(cell => cell !== undefined && cell !== ''));
            
            // Save changes
            saveModules();
            renderModuleTable(moduleId);
            attachModuleEvents(moduleId);
            
            showToast(`✅ ${module.data.length} ردیف از فایل اکسل بارگیری شد`, 'success');
            
        } catch (error) {
            console.error('خطا در خواندن فایل اکسل:', error);
            showToast('خطا در خواندن فایل اکسل', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function exportToExcel(moduleId) {
    const module = MODULES[moduleId];
    if (!module || !module.data || module.data.length === 0) {
        showToast('داده‌ای برای دانلود وجود ندارد', 'error');
        return;
    }
    
    try {
        // Create workbook
        const workbook = XLSX.utils.book_new();
        
        // Prepare data with headers
        const data = [module.columns, ...module.data];
        
        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, module.name);
        
        // Generate filename
        const date = new Date().toISOString().slice(0, 10);
        const filename = `${module.name}_${date}.xlsx`;
        
        // Download file
        XLSX.writeFile(workbook, filename);
        
        showToast(`✅ فایل اکسل "${filename}" دانلود شد`, 'success');
        
    } catch (error) {
        console.error('خطا در ایجاد فایل اکسل:', error);
        showToast('خطا در ایجاد فایل اکسل', 'error');
    }
}

function generateModuleReport(moduleId) {
    const module = MODULES[moduleId];
    if (!module || !module.data || module.data.length === 0) {
        showToast('داده‌ای برای گزارش وجود ندارد', 'error');
        return;
    }
    
    // Create report data
    const reportData = {
        moduleName: module.name,
        totalRecords: module.data.length,
        columns: module.columns,
        generatedAt: new Date().toLocaleString('fa-IR'),
        generatedBy: currentUser ? currentUser.fullName : 'سیستم',
        data: module.data
    };
    
    // Create HTML report
    const reportHtml = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>گزارش ${module.name}</title>
            <style>
                body { font-family: 'Tahoma', Arial, sans-serif; margin: 20px; direction: rtl; }
                .header { text-align: center; margin-bottom: 30px; }
                .info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background: #4CAF50; color: white; }
                tr:nth-child(even) { background: #f2f2f2; }
                .footer { margin-top: 30px; text-align: center; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>گزارش ${module.name}</h1>
                <p>تاریخ تولید: ${reportData.generatedAt}</p>
            </div>
            
            <div class="info">
                <h3>خلاصه اطلاعات:</h3>
                <p><strong>نام ماژول:</strong> ${module.name}</p>
                <p><strong>تعداد رکوردها:</strong> ${reportData.totalRecords}</p>
                <p><strong>تعداد ستون‌ها:</strong> ${module.columns.length}</p>
                <p><strong>تولید شده توسط:</strong> ${reportData.generatedBy}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        ${module.columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${module.data.map(row => 
                        `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`
                    ).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>این گزارش توسط سیستم مدیریت DWBI تولید شده است</p>
            </div>
        </body>
        </html>
    `;
    
    // Create and download HTML file
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `گزارش_${module.name}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`✅ گزارش HTML دانلود شد`, 'success');
}

// ===== UTILITIES =====
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 5000);
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) switchPage(page);
        });
    });
    
    document.getElementById('resourcesToggle').addEventListener('click', () => {
        const submenu = document.getElementById('resourcesSubmenu');
        const header = document.getElementById('resourcesToggle');
        submenu.classList.toggle('open');
        header.classList.toggle('active');
    });
    
    document.getElementById('addUserBtn').addEventListener('click', openUserModal);
    document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
    document.getElementById('userForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const fullName = document.getElementById('newFullName').value.trim();
        const role = document.getElementById('newUserRole').value;
        addNewUser(username, password, fullName, role);
    });
    
    document.getElementById('addModuleBtn').addEventListener('click', openAddModuleModal);
    document.getElementById('closeModuleModal').addEventListener('click', closeModuleModal);
    document.getElementById('addModuleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('moduleName').value.trim();
        const columnsStr = document.getElementById('moduleColumns').value.trim();
        const columns = columnsStr.split(',').map(c => c.trim()).filter(c => c);
        
        if (columns.length === 0) {
            showToast('حداقل یک ستون وارد کنید', 'error');
            return;
        }
        
        addNewModule(name, columns);
    });
    
    document.getElementById('saveBackupPathBtn').addEventListener('click', saveBackupPath);
    document.getElementById('backupBtn').addEventListener('click', () => createBackup(false));
    document.getElementById('dashboardBackupBtn').addEventListener('click', () => createBackup(false));
    document.getElementById('restoreBtn').addEventListener('click', () => {
        document.getElementById('restoreFileInput').click();
    });
    document.getElementById('restoreFileInput').addEventListener('change', (e) => {
        if (e.target.files[0]) restoreBackup(e.target.files[0]);
        e.target.value = '';
    });
}

console.log('📄 script.js بارگیری شد - نسخه نهایی با API Sync ✅');
