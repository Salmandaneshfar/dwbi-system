const API_BASE = '/api/v1';

let ACCESS_TOKEN = null;
let CURRENT_USER = null;
let MODULES = {};
let ACTIVE_MODULE = null;

const loginModalEl = document.getElementById('loginModal');
const mainAppEl = document.getElementById('mainApp');
const moduleMenuEl = document.getElementById('moduleMenu');
const moduleContainerEl = document.getElementById('moduleContainer');
const dashboardEl = document.getElementById('dashboard');
const toastEl = document.getElementById('toast');

const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const credentials = {
    username: usernameInput.value.trim(),
    password: passwordInput.value,
  };

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'نام کاربری یا رمز عبور اشتباه است.');
    }
    ACCESS_TOKEN = data.access_token;
    await loadCurrentUser();
    await loadModules();
    loginModalEl.style.display = 'none';
    mainAppEl.style.display = 'flex';
  } catch (error) {
    showToast(error.message || 'خطا در ورود');
  }

  return false;
});

logoutBtn.addEventListener('click', () => handleLogout());

async function loadCurrentUser() {
  try {
    CURRENT_USER = await apiFetch('/auth/me');
    const displayName = CURRENT_USER.full_name || CURRENT_USER.username;
    dashboardEl.innerHTML = `<h2>خوش آمدید ${displayName}</h2>`;
  } catch (error) {
    showToast('امکان دریافت اطلاعات کاربر وجود ندارد.');
  }
}

async function loadModules() {
  try {
    const modules = await apiFetch('/modules');
    MODULES = {};
    let menuHtml = '';
    modules.forEach((module) => {
      MODULES[module.id] = module;
      const activeClass = module.id === ACTIVE_MODULE ? 'active' : '';
      menuHtml += `<a href="#" class="${activeClass}" data-module="${module.id}">${module.name}</a>`;
    });
    moduleMenuEl.innerHTML = menuHtml;
    moduleMenuEl.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const moduleId = event.currentTarget.dataset.module;
        renderModule(moduleId);
      });
    });
    if (!ACTIVE_MODULE && modules.length > 0) {
      renderModule(modules[0].id);
    }
  } catch (error) {
    showToast('عدم امکان دریافت ماژول‌ها');
  }
}

async function renderModule(id) {
  ACTIVE_MODULE = id;
  moduleMenuEl.querySelectorAll('a').forEach((link) => {
    link.classList.toggle('active', link.dataset.module === id);
  });

  try {
    const rows = await apiFetch(`/modules/${id}/rows`);
    const module = MODULES[id];
    if (!module) {
      showToast('ماژول یافت نشد.');
      return;
    }

    const columns = module.columns.split(',');
    let html = `<h2>${module.name}</h2>
      <div class="module-actions">
        <button onclick="exportExcel('${id}')">خروجی Excel</button>
        <label class="import-label">
          واردکردن Excel
          <input type="file" onchange="importExcel(event,'${id}')" hidden>
        </label>
      </div>
      <table>
        <thead><tr>${columns.map((c) => `<th>${c}</th>`).join('')}<th></th></tr></thead>
        <tbody>`;

    const orderedRows = rows.sort((a, b) => a.idx - b.idx);
    orderedRows.forEach((row) => {
      html += `<tr data-idx="${row.idx}">`;
      html += row.data
        .map(
          (cell, j) =>
            `<td contenteditable data-module="${id}" data-idx="${row.idx}" data-col="${j}" onblur="dirtyRow(this,'${id}',${row.idx})">${cell ?? ''}</td>`,
        )
        .join('');
      html += `<td><button onclick="deleteRow('${id}',${row.idx})">🗑️</button></td></tr>`;
    });

    html += `</tbody></table>
      <button class="btn" onclick="addRow('${id}')">افزودن ردیف</button>`;
    moduleContainerEl.innerHTML = html;
  } catch (error) {
    showToast(error.message || 'خطا در دریافت داده‌های ماژول');
  }
}

async function addRow(id) {
  const module = MODULES[id];
  if (!module) return;
  const emptyRow = module.columns.split(',').map(() => '');
  try {
    await apiFetch(`/modules/${id}/rows`, {
      method: 'POST',
      body: JSON.stringify({ data: emptyRow }),
    });
    renderModule(id);
  } catch (error) {
    showToast('خطا در افزودن ردیف');
  }
}

async function dirtyRow(cell, moduleId, idx) {
  const rowElement = cell.closest('tr');
  const cells = Array.from(rowElement.querySelectorAll('td')).slice(0, -1);
  const data = cells.map((td) => td.textContent.trim());

  try {
    await apiFetch(`/modules/${moduleId}/rows`, {
      method: 'POST',
      body: JSON.stringify({ idx, data }),
    });
  } catch (error) {
    showToast('ذخیره تغییرات انجام نشد');
  }
}

async function deleteRow(moduleId, idx) {
  try {
    await apiFetch(`/modules/${moduleId}/rows/${idx}`, { method: 'DELETE' });
    renderModule(moduleId);
  } catch (error) {
    showToast('حذف ردیف انجام نشد');
  }
}

async function exportExcel(moduleId) {
  try {
    const rows = await apiFetch(`/modules/${moduleId}/rows`);
    const module = MODULES[moduleId];
    const data = rows.sort((a, b) => a.idx - b.idx).map((row) => row.data);
    const sheet = XLSX.utils.aoa_to_sheet([module.columns.split(','), ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Data');
    XLSX.writeFile(workbook, `${module.name}.xlsx`);
  } catch (error) {
    showToast('امکان ساخت خروجی وجود ندارد');
  }
}

function importExcel(event, moduleId) {
  const module = MODULES[moduleId];
  if (!module) return;
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const workbook = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (!rows.length) return;

      const [header, ...dataRows] = rows;
      await apiFetch(`/modules/${moduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ columns: header.join(','), name: module.name }),
      });

      for (const row of dataRows) {
        await apiFetch(`/modules/${moduleId}/rows`, {
          method: 'POST',
          body: JSON.stringify({ data: row }),
        });
      }

      await loadModules();
      await renderModule(moduleId);
      showToast('وارد شد!');
    } catch (error) {
      showToast('خطا در وارد کردن Excel');
    } finally {
      event.target.value = '';
    }
  };

  reader.readAsArrayBuffer(file);
}

async function apiFetch(path, options = {}) {
  const opts = { ...options };
  opts.headers = { ...(opts.headers || {}) };

  const hasBody = typeof opts.body !== 'undefined' && !(opts.body instanceof FormData);
  if (hasBody && !('Content-Type' in opts.headers)) {
    opts.headers['Content-Type'] = 'application/json';
  }

  if (ACCESS_TOKEN) {
    opts.headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }

  const response = await fetch(`${API_BASE}${path}`, opts);
  let payload = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }
  }

  if (response.status === 401) {
    handleLogout('نشست شما منقضی شده است.');
    throw new Error('نیاز به ورود مجدد است');
  }

  if (!response.ok) {
    const message = payload && (payload.detail || payload.message);
    throw new Error(message || 'خطای نامشخص');
  }

  return payload;
}

function handleLogout(message) {
  ACCESS_TOKEN = null;
  CURRENT_USER = null;
  MODULES = {};
  ACTIVE_MODULE = null;
  moduleContainerEl.innerHTML = '';
  moduleMenuEl.innerHTML = '';
  dashboardEl.innerHTML = '';
  mainAppEl.style.display = 'none';
  loginModalEl.style.display = 'flex';
  loginForm.reset();
  if (message) showToast(message);
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.style.display = 'block';
  setTimeout(() => {
    toastEl.style.display = 'none';
  }, 2500);
}
