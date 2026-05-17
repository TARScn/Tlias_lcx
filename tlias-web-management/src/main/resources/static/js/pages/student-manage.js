// ===== 学员管理页面 =====

// 分页状态
var stuCurrentPage = 1;
var stuPageSize = 10;
var stuTotalPages = 1;
var stuTotalCount = 0;

// 搜索参数
var stuSearchParams = {
    name: '',
    degree: '',
    clazzId: ''
};

// 删除状态
var stuDeleteId = null;
var stuBatchDeleteMode = false;

// 班级列表缓存（供新增/编辑下拉使用）
var stuClazzList = [];

/**
 * 加载学员列表
 */
function fetchStudents() {
    var tbody = document.getElementById('stuTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载中...</td></tr>';

    apiGetStudentList({
        pageNum: stuCurrentPage,
        pageSize: stuPageSize,
        name: stuSearchParams.name,
        degree: stuSearchParams.degree ? parseInt(stuSearchParams.degree) : null,
        clazzId: stuSearchParams.clazzId ? parseInt(stuSearchParams.clazzId) : null
    })
    .then(function(result) {
        if (result.code === 1 && result.data) {
            renderStudentTable(result.data);
            stuTotalCount = result.data.total || 0;
            stuTotalPages = Math.ceil(stuTotalCount / stuPageSize) || 1;
            updateStuPagination();
        } else {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败：' + (result.message || '未知错误') + '</td></tr>';
        }
    })
    .catch(function(error) {
        console.error('获取学员列表失败:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败，请确保后端服务已启动</td></tr>';
    });
}

/**
 * 渲染学员表格
 */
function renderStudentTable(pageData) {
    var tbody = document.getElementById('stuTableBody');
    if (!tbody) return;
    var stuList = pageData.data || pageData;

    if (!stuList || stuList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无学员数据</td></tr>';
        return;
    }

    var degreeMap = { 1: '初中', 2: '高中', 3: '大专', 4: '本科', 5: '硕士', 6: '博士' };
    var collegeMap = { 0: '否', 1: '是' };

    var html = '';
    stuList.forEach(function(stu) {
        html +=
            '<tr>' +
                '<td><input type="checkbox" class="stu-checkbox" value="' + stu.id + '" onchange="updateStuCheckAllState()"></td>' +
                '<td>' + escapeHtml(stu.name) + '</td>' +
                '<td>' + getGenderText(stu.gender) + '</td>' +
                '<td>' + escapeHtml(stu.no || '-') + '</td>' +
                '<td>' + escapeHtml(stu.clazzName || '-') + '</td>' +
                '<td>' + (degreeMap[stu.degree] || '-') + '</td>' +
                '<td>' + (stu.violationScore || 0) + '</td>' +
                '<td>' +
                    '<button class="btn-edit" onclick="openStuEditModal(' + stu.id + ')">编辑</button>' +
                    '<button class="btn-delete-text" onclick="openStuViolationModal(' + stu.id + ', \'' + escapeHtml(stu.name) + '\')">违纪</button>' +
                    '<button class="btn-delete-text" onclick="openStuDeleteModal(' + stu.id + ', \'' + escapeHtml(stu.name) + '\')">删除</button>' +
                '</td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
}

// ===== 搜索 =====

function searchStudents() {
    stuSearchParams.name = document.getElementById('stuSearchName').value.trim();
    stuSearchParams.degree = document.getElementById('stuSearchDegree').value;
    stuSearchParams.clazzId = document.getElementById('stuSearchClazzId').value;
    stuCurrentPage = 1;
    fetchStudents();
}

function clearStudentSearch() {
    document.getElementById('stuSearchName').value = '';
    document.getElementById('stuSearchDegree').value = '';
    document.getElementById('stuSearchClazzId').value = '';
    stuSearchParams = { name: '', degree: '', clazzId: '' };
    stuCurrentPage = 1;
    fetchStudents();
}

// ===== 分页 =====

function stuGoPage(page) {
    if (page < 1 || page > stuTotalPages) return;
    stuCurrentPage = page;
    fetchStudents();
}

function changeStuPageSize() {
    stuPageSize = parseInt(document.getElementById('stuPageSizeSelect').value);
    stuCurrentPage = 1;
    fetchStudents();
}

function updateStuPagination() {
    document.getElementById('stuTotalCount').textContent = stuTotalCount;
    document.getElementById('stuCurrentPageNum').textContent = stuCurrentPage;
    document.getElementById('stuTotalPagesNum').textContent = stuTotalPages;

    document.getElementById('stuBtnFirst').disabled = stuCurrentPage <= 1;
    document.getElementById('stuBtnPrev').disabled = stuCurrentPage <= 1;
    document.getElementById('stuBtnNext').disabled = stuCurrentPage >= stuTotalPages;
    document.getElementById('stuBtnLast').disabled = stuCurrentPage >= stuTotalPages;
}

// ===== 全选 =====

function toggleStuCheckAll(checkbox) {
    var boxes = document.querySelectorAll('.stu-checkbox');
    boxes.forEach(function(cb) { cb.checked = checkbox.checked; });
}

function updateStuCheckAllState() {
    var checkAll = document.getElementById('stuCheckAll');
    var boxes = document.querySelectorAll('.stu-checkbox');
    var checkedCount = document.querySelectorAll('.stu-checkbox:checked').length;
    checkAll.checked = boxes.length > 0 && checkedCount === boxes.length;
    checkAll.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
}

// ===== 批量删除 =====

function batchDeleteStudents() {
    var checkedBoxes = document.querySelectorAll('.stu-checkbox:checked');
    if (checkedBoxes.length === 0) {
        alert('请先选择要删除的学员');
        return;
    }

    var ids = Array.from(checkedBoxes).map(function(cb) { return parseInt(cb.value); });
    document.getElementById('stuDeleteModalTitle').textContent = '批量删除确认';
    document.getElementById('stuDeleteModalMsg').textContent = '确定要删除选中的 ' + ids.length + ' 名学员吗？此操作不可撤销。';
    document.getElementById('stuDeleteModal').style.display = 'block';
    stuBatchDeleteMode = true;

    var confirmBtn = document.getElementById('confirmStuDeleteBtn');
    var newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', function() {
        executeStuBatchDelete(ids);
    });
}

function executeStuBatchDelete(ids) {
    apiBatchDeleteStudents(ids)
        .then(function(result) {
            if (result.code === 1) {
                closeStuDeleteModal();
                document.getElementById('stuCheckAll').checked = false;
                fetchStudents();
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

function openStuDeleteModal(id, name) {
    stuDeleteId = id;
    stuBatchDeleteMode = false;
    document.getElementById('stuDeleteModalTitle').textContent = '确认删除';
    document.getElementById('stuDeleteModalMsg').textContent = '确定要删除学员「' + name + '」吗？此操作不可撤销。';
    document.getElementById('stuDeleteModal').style.display = 'block';

    var confirmBtn = document.getElementById('confirmStuDeleteBtn');
    var newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', confirmStuDelete);
}

function closeStuDeleteModal() {
    stuDeleteId = null;
    stuBatchDeleteMode = false;
    document.getElementById('stuDeleteModal').style.display = 'none';
}

function confirmStuDelete() {
    if (stuDeleteId === null) return;

    apiDeleteStudent(stuDeleteId)
        .then(function(result) {
            if (result.code === 1) {
                closeStuDeleteModal();
                fetchStudents();
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

// ===== 班级下拉框加载 =====

function loadStuClazzOptions(targetSelectId, selectedValue) {
    var select = document.getElementById(targetSelectId);
    if (!select) return;

    apiGetAllClazzForStudent()
        .then(function(result) {
            if (result.code === 1 && result.data) {
                select.innerHTML = '<option value="">请选择班级</option>';
                result.data.forEach(function(clazz) {
                    var selected = (selectedValue && clazz.id == selectedValue) ? ' selected' : '';
                    select.innerHTML += '<option value="' + clazz.id + '"' + selected + '>' + escapeHtml(clazz.name) + '</option>';
                });
            }
        })
        .catch(function(error) {
            console.error('加载班级列表失败:', error);
        });
}

// ===== 违纪扣分弹窗 =====

var stuViolationId = null;
var stuViolationName = '';

function openStuViolationModal(id, name) {
    stuViolationId = id;
    stuViolationName = name;
    document.getElementById('stuViolationName').textContent = name;
    document.getElementById('stuViolationScore').value = '';
    document.getElementById('stuViolationModal').style.display = 'block';
}

function closeStuViolationModal() {
    stuViolationId = null;
    stuViolationName = '';
    document.getElementById('stuViolationModal').style.display = 'none';
}

function confirmStuViolation() {
    if (stuViolationId === null) return;

    var scoreInput = document.getElementById('stuViolationScore');
    var score = parseInt(scoreInput.value);
    if (!score || score <= 0) {
        alert('请输入有效的扣分分数（大于0）');
        return;
    }

    apiStudentViolation(stuViolationId, score)
        .then(function(result) {
            if (result.code === 1) {
                closeStuViolationModal();
                fetchStudents();
                alert('违纪扣分成功');
            } else {
                alert('违纪扣分失败：' + (result.message || '未知错误'));
            }
        })
        .catch(function(error) {
            console.error('违纪扣分失败:', error);
            alert('违纪扣分失败，请检查网络');
        });
}

// ===== 新增/编辑弹窗 =====

/**
 * 学历选项HTML（供复用）
 */
function getDegreeOptions(selected) {
    var degrees = [
        { value: 1, label: '初中' },
        { value: 2, label: '高中' },
        { value: 3, label: '大专' },
        { value: 4, label: '本科' },
        { value: 5, label: '硕士' },
        { value: 6, label: '博士' }
    ];
    var html = '<option value="">请选择</option>';
    degrees.forEach(function(d) {
        var sel = (selected && d.value == selected) ? ' selected' : '';
        html += '<option value="' + d.value + '"' + sel + '>' + d.label + '</option>';
    });
    return html;
}

function openStuAddModal() {
    document.getElementById('stuModalTitle').textContent = '新增学员';
    document.getElementById('stuId').value = '';
    document.getElementById('stuForm').reset();
    document.getElementById('stuDegree').innerHTML = getDegreeOptions();

    // 加载班级列表
    loadStuClazzOptions('stuClazzId');

    document.getElementById('stuModal').style.display = 'block';
}

function openStuEditModal(id) {
    document.getElementById('stuModalTitle').textContent = '编辑学员';

    // 先加载班级列表
    loadStuClazzOptions('stuClazzId');

    apiGetStudentById(id)
        .then(function(result) {
            if (result.code === 1 && result.data) {
                var stu = result.data;
                document.getElementById('stuId').value = stu.id;
                document.getElementById('stuName').value = stu.name || '';
                document.getElementById('stuNo').value = stu.no || '';
                document.getElementById('stuGender').value = stu.gender || '';
                document.getElementById('stuPhone').value = stu.phone || '';
                document.getElementById('stuIdCard').value = stu.idCard || '';
                document.getElementById('stuIsCollege').value = stu.isCollege !== null && stu.isCollege !== undefined ? stu.isCollege : '';
                document.getElementById('stuAddress').value = stu.address || '';
                document.getElementById('stuDegree').innerHTML = getDegreeOptions(stu.degree);
                document.getElementById('stuGraduationDate').value = stu.graduationDate || '';
                // 重新加载班级列表并选中
                loadStuClazzOptions('stuClazzId', stu.clazzId);
                document.getElementById('stuModal').style.display = 'block';
            } else {
                alert('获取学员信息失败');
            }
        })
        .catch(function(error) {
            console.error('获取学员信息失败:', error);
            alert('获取学员信息失败，请检查网络');
        });
}

function closeStuModal() {
    document.getElementById('stuModal').style.display = 'none';
    document.getElementById('stuForm').reset();
    document.getElementById('stuId').value = '';
}

function submitStudent() {
    var id = document.getElementById('stuId').value;
    var isEdit = id !== '';

    var name = document.getElementById('stuName').value.trim();
    var no = document.getElementById('stuNo').value.trim();
    var gender = document.getElementById('stuGender').value;
    var phone = document.getElementById('stuPhone').value.trim();
    var idCard = document.getElementById('stuIdCard').value.trim();
    var isCollege = document.getElementById('stuIsCollege').value;
    var address = document.getElementById('stuAddress').value.trim();
    var degree = document.getElementById('stuDegree').value;
    var graduationDate = document.getElementById('stuGraduationDate').value;
    var clazzId = document.getElementById('stuClazzId').value;

    if (!name) { alert('请输入学员姓名'); return; }
    if (!gender) { alert('请选择性别'); return; }
    if (!degree) { alert('请选择最高学历'); return; }
    if (!clazzId) { alert('请选择所在班级'); return; }

    var data = {
        name: name,
        no: no || null,
        gender: parseInt(gender),
        phone: phone || null,
        idCard: idCard || null,
        isCollege: isCollege !== '' ? parseInt(isCollege) : null,
        address: address || null,
        degree: parseInt(degree),
        graduationDate: graduationDate || null,
        clazzId: parseInt(clazzId)
    };
    if (isEdit) data.id = parseInt(id);

    var promise = isEdit ? apiUpdateStudent(data) : apiAddStudent(data);

    promise
        .then(function(result) {
            if (result.code === 1) {
                closeStuModal();
                fetchStudents();
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
