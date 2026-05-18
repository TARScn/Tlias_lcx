// ===== 部门 API =====

/**
 * 获取所有部门
 */
function apiGetDepts() {
    return authFetch(BASE_URL + '/depts')
        .then(function(response) {
            if (!response.ok) throw new Error('网络请求失败: ' + response.status);
            return response.json();
        });
}

/**
 * 根据 ID 获取部门
 */
function apiGetDeptById(id) {
    return authFetch(BASE_URL + '/depts/' + id)
        .then(function(response) { return response.json(); });
}

/**
 * 新增部门
 */
function apiAddDept(name) {
    return authFetch(BASE_URL + '/depts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name })
    }).then(function(response) { return response.json(); });
}

/**
 * 修改部门
 */
function apiUpdateDept(id, name) {
    return authFetch(BASE_URL + '/depts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, name: name })
    }).then(function(response) { return response.json(); });
}

/**
 * 删除部门
 */
function apiDeleteDept(id) {
    return authFetch(BASE_URL + '/depts?id=' + id, { method: 'DELETE' })
        .then(function(response) { return response.json(); });
}
