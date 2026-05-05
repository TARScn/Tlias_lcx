// ===== 基础配置 =====
const BASE_URL = 'http://localhost:8080';

// ===== 工具函数 =====
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    try {
        const dt = new Date(dateTimeStr);
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
        // 实际项目中会跳转到登录页
    }
}

// ===== 部门管理 - 获取列表 =====
function fetchDepts() {
    const tbody = document.getElementById('deptTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">加载中...</td></tr>';

    fetch(`${BASE_URL}/depts`)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络请求失败: ' + response.status);
            }
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

// ===== 渲染部门表格 =====
function renderDeptTable(deptList) {
    const tbody = document.getElementById('deptTableBody');
    
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
                    <button class="btn btn-edit" onclick="openEditModal(${dept.id})">修改</button>
                    <button class="btn btn-delete" onclick="openDeleteModal(${dept.id}, '${escapeHtml(dept.name)}')">删除</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// ===== HTML 转义（防止 XSS） =====
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== 弹窗控制 =====
function openModal() {
    document.getElementById('deptModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('deptModal').style.display = 'none';
    document.getElementById('deptForm').reset();
    document.getElementById('deptId').value = '';
}

// ===== 新增部门 =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = '新增部门';
    document.getElementById('deptId').value = '';
    document.getElementById('deptName').value = '';
    openModal();
}

// ===== 修改部门 - 打开弹窗并回填数据 =====
function openEditModal(id) {
    document.getElementById('modalTitle').textContent = '修改部门';
    
    fetch(`${BASE_URL}/depts/${id}`)
        .then(response => response.json())
        .then(result => {
            if (result.code === 1 && result.data) {
                document.getElementById('deptId').value = result.data.id;
                document.getElementById('deptName').value = result.data.name;
                openModal();
            } else {
                alert('获取部门信息失败');
            }
        })
        .catch(error => {
            console.error('获取部门信息失败:', error);
            alert('获取部门信息失败，请检查网络');
        });
}

// ===== 提交新增/修改 =====
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
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    })
        .then(response => response.json())
        .then(result => {
            if (result.code === 1) {
                closeModal();
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

// ===== 删除确认弹窗 =====
let deleteId = null;

function openDeleteModal(id, name) {
    deleteId = id;
    document.getElementById('deleteDeptName').textContent = name;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    deleteId = null;
    document.getElementById('deleteModal').style.display = 'none';
}

function confirmDelete() {
    if (deleteId === null) return;

    fetch(`${BASE_URL}/depts?id=${deleteId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(result => {
            if (result.code === 1) {
                closeDeleteModal();
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

// ===== 点击弹窗外部关闭 =====
window.onclick = function(event) {
    const deptModal = document.getElementById('deptModal');
    const deleteModal = document.getElementById('deleteModal');
    if (event.target === deptModal) {
        closeModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
};

// ===== 页面加载完成后获取数据 =====
document.addEventListener('DOMContentLoaded', function() {
    fetchDepts();
});
