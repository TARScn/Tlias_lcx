// ===== 班级管理页面 =====

// 当前分页状态
var clazzCurrentPage = 1;
var clazzTotalPages = 1;
var clazzTotalCount = 0;
var clazzPageSize = 10;
var clazzDeleteId = null;

// 班主任数据缓存（用于滚轮检索）
var mastersList = [];

/**
 * 加载班级列表
 */
function fetchClazzList() {
    var tbody = document.getElementById('clazzTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">加载中...</td></tr>';

    var name = document.getElementById('clazzSearchName') ? document.getElementById('clazzSearchName').value.trim() : '';

    apiGetClazzList({
        pageNum: clazzCurrentPage,
        pageSize: clazzPageSize,
        name: name
    })
    .then(function(result) {
        if (result.code === 1 && result.data) {
            renderClazzTable(result.data.data, result.data.total);
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">加载失败：' + (result.message || '未知错误') + '</td></tr>';
        }
    })
    .catch(function(error) {
        console.error('获取班级列表失败:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">加载失败，请确保后端服务已启动</td></tr>';
    });
}

/**
 * 渲染班级表格
 */
function renderClazzTable(clazzList, total) {
    var tbody = document.getElementById('clazzTableBody');
    if (!tbody) return;

    clazzTotalCount = total || 0;
    var pageSize = clazzPageSize;
    clazzTotalPages = Math.ceil(clazzTotalCount / pageSize) || 1;

    if (!clazzList || clazzList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无班级数据</td></tr>';
        updateClazzPagination();
        return;
    }

    // 学科映射
    var subjectMap = { 1: 'Java', 2: '前端', 3: '大数据', 4: 'Python', 5: '其他' };

    var html = '';
    // 计算当前页起始序号
    var startIndex = (clazzCurrentPage - 1) * pageSize;
    clazzList.forEach(function(clazz, index) {
        // 转换日期格式
        var beginDate = formatDate(clazz.beginDate);
        var endDate = formatDate(clazz.endDate);
        var updateTime = formatDateTime(clazz.updateTime);
        var subjectText = subjectMap[clazz.subject] || '-';

        // 状态样式
        var statusClass = '';
        var statusText = clazz.status || '-';
        if (statusText === '未开班') statusClass = 'status-pending';
        else if (statusText === '在读中') statusClass = 'status-active';
        else if (statusText === '已结课') statusClass = 'status-ended';

        html +=
            '<tr>' +
                '<td>' + (startIndex + index + 1) + '</td>' +
                '<td>' + escapeHtml(clazz.name) + '</td>' +
                '<td>' + escapeHtml(clazz.room || '-') + '</td>' +
                '<td>' + escapeHtml(clazz.masterName || '-') + '</td>' +
                '<td>' + beginDate + ' ~ ' + endDate + '</td>' +
                '<td><span class="status-tag ' + statusClass + '">' + statusText + '</span></td>' +
                '<td>' +
                    '<button class="btn-edit" onclick="openClazzEditModal(' + clazz.id + ')">修改</button>' +
                    '<button class="btn-delete-text" onclick="openClazzDeleteModal(' + clazz.id + ', \'' + escapeHtml(clazz.name) + '\')">删除</button>' +
                '</td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
    updateClazzPagination();
}

/**
 * 更新分页信息
 */
function updateClazzPagination() {
    var totalEl = document.getElementById('clazzTotalCount');
    var currentEl = document.getElementById('clazzCurrentPageNum');
    var totalPagesEl = document.getElementById('clazzTotalPagesNum');
    var btnFirst = document.getElementById('clazzBtnFirst');
    var btnPrev = document.getElementById('clazzBtnPrev');
    var btnNext = document.getElementById('clazzBtnNext');
    var btnLast = document.getElementById('clazzBtnLast');

    if (totalEl) totalEl.textContent = clazzTotalCount;
    if (currentEl) currentEl.textContent = clazzCurrentPage;
    if (totalPagesEl) totalPagesEl.textContent = clazzTotalPages;

    if (btnFirst) btnFirst.disabled = clazzCurrentPage <= 1;
    if (btnPrev) btnPrev.disabled = clazzCurrentPage <= 1;
    if (btnNext) btnNext.disabled = clazzCurrentPage >= clazzTotalPages;
    if (btnLast) btnLast.disabled = clazzCurrentPage >= clazzTotalPages;
}

/**
 * 班级分页跳转
 */
function clazzGoPage(page) {
    if (page < 1 || page > clazzTotalPages) return;
    clazzCurrentPage = page;
    fetchClazzList();
}

/**
 * 改变每页条数
 */
function changeClazzPageSize() {
    var sel = document.getElementById('clazzPageSizeSelect');
    if (sel) {
        clazzPageSize = parseInt(sel.value);
        clazzCurrentPage = 1;
        fetchClazzList();
    }
}

/**
 * 班级搜索
 */
function searchClazz() {
    clazzCurrentPage = 1;
    fetchClazzList();
}

/**
 * 清空班级搜索
 */
function clearClazzSearch() {
    document.getElementById('clazzSearchName').value = '';
    clazzCurrentPage = 1;
    fetchClazzList();
}

// ===== 班主任下拉检索 =====

/**
 * 加载班主任列表（供新增/编辑弹窗使用）
 */
function loadMasters() {
    return apiListMasters().then(function(result) {
        if (result.code === 1 && result.data) {
            mastersList = result.data;
            return mastersList;
        }
        return [];
    }).catch(function(error) {
        console.error('获取班主任列表失败:', error);
        return [];
    });
}

/**
 * 渲染班主任下拉选项
 */
function renderMasterOptions(filterText) {
    var select = document.getElementById('clazzMasterId');
    if (!select) return;
    select.innerHTML = '<option value="">请选择班主任</option>';
    var filtered = mastersList;
    if (filterText) {
        filtered = mastersList.filter(function(m) {
            return m.name.indexOf(filterText) !== -1;
        });
    }
    filtered.forEach(function(m) {
        var option = document.createElement('option');
        option.value = m.id;
        option.textContent = m.name;
        select.appendChild(option);
    });
}

/**
 * 班主任输入框输入时自动检索
 */
function onMasterInput() {
    var input = document.getElementById('clazzMasterSearch');
    if (!input) return;
    var val = input.value.trim();
    renderMasterOptions(val);
    // 如果有精确匹配，选中该项
    var select = document.getElementById('clazzMasterId');
    for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].text === val) {
            select.value = select.options[i].value;
            break;
        }
    }
}

// ===== 班级弹窗 =====

/**
 * 打开新增班级弹窗
 */
function openClazzAddModal() {
    document.getElementById('clazzModalTitle').textContent = '新增班级';
    document.getElementById('clazzId').value = '';
    document.getElementById('clazzModalForm').reset();
    document.getElementById('clazzName').value = '';
    document.getElementById('clazzRoom').value = '';
    document.getElementById('clazzBeginDate').value = '';
    document.getElementById('clazzEndDate').value = '';
    document.getElementById('clazzSubject').value = '';
    document.getElementById('clazzMasterSearch').value = '';
    document.getElementById('clazzMasterId').value = '';

    // 加载班主任列表
    loadMasters().then(function() {
        renderMasterOptions('');
    });

    document.getElementById('clazzModal').style.display = 'block';
}

/**
 * 打开编辑班级弹窗
 */
function openClazzEditModal(id) {
    document.getElementById('clazzModalTitle').textContent = '修改班级';

    // 先加载班主任列表，再加载班级信息
    loadMasters().then(function() {
        renderMasterOptions('');
        return apiGetClazzById(id);
    })
    .then(function(result) {
        if (result.code === 1 && result.data) {
            var clazz = result.data;
            document.getElementById('clazzId').value = clazz.id;
            document.getElementById('clazzName').value = clazz.name || '';
            document.getElementById('clazzRoom').value = clazz.room || '';
            document.getElementById('clazzBeginDate').value = clazz.beginDate || '';
            document.getElementById('clazzEndDate').value = clazz.endDate || '';
            document.getElementById('clazzSubject').value = clazz.subject || '';
            document.getElementById('clazzMasterId').value = clazz.masterId || '';
            // 在搜索框中显示班主任姓名
            document.getElementById('clazzMasterSearch').value = clazz.masterName || '';
            document.getElementById('clazzModal').style.display = 'block';
        } else {
            alert('获取班级信息失败');
        }
    })
    .catch(function(error) {
        console.error('获取班级信息失败:', error);
        alert('获取班级信息失败，请检查网络');
    });
}

/**
 * 关闭班级弹窗
 */
function closeClazzModal() {
    document.getElementById('clazzModal').style.display = 'none';
    document.getElementById('clazzModalForm').reset();
    document.getElementById('clazzId').value = '';
}

/**
 * 提交班级（新增/编辑）
 */
function submitClazz() {
    var id = document.getElementById('clazzId').value;
    var name = document.getElementById('clazzName').value.trim();
    var room = document.getElementById('clazzRoom').value.trim();
    var beginDate = document.getElementById('clazzBeginDate').value;
    var endDate = document.getElementById('clazzEndDate').value;
    var subject = document.getElementById('clazzSubject').value;
    var masterId = document.getElementById('clazzMasterId').value;

    if (!name) {
        alert('请输入班级名称');
        return;
    }
    if (!beginDate) {
        alert('请选择开课时间');
        return;
    }
    if (!endDate) {
        alert('请选择结课时间');
        return;
    }
    if (!subject) {
        alert('请选择学科');
        return;
    }
    if (!masterId) {
        alert('请选择班主任');
        return;
    }

    var data = {
        name: name,
        room: room,
        beginDate: beginDate,
        endDate: endDate,
        subject: parseInt(subject),
        masterId: parseInt(masterId)
    };

    var isEdit = id !== '';
    if (isEdit) {
        data.id = parseInt(id);
    }

    var promise = isEdit ? apiUpdateClazz(data) : apiAddClazz(data);

    promise
        .then(function(result) {
            if (result.code === 1) {
                closeClazzModal();
                fetchClazzList();
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

// ===== 班级删除弹窗 =====

/**
 * 打开班级删除确认弹窗
 */
function openClazzDeleteModal(id, name) {
    clazzDeleteId = id;
    document.getElementById('deleteClazzName').textContent = name;
    document.getElementById('clazzDeleteModal').style.display = 'block';
}

/**
 * 关闭班级删除弹窗
 */
function closeClazzDeleteModal() {
    clazzDeleteId = null;
    document.getElementById('clazzDeleteModal').style.display = 'none';
}

/**
 * 确认删除班级
 */
function confirmClazzDelete() {
    if (clazzDeleteId === null) return;

    apiDeleteClazz(clazzDeleteId)
        .then(function(result) {
            if (result.code === 1) {
                closeClazzDeleteModal();
                fetchClazzList();
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
