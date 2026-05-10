// ===== 员工管理页面 =====

// 分页状态
var currentPage = 1;
var pageSize = 10;
var totalPages = 1;
var totalCount = 0;

// 搜索参数
var empSearchParams = {
    name: '',
    gender: '',
    begin: '',
    end: ''
};

// 删除状态
var empDeleteId = null;
var empBatchDeleteMode = false;

/**
 * 加载员工列表
 */
function fetchEmps() {
    var tbody = document.getElementById('empTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载中...</td></tr>';

    apiGetEmps({
        pageNum: currentPage,
        pageSize: pageSize,
        name: empSearchParams.name,
        gender: empSearchParams.gender,
        begin: empSearchParams.begin,
        end: empSearchParams.end
    })
        .then(function(result) {
            if (result.code === 1 && result.data) {
                renderEmpTable(result.data);
                totalCount = result.data.total || 0;
                totalPages = Math.ceil(totalCount / pageSize) || 1;
                updatePagination();
            } else {
                tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败：' + (result.message || '未知错误') + '</td></tr>';
            }
        })
        .catch(function(error) {
            console.error('获取员工列表失败:', error);
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败，请确保后端服务已启动</td></tr>';
        });
}

/**
 * 渲染员工表格
 */
function renderEmpTable(pageData) {
    var tbody = document.getElementById('empTableBody');
    if (!tbody) return;
    var empList = pageData.data || pageData;

    if (!empList || empList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无员工数据</td></tr>';
        return;
    }

    var html = '';
    empList.forEach(function(emp) {
        var imageHtml = emp.image
            ? '<img src="' + escapeHtml(emp.image) + '" class="avatar-img" alt="头像" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\';">'
            : '';
        var fallbackHtml = emp.image
            ? '<span class="avatar-placeholder" style="display:none;">👤</span>'
            : '<span class="avatar-placeholder">👤</span>';

        html +=
            '<tr>' +
                '<td><input type="checkbox" class="emp-checkbox" value="' + emp.id + '" onchange="updateCheckAllState()"></td>' +
                '<td>' + escapeHtml(emp.name) + '</td>' +
                '<td>' + getGenderText(emp.gender) + '</td>' +
                '<td>' + imageHtml + fallbackHtml + '</td>' +
                '<td>' + escapeHtml(emp.deptName || '-') + '</td>' +
                '<td>' + getJobText(emp.job) + '</td>' +
                '<td>' + formatDate(emp.entryDate) + '</td>' +
                '<td>' + formatDateTime(emp.updateTime) + '</td>' +
                '<td>' +
                    '<button class="btn-edit" onclick="openEmpEditModal(' + emp.id + ')">编辑</button>' +
                    '<button class="btn-delete-text" onclick="openEmpDeleteModal(' + emp.id + ', \'' + escapeHtml(emp.name) + '\')">删除</button>' +
                '</td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
}

// ===== 搜索 =====

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

// ===== 分页 =====

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

// ===== 全选 =====

function toggleCheckAll(checkbox) {
    var boxes = document.querySelectorAll('.emp-checkbox');
    boxes.forEach(function(cb) { cb.checked = checkbox.checked; });
}

function updateCheckAllState() {
    var checkAll = document.getElementById('checkAll');
    var boxes = document.querySelectorAll('.emp-checkbox');
    var checkedCount = document.querySelectorAll('.emp-checkbox:checked').length;
    checkAll.checked = boxes.length > 0 && checkedCount === boxes.length;
    checkAll.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
}

// ===== 批量删除 =====

function batchDeleteEmps() {
    var checkedBoxes = document.querySelectorAll('.emp-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert('请先选择要删除的员工');
        return;
    }

    var ids = Array.from(checkedBoxes).map(function(cb) { return parseInt(cb.value); });
    document.getElementById('empDeleteModalTitle').textContent = '批量删除确认';
    document.getElementById('empDeleteModalMsg').textContent = '确定要删除选中的 ' + ids.length + ' 名员工吗？此操作不可撤销。';
    document.getElementById('empDeleteModal').style.display = 'block';
    empBatchDeleteMode = true;

    var confirmBtn = document.getElementById('confirmEmpDeleteBtn');
    var newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', function() {
        executeBatchDelete(ids);
    });
}

function executeBatchDelete(ids) {
    apiBatchDeleteEmps(ids)
        .then(function(result) {
            if (result.code === 1) {
                closeEmpDeleteModal();
                document.getElementById('checkAll').checked = false;
                fetchEmps();
                alert('批量删除成功');
            } else {
                alert('批量删除失败：' + (result.message || '未知错误'));
            }
        })
        .catch(function(error) {
            console.error('批量删除失败:', error);
            alert('批量删除失败，请检查网络');
        });
}

// ===== 单个删除 =====

function openEmpDeleteModal(id, name) {
    empDeleteId = id;
    empBatchDeleteMode = false;
    document.getElementById('empDeleteModalTitle').textContent = '确认删除';
    document.getElementById('empDeleteModalMsg').textContent = '确定要删除员工「' + name + '」吗？此操作不可撤销。';
    document.getElementById('empDeleteModal').style.display = 'block';

    var confirmBtn = document.getElementById('confirmEmpDeleteBtn');
    var newBtn = confirmBtn.cloneNode(true);
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

    apiDeleteEmp(empDeleteId)
        .then(function(result) {
            if (result.code === 1) {
                closeEmpDeleteModal();
                fetchEmps();
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

// ===== 部门下拉框加载 =====

function loadDeptOptions(targetSelectId) {
    var select = document.getElementById(targetSelectId);
    if (!select) return;

    apiGetDepts()
        .then(function(result) {
            if (result.code === 1 && result.data) {
                select.innerHTML = '<option value="">请选择</option>';
                result.data.forEach(function(dept) {
                    select.innerHTML += '<option value="' + dept.id + '">' + escapeHtml(dept.name) + '</option>';
                });
            }
        })
        .catch(function(error) {
            console.error('加载部门列表失败:', error);
        });
}

// ===== 工作经历动态表单 =====

function addEmpExprRow(begin, end, company, job) {
    var container = document.getElementById('empExprContainer');
    if (!container) return;

    var row = document.createElement('div');
    row.className = 'emp-expr-row';
    row.innerHTML =
        '<div class="form-row">' +
            '<div class="form-group">' +
                '<label>公司名称</label>' +
                '<input type="text" class="expr-company" placeholder="请输入公司名称" value="' + escapeHtml(company || '') + '">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>职位</label>' +
                '<input type="text" class="expr-job" placeholder="请输入职位" value="' + escapeHtml(job || '') + '">' +
            '</div>' +
        '</div>' +
        '<div class="form-row">' +
            '<div class="form-group">' +
                '<label>开始时间</label>' +
                '<input type="date" class="expr-begin" value="' + (begin || '') + '">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>结束时间</label>' +
                '<input type="date" class="expr-end" value="' + (end || '') + '">' +
            '</div>' +
        '</div>' +
        '<div class="expr-row-actions">' +
            '<button type="button" class="btn-delete-text" onclick="removeEmpExprRow(this)">删除此经历</button>' +
        '</div>';
    container.appendChild(row);
}

function removeEmpExprRow(btn) {
    btn.closest('.emp-expr-row').remove();
}

function clearEmpExprRows() {
    var container = document.getElementById('empExprContainer');
    if (container) container.innerHTML = '';
}

function collectEmpExprList() {
    var rows = document.querySelectorAll('.emp-expr-row');
    var exprList = [];
    rows.forEach(function(row) {
        var begin = row.querySelector('.expr-begin').value;
        var end = row.querySelector('.expr-end').value;
        var company = row.querySelector('.expr-company').value.trim();
        var job = row.querySelector('.expr-job').value.trim();
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

// ===== 新增/编辑弹窗 =====

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

    apiGetEmpById(id)
        .then(function(result) {
            if (result.code === 1 && result.data) {
                var emp = result.data;
                document.getElementById('empId').value = emp.id;
                document.getElementById('empUsername').value = emp.username || '';
                document.getElementById('empName').value = emp.name || '';
                document.getElementById('empGender').value = emp.gender || '';
                document.getElementById('empPhone').value = emp.phone || '';
                document.getElementById('empJob').value = emp.job || '';
                document.getElementById('empEntryDate').value = formatDate(emp.entryDate) !== '-' ? formatDate(emp.entryDate) : '';
                document.getElementById('empSalary').value = emp.salary || '';
                document.getElementById('empImage').value = emp.image || '';
                setTimeout(function() {
                    document.getElementById('empDeptId').value = emp.deptId || '';
                }, 300);
                // 回填工作经历
                if (emp.empExprList && emp.empExprList.length > 0) {
                    emp.empExprList.forEach(function(expr) {
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
        .catch(function(error) {
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
    var id = document.getElementById('empId').value;
    var isEdit = id !== '';

    var username = document.getElementById('empUsername').value.trim();
    var name = document.getElementById('empName').value.trim();
    var gender = document.getElementById('empGender').value;
    var phone = document.getElementById('empPhone').value.trim();
    var job = document.getElementById('empJob').value;
    var entryDate = document.getElementById('empEntryDate').value;
    var deptId = document.getElementById('empDeptId').value;
    var salary = document.getElementById('empSalary').value;
    var image = document.getElementById('empImage').value.trim();

    if (!username) { alert('请输入用户名'); return; }
    if (!name) { alert('请输入姓名'); return; }
    if (!gender) { alert('请选择性别'); return; }
    if (!job) { alert('请选择职位'); return; }
    if (!deptId) { alert('请选择部门'); return; }

    var empExprList = collectEmpExprList();

    var body = {
        username: username,
        name: name,
        gender: parseInt(gender),
        phone: phone || null,
        job: parseInt(job),
        entryDate: entryDate || null,
        deptId: parseInt(deptId),
        salary: salary ? parseFloat(salary) : null,
        image: image || null,
        empExprList: empExprList
    };
    if (isEdit) body.id = parseInt(id);

    var promise = isEdit ? apiUpdateEmp(body) : apiAddEmp(body);

    promise
        .then(function(result) {
            if (result.code === 1) {
                closeEmpModal();
                fetchEmps();
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
