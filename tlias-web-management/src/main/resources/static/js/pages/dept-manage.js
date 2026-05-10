// ===== 部门管理页面 =====

// 待删除的部门 ID
var deptDeleteId = null;

/**
 * 加载部门列表
 */
function fetchDepts() {
    var tbody = document.getElementById('deptTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state">加载中...</td></tr>';

    apiGetDepts()
        .then(function(result) {
            if (result.code === 1) {
                renderDeptTable(result.data);
            } else {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">加载失败：' + (result.message || '未知错误') + '</td></tr>';
            }
        })
        .catch(function(error) {
            console.error('获取部门列表失败:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">加载失败，请确保后端服务已启动</td></tr>';
        });
}

/**
 * 渲染部门表格
 */
function renderDeptTable(deptList) {
    var tbody = document.getElementById('deptTableBody');
    if (!tbody) return;

    if (!deptList || deptList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">暂无部门数据</td></tr>';
        return;
    }

    var html = '';
    deptList.forEach(function(dept, index) {
        html +=
            '<tr>' +
                '<td>' + (index + 1) + '</td>' +
                '<td>' + escapeHtml(dept.name) + '</td>' +
                '<td>' + formatDateTime(dept.updateTime) + '</td>' +
                '<td>' +
                    '<button class="btn-edit" onclick="openDeptEditModal(' + dept.id + ')">修改</button>' +
                    '<button class="btn-delete-text" onclick="openDeptDeleteModal(' + dept.id + ', \'' + escapeHtml(dept.name) + '\')">删除</button>' +
                '</td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
}

// ===== 部门弹窗 =====

/**
 * 打开新增部门弹窗
 */
function openDeptAddModal() {
    document.getElementById('deptModalTitle').textContent = '新增部门';
    document.getElementById('deptId').value = '';
    document.getElementById('deptName').value = '';
    document.getElementById('deptModal').style.display = 'block';
}

/**
 * 打开编辑部门弹窗
 */
function openDeptEditModal(id) {
    document.getElementById('deptModalTitle').textContent = '修改部门';

    apiGetDeptById(id)
        .then(function(result) {
            if (result.code === 1 && result.data) {
                document.getElementById('deptId').value = result.data.id;
                document.getElementById('deptName').value = result.data.name;
                document.getElementById('deptModal').style.display = 'block';
            } else {
                alert('获取部门信息失败');
            }
        })
        .catch(function(error) {
            console.error('获取部门信息失败:', error);
            alert('获取部门信息失败，请检查网络');
        });
}

/**
 * 关闭部门弹窗
 */
function closeDeptModal() {
    document.getElementById('deptModal').style.display = 'none';
    document.getElementById('deptForm').reset();
    document.getElementById('deptId').value = '';
}

/**
 * 提交部门（新增/编辑）
 */
function submitDept() {
    var id = document.getElementById('deptId').value;
    var name = document.getElementById('deptName').value.trim();

    if (!name) {
        alert('请输入部门名称');
        return;
    }

    var isEdit = id !== '';
    var promise = isEdit
        ? apiUpdateDept(parseInt(id), name)
        : apiAddDept(name);

    promise
        .then(function(result) {
            if (result.code === 1) {
                closeDeptModal();
                fetchDepts();
                alert(isEdit ? '修改成功' : '新增成功');
            } else {
                alert('操作失败：' + (result.message || '未知错误'));
            }
        })
        .catch(function(error) {
            console.error('提交失败:', error);
            alert('操作失败，请检查网络');
        });
}

// ===== 部门删除弹窗 =====

/**
 * 打开部门删除确认弹窗
 */
function openDeptDeleteModal(id, name) {
    deptDeleteId = id;
    document.getElementById('deleteDeptName').textContent = name;
    document.getElementById('deptDeleteModal').style.display = 'block';
}

/**
 * 关闭部门删除弹窗
 */
function closeDeptDeleteModal() {
    deptDeleteId = null;
    document.getElementById('deptDeleteModal').style.display = 'none';
}

/**
 * 确认删除部门
 */
function confirmDeptDelete() {
    if (deptDeleteId === null) return;

    apiDeleteDept(deptDeleteId)
        .then(function(result) {
            if (result.code === 1) {
                closeDeptDeleteModal();
                fetchDepts();
                alert('删除成功');
            } else {
                alert('删除失败：' + (result.message || '未知错误'));
            }
        })
        .catch(function(error) {
            console.error('删除失败:', error);
            alert('删除失败，请检查网络');
        });
}
