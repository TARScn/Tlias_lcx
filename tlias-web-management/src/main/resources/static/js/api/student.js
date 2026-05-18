// ===== 学员 API =====

/**
 * 分页条件查询学员列表
 */
function apiGetStudentList(params) {
    var urlParams = new URLSearchParams();
    urlParams.append('pageNum', params.pageNum);
    urlParams.append('pageSize', params.pageSize);
    if (params.name) urlParams.append('name', params.name);
    if (params.degree) urlParams.append('degree', params.degree);
    if (params.clazzId) urlParams.append('clazzId', params.clazzId);

    return authFetch(BASE_URL + '/students?' + urlParams.toString())
        .then(function(response) {
            if (!response.ok) throw new Error('网络请求失败: ' + response.status);
            return response.json();
        });
}

/**
 * 根据 ID 获取学员详情
 */
function apiGetStudentById(id) {
    return authFetch(BASE_URL + '/students/' + id)
        .then(function(response) { return response.json(); });
}

/**
 * 新增学员
 */
function apiAddStudent(data) {
    return authFetch(BASE_URL + '/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(function(response) { return response.json(); });
}

/**
 * 修改学员
 */
function apiUpdateStudent(data) {
    return authFetch(BASE_URL + '/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(function(response) { return response.json(); });
}

/**
 * 删除学员
 */
function apiDeleteStudent(id) {
    return authFetch(BASE_URL + '/students/' + id, { method: 'DELETE' })
        .then(function(response) { return response.json(); });
}

/**
 * 批量删除学员
 */
function apiBatchDeleteStudents(ids) {
    var params = new URLSearchParams();
    ids.forEach(function(id) { params.append('ids', id); });
    return authFetch(BASE_URL + '/students/batch?' + params.toString(), { method: 'DELETE' })
        .then(function(response) { return response.json(); });
}

/**
 * 学员违纪扣分
 */
function apiStudentViolation(id, score) {
    return authFetch(BASE_URL + '/students/violation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, score: score })
    }).then(function(response) { return response.json(); });
}

/**
 * 查询所有班级列表（供学员表单下拉使用）
 */
function apiGetAllClazzForStudent() {
    return authFetch(BASE_URL + '/students/clazzList')
        .then(function(response) { return response.json(); });
}

/**
 * 统计每个班级的学员人数（柱状图数据）
 */
function apiCountStudentByClazz() {
    return authFetch(BASE_URL + '/students/countClazz')
        .then(function(response) { return response.json(); });
}

/**
 * 统计学员学历分布（饼状图数据）
 */
function apiCountStudentByDegree() {
    return authFetch(BASE_URL + '/students/countDegree')
        .then(function(response) { return response.json(); });
}
