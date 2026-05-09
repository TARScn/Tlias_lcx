// ===== 基础配置 =====
const BASE_URL = 'http://localhost:8080';

// ===== 全局状态 =====
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalCount = 0;
let empSearchParams = {
    name: '',
    gender: '',
    begin: '',
    end: ''
};

// 待删除ID（员工）
let empDeleteId = null;
let empBatchDeleteMode = false;
// 待删除ID（部门）
let deptDeleteId = null;

// ===== 工具函数 =====
function formatDate(dateStr) {
    if (!dateStr) return '-';
    if (Array.isArray(dateStr)) {
        const [y, m, d] = dateStr;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return dateStr;
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    if (Array.isArray(dateTimeStr)) {
        const [y, m, d, h = 0, min = 0, s = 0] = dateTimeStr;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    try {
        const dt = new Date(dateTimeStr);
        if (isNaN(dt.getTime())) return dateTimeStr;
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const hours = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        const seconds = String(dt.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
        return dateTimeStr;
    }
}

function getGenderText(gender) {
    if (gender === 1) return '男';
    if (gender === 2) return '女';
    return '-';
}

function getJobText(job) {
    const jobMap = {
        1: '班主任',
        2: '讲师',
        3: '学工主管',
        4: '教研主管',
        5: '咨询师'
    };
    return jobMap[job] || '-';
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== 视图切换 =====
function switchView(view, el) {
    // 隐藏所有视图
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    // 显示目标视图
    const panel = document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
    if (panel) panel.classList.add('active');

    // 更新侧边栏激活状态
    if (el) {
        document.querySelectorAll('.submenu li a').forEach(a => a.classList.remove('active'));
        el.classList.add('active');
        // 确保父级菜单展开且激活
        const parentNav = el.closest('ul.submenu').previousElementSibling;
        if (parentNav && parentNav.classList.contains('has-submenu')) {
            parentNav.classList.add('active');
            const submenu = parentNav.nextElementSibling;
            if (submenu) submenu.style.display = 'block';
            const arrow = parentNav.querySelector('.arrow');
            if (arrow) { arrow.textContent = '▼'; arrow.classList.add('open'); }
        }
    }

    // 加载对应数据
    if (view === 'dept') {
        fetchDepts();
    } else if (view === 'emp') {
        fetchEmps();
    }
}

// ===== 导航栏折叠 =====
function toggleSubmenu(element) {
    const submenu = element.nextElementSibling;
    const arrow = element.querySelector('.arrow');

    if (submenu.style.display === 'block') {
        submenu.style.display = 'none';
        arrow.textContent = '▶';
        arrow.classList.remove('open');
    } else {
        submenu.style.display = 'block';
        arrow.textContent = '▼';
        arrow.classList.add('open');
    }
}

// ===== 退出登录 =====
function logout() {
    if (confirm('确定要退出登录吗？')) {
        alert('已退出登录');
    }
}

// ==============================
//  部门管理
// ==============================

function fetchDepts() {
    const tbody = document.getElementById('deptTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">加载中...</td></tr>';

    fetch(`${BASE_URL}/depts`)
        .then(response => {
            if (!response.ok) throw new Error('网络请求失败: ' + response.status);
            return response.json();
        })
        .then(result => {
            if (result.code === 1) {
                renderDeptTable(result.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">加载失败：' + (result.message || '未知错误') + '</td></tr>';
            }
        })
        .catch(error => {
            console.error('获取部门列表失败:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">加载失败，请确保后端服务已启动</td></tr>';
        });
}

function renderDeptTable(deptList) {
    const tbody = document.getElementById('deptTableBody');
    if (!tbody) return;

    if (!deptList || deptList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">暂无部门数据</td></tr>';
        return;
    }

    let html = '';
    deptList.forEach((dept, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(dept.name)}</td>
                <td>${formatDateTime(dept.updateTime)}</td>
                <td>
                    <button class="btn-edit" onclick="openDeptEditModal(${dept.id})">修改</button>
                    <button class="btn-delete-text" onclick="openDeptDeleteModal(${dept.id}, '${escapeHtml(dept.name)}')">删除</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// -- 部门弹窗 --
function openDeptAddModal() {
    document.getElementById('deptModalTitle').textContent = '新增部门';
    document.getElementById('deptId').value = '';
    document.getElementById('deptName').value = '';
    document.getElementById('deptModal').style.display = 'block';
}

function openDeptEditModal(id) {
    document.getElementById('deptModalTitle').textContent = '修改部门';

    fetch(`${BASE_URL}/depts/${id}`)
        .then(response => response.json())
        .then(result => {
            if (result.code === 1 && result.data) {
                document.getElementById('deptId').value = result.data.id;
                document.getElementById('deptName').value = result.data.name;
                document.getElementById('deptModal').style.display = 'block';
            } else {
                alert('获取部门信息失败');
            }
        })
        .catch(error => {
            console.error('获取部门信息失败:', error);
            alert('获取部门信息失败，请检查网络');
        });
}

function closeDeptModal() {
    document.getElementById('deptModal').style.display = 'none';
    document.getElementById('deptForm').reset();
    document.getElementById('deptId').value = '';
}

function submitDept() {
    const id = document.getElementById('deptId').value;
    const name = document.getElementById('deptName').value.trim();

    if (!name) {
        alert('请输入部门名称');
        return;
    }

    const isEdit = id !== '';
    const url = `${BASE_URL}/depts`;
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? JSON.stringify({ id: parseInt(id), name: name }) : JSON.stringify({ name: name });

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: body
    })
        .then(response => response.json())
        .then(result => {
            if (result.code === 1) {
                closeDeptModal();
                fetchDepts();
                alert(isEdit ? '修改成功' : '新增成功');
            } else {
                alert('操作失败：' + (result.message || '未知错误'));
            }
        })
        .catch(error => {
            console.error('提交失败:', error);
            alert('操作失败，请检查网络');
        });
}

// -- 部门删除弹窗 --
function openDeptDeleteModal(id, name) {
    deptDeleteId = id;
    document.getElementById('deleteDeptName').textContent = name;
    document.getElementById('deptDeleteModal').style.display = 'block';
}

function closeDeptDeleteModal() {
    deptDeleteId = null;
    document.getElementById('deptDeleteModal').style.display = 'none';
}

function confirmDeptDelete() {
    if (deptDeleteId === null) return;

    fetch(`${BASE_URL}/depts?id=${deptDeleteId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.code === 1) {
                closeDeptDeleteModal();
                fetchDepts();
                alert('删除成功');
            } else {
                alert('删除失败：' + (result.message || '未知错误'));
            }
        })
        .catch(error => {
            console.error('删除失败:', error);
            alert('删除失败，请检查网络');
        });
}

// ==============================
//  员工管理
// ==============================

function fetchEmps() {
    const tbody = document.getElementById('empTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载中...</td></tr>';

    const params = new URLSearchParams();
    params.append('pageNum', currentPage);
    params.append('pageSize', pageSize);
    if (empSearchParams.name) params.append('name', empSearchParams.name);
    if (empSearchParams.gender) params.append('gender', empSearchParams.gender);
    if (empSearchParams.begin) params.append('begin', empSearchParams.begin);
    if (empSearchParams.end) params.append('end', empSearchParams.end);

    fetch(`${BASE_URL}/emps?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error('网络请求失败: ' + response.status);
            return response.json();
        })
        .then(result => {
            if (result.code === 1 && result.data) {
                renderEmpTable(result.data);
                totalCount = result.data.total || 0;
                totalPages = Math.ceil(totalCount / pageSize) || 1;
                updatePagination();
            } else {
                tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败：' + (result.message || '未知错误') + '</td></tr>';
            }
        })
        .catch(error => {
            console.error('获取员工列表失败:', error);
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败，请确保后端服务已启动</td></tr>';
        });
}

function renderEmpTable(pageData) {
    const tbody = document.getElementById('empTableBody');
    if (!tbody) return;
    const empList = pageData.data || pageData;

    if (!empList || empList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无员工数据</td></tr>';
        return;
    }

    let html = '';
    empList.forEach((emp) => {
        const imageHtml = emp.image
            ? `<img src="${escapeHtml(emp.image)}" class="avatar-img" alt="头像" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex';">`
            : '';
        const fallbackHtml = emp.image
            ? `<span class="avatar-placeholder" style="display:none;">👤</span>`
            : `<span class="avatar-placeholder">👤</span>`;

        html += `
            <tr>
                <td><input type="checkbox" class="emp-checkbox" value="${emp.id}" onchange="updateCheckAllState()"></td>
                <td>${escapeHtml(emp.name)}</td>
                <td>${getGenderText(emp.gender)}</td>
                <td>${imageHtml}${fallbackHtml}</td>
                <td>${escapeHtml(emp.deptName || '-')}</td>
                <td>${getJobText(emp.job)}</td>
                <td>${formatDate(emp.entryDate)}</td>
                <td>${formatDateTime(emp.updateTime)}</td>
                <td>
                    <button class="btn-edit" onclick="openEmpEditModal(${emp.id})">编辑</button>
                    <button class="btn-delete-text" onclick="openEmpDeleteModal(${emp.id}, '${escapeHtml(emp.name)}')">删除</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// -- 搜索 --
function searchEmps() {
    empSearchParams.name = document.getElementById('searchName').value.trim();
    empSearchParams.gender = document.getElementById('searchGender').value;
    empSearchParams.begin = document.getElementById('searchBegin').value;
    empSearchParams.end = document.getElementById('searchEnd').value;
    currentPage = 1;
    fetchEmps();
}

function clearEmpSearch() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchGender').value = '';
    document.getElementById('searchBegin').value = '';
    document.getElementById('searchEnd').value = '';
    empSearchParams = { name: '', gender: '', begin: '', end: '' };
    currentPage = 1;
    fetchEmps();
}

// -- 分页 --
function goPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    fetchEmps();
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 1;
    fetchEmps();
}

function updatePagination() {
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('currentPageNum').textContent = currentPage;
    document.getElementById('totalPagesNum').textContent = totalPages;

    document.getElementById('btnFirst').disabled = currentPage <= 1;
    document.getElementById('btnPrev').disabled = currentPage <= 1;
    document.getElementById('btnNext').disabled = currentPage >= totalPages;
    document.getElementById('btnLast').disabled = currentPage >= totalPages;
}

// -- 全选 --
function toggleCheckAll(checkbox) {
    document.querySelectorAll('.emp-checkbox').forEach(cb => cb.checked = checkbox.checked);
}

function updateCheckAllState() {
    const checkAll = document.getElementById('checkAll');
    const checkboxes = document.querySelectorAll('.emp-checkbox');
    const checkedCount = document.querySelectorAll('.emp-checkbox:checked').length;
    checkAll.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    checkAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// -- 批量删除 --
function batchDeleteEmps() {
    const checkedBoxes = document.querySelectorAll('.emp-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert('请先选择要删除的员工');
        return;
    }

    const ids = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
    document.getElementById('empDeleteModalTitle').textContent = '批量删除确认';
    document.getElementById('empDeleteModalMsg').textContent = `确定要删除选中的 ${ids.length} 名员工吗？此操作不可撤销。`;

    document.getElementById('empDeleteModal').style.display = 'block';
    empBatchDeleteMode = true;

    const confirmBtn = document.getElementById('confirmEmpDeleteBtn');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', function() {
        executeBatchDelete(ids);
    });
}

function executeBatchDelete(ids) {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('ids', id));

    fetch(`${BASE_URL}/emps/batch?${params.toString()}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(result => {
            if (result.code === 1) {
                closeEmpDeleteModal();
                document.getElementById('checkAll').checked = false;
                fetchEmps();
                alert('批量删除成功');
            } else {
                alert('批量删除失败：' + (result.message || '未知错误'));
            }
        })
        .catch(error => {
            console.error('批量删除失败:', error);
            alert('批量删除失败，请检查网络');
        });
}

// -- 单个删除 --
function openEmpDeleteModal(id, name) {
    empDeleteId = id;
    empBatchDeleteMode = false;
    document.getElementById('empDeleteModalTitle').textContent = '确认删除';
    document.getElementById('empDeleteModalMsg').textContent = `确定要删除员工「${name}」吗？此操作不可撤销。`;

    document.getElementById('empDeleteModal').style.display = 'block';

    const confirmBtn = document.getElementById('confirmEmpDeleteBtn');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', confirmEmpDelete);
}

function closeEmpDeleteModal() {
    empDeleteId = null;
    empBatchDeleteMode = false;
    document.getElementById('empDeleteModal').style.display = 'none';
}

function confirmEmpDelete() {
    if (empDeleteId === null) return;

    fetch(`${BASE_URL}/emps/${empDeleteId}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(result => {
            if (result.code === 1) {
                closeEmpDeleteModal();
                fetchEmps();
                alert('删除成功');
            } else {
                alert('删除失败：' + (result.message || '未知错误'));
            }
        })
        .catch(error => {
            console.error('删除失败:', error);
            alert('删除失败，请检查网络');
        });
}

// -- 加载部门下拉框 --
function loadDeptOptions(targetSelectId) {
    const select = document.getElementById(targetSelectId);
    if (!select) return;

    fetch(`${BASE_URL}/depts`)
        .then(response => response.json())
        .then(result => {
            if (result.code === 1 && result.data) {
                select.innerHTML = '<option value="">请选择</option>';
                result.data.forEach(dept => {
                    select.innerHTML += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
                });
            }
        })
        .catch(error => console.error('加载部门列表失败:', error));
}

// -- 工作经历动态表单 --
function addEmpExprRow(begin, end, company, job) {
    console.log('addEmpExprRow called', { begin, end, company, job });
    const container = document.getElementById('empExprContainer');
    if (!container) {
        console.error('empExprContainer not found in DOM');
        return;
    }
    const row = document.createElement('div');
    row.className = 'emp-expr-row';
    row.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>公司名称</label>
                <input type="text" class="expr-company" placeholder="请输入公司名称" value="${escapeHtml(company || '')}">
            </div>
            <div class="form-group">
                <label>职位</label>
                <input type="text" class="expr-job" placeholder="请输入职位" value="${escapeHtml(job || '')}">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>开始时间</label>
                <input type="date" class="expr-begin" value="${begin || ''}">
            </div>
            <div class="form-group">
                <label>结束时间</label>
                <input type="date" class="expr-end" value="${end || ''}">
            </div>
        </div>
        <div class="expr-row-actions">
            <button type="button" class="btn-delete-text" onclick="removeEmpExprRow(this)">删除此经历</button>
        </div>
    `;
    container.appendChild(row);
    console.log('empExprRow added, total rows:', container.children.length);
}

function removeEmpExprRow(btn) {
    btn.closest('.emp-expr-row').remove();
}

function clearEmpExprRows() {
    const container = document.getElementById('empExprContainer');
    if (container) container.innerHTML = '';
}

function collectEmpExprList() {
    const rows = document.querySelectorAll('.emp-expr-row');
    const exprList = [];
    rows.forEach(row => {
        const begin = row.querySelector('.expr-begin').value;
        const end = row.querySelector('.expr-end').value;
        const company = row.querySelector('.expr-company').value.trim();
        const job = row.querySelector('.expr-job').value.trim();
        if (company || job || begin || end) {
            exprList.push({
                begin: begin || null,
                end: end || null,
                company: company || null,
                job: job || null
            });
        }
    });
    return exprList.length > 0 ? exprList : null;
}

// -- 新增/编辑弹窗 --
function openEmpAddModal() {
    document.getElementById('empModalTitle').textContent = '新增员工';
    document.getElementById('empId').value = '';
    document.getElementById('empForm').reset();
    clearEmpExprRows();
    loadDeptOptions('empDeptId');
    document.getElementById('empModal').style.display = 'block';
}

function openEmpEditModal(id) {
    document.getElementById('empModalTitle').textContent = '编辑员工';
    clearEmpExprRows();
    loadDeptOptions('empDeptId');

    fetch(`${BASE_URL}/emps/${id}`)
        .then(response => response.json())
        .then(result => {
            if (result.code === 1 && result.data) {
                const emp = result.data;
                document.getElementById('empId').value = emp.id;
                document.getElementById('empUsername').value = emp.username || '';
                document.getElementById('empName').value = emp.name || '';
                document.getElementById('empGender').value = emp.gender || '';
                document.getElementById('empPhone').value = emp.phone || '';
                document.getElementById('empJob').value = emp.job || '';
                document.getElementById('empEntryDate').value = formatDate(emp.entryDate) !== '-' ? formatDate(emp.entryDate) : '';
                document.getElementById('empSalary').value = emp.salary || '';
                document.getElementById('empImage').value = emp.image || '';
                setTimeout(() => {
                    document.getElementById('empDeptId').value = emp.deptId || '';
                }, 300);
                // 回填工作经历
                if (emp.empExprList && emp.empExprList.length > 0) {
                    emp.empExprList.forEach(expr => {
                        addEmpExprRow(
                            formatDate(expr.begin) !== '-' ? formatDate(expr.begin) : '',
                            formatDate(expr.end) !== '-' ? formatDate(expr.end) : '',
                            expr.company,
                            expr.job
                        );
                    });
                }
                document.getElementById('empModal').style.display = 'block';
            } else {
                alert('获取员工信息失败');
            }
        })
        .catch(error => {
            console.error('获取员工信息失败:', error);
            alert('获取员工信息失败，请检查网络');
        });
}

function closeEmpModal() {
    document.getElementById('empModal').style.display = 'none';
    document.getElementById('empForm').reset();
    document.getElementById('empId').value = '';
    clearEmpExprRows();
}

function submitEmp() {
    const id = document.getElementById('empId').value;
    const isEdit = id !== '';

    const username = document.getElementById('empUsername').value.trim();
    const name = document.getElementById('empName').value.trim();
    const gender = document.getElementById('empGender').value;
    const phone = document.getElementById('empPhone').value.trim();
    const job = document.getElementById('empJob').value;
    const entryDate = document.getElementById('empEntryDate').value;
    const deptId = document.getElementById('empDeptId').value;
    const salary = document.getElementById('empSalary').value;
    const image = document.getElementById('empImage').value.trim();

    if (!username) { alert('请输入用户名'); return; }
    if (!name) { alert('请输入姓名'); return; }
    if (!gender) { alert('请选择性别'); return; }
    if (!job) { alert('请选择职位'); return; }
    if (!deptId) { alert('请选择部门'); return; }

    const empExprList = collectEmpExprList();

    const body = {
        username: username,
        name: name, gender: parseInt(gender),
        phone: phone || null, job: parseInt(job),
        entryDate: entryDate || null, deptId: parseInt(deptId),
        salary: salary ? parseFloat(salary) : null, image: image || null,
        empExprList: empExprList
    };
    if (isEdit) body.id = parseInt(id);

    const url = `${BASE_URL}/emps`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
        .then(result => {
            if (result.code === 1) {
                closeEmpModal();
                fetchEmps();
                alert(isEdit ? '修改成功' : '新增成功');
            } else {
                alert('操作失败：' + (result.message || '未知错误'));
            }
        })
        .catch(error => {
            console.error('提交失败:', error);
            alert('操作失败，请检查网络');
        });
}

// ===== 点击弹窗外部关闭 =====
window.onclick = function(event) {
    if (event.target === document.getElementById('deptModal')) closeDeptModal();
    if (event.target === document.getElementById('deptDeleteModal')) closeDeptDeleteModal();
    if (event.target === document.getElementById('empModal')) closeEmpModal();
    if (event.target === document.getElementById('empDeleteModal')) closeEmpDeleteModal();
};

// ===== 页面加载：默认显示部门管理 =====
document.addEventListener('DOMContentLoaded', function() {
    fetchDepts();
});
