// ===== 班级 API =====

/**
 * 分页条件查询班级列表
 */
function apiGetClazzList(params) {
    var urlParams = new URLSearchParams();
    urlParams.append('pageNum', params.pageNum);
    urlParams.append('pageSize', params.pageSize);
    if (params.name) urlParams.append('name', params.name);

    return fetch(BASE_URL + '/clazz?' + urlParams.toString())
        .then(function(response) {
            if (!response.ok) throw new Error('网络请求失败: ' + response.status);
            return response.json();
        });
}

/**
 * 根据 ID 获取班级详情
 */
function apiGetClazzById(id) {
    return fetch(BASE_URL + '/clazz/' + id)
        .then(function(response) { return response.json(); });
}

/**
 * 新增班级
 */
function apiAddClazz(data) {
    return fetch(BASE_URL + '/clazz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(function(response) { return response.json(); });
}

/**
 * 修改班级
 */
function apiUpdateClazz(data) {
    return fetch(BASE_URL + '/clazz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(function(response) { return response.json(); });
}

/**
 * 删除班级
 */
function apiDeleteClazz(id) {
    return fetch(BASE_URL + '/clazz/' + id, { method: 'DELETE' })
        .then(function(response) { return response.json(); });
}

/**
 * 查询所有班主任
 */
function apiListMasters() {
    return fetch(BASE_URL + '/clazz/masters')
        .then(function(response) { return response.json(); });
}
