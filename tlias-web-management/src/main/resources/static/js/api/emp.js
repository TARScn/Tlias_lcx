// ===== 员工 API =====

/**
 * 条件分页查询员工
 */
function apiGetEmps(params) {
    var urlParams = new URLSearchParams();
    urlParams.append('pageNum', params.pageNum);
    urlParams.append('pageSize', params.pageSize);
    if (params.name) urlParams.append('name', params.name);
    if (params.gender) urlParams.append('gender', params.gender);
    if (params.begin) urlParams.append('begin', params.begin);
    if (params.end) urlParams.append('end', params.end);

    return fetch(BASE_URL + '/emps?' + urlParams.toString())
        .then(function(response) {
            if (!response.ok) throw new Error('网络请求失败: ' + response.status);
            return response.json();
        });
}

/**
 * 根据 ID 获取员工详情
 */
function apiGetEmpById(id) {
    return fetch(BASE_URL + '/emps/' + id)
        .then(function(response) { return response.json(); });
}

/**
 * 新增员工
 */
function apiAddEmp(empData) {
    return fetch(BASE_URL + '/emps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData)
    }).then(function(response) { return response.json(); });
}

/**
 * 修改员工
 */
function apiUpdateEmp(empData) {
    return fetch(BASE_URL + '/emps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData)
    }).then(function(response) { return response.json(); });
}

/**
 * 删除员工
 */
function apiDeleteEmp(id) {
    return fetch(BASE_URL + '/emps/' + id, { method: 'DELETE' })
        .then(function(response) { return response.json(); });
}

/**
 * 批量删除员工
 */
function apiBatchDeleteEmps(ids) {
    var params = new URLSearchParams();
    ids.forEach(function(id) { params.append('ids', id); });
    return fetch(BASE_URL + '/emps/batch?' + params.toString(), { method: 'DELETE' })
        .then(function(response) { return response.json(); });
}

/**
 * 上传头像图片
 * @param {File} file - 要上传的图片文件
 * @returns {Promise} 返回包含图片URL的结果
 */
function apiUploadImage(file) {
    var formData = new FormData();
    formData.append('image', file);
    return fetch(BASE_URL + '/upload', {
        method: 'POST',
        body: formData
    }).then(function(response) { return response.json(); });
}
