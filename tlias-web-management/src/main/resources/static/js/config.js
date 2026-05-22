// ===== 基础配置 =====
// 使用空字符串表示同源请求（API 请求与页面来自同一台服务器）
// 本地开发可改为 'http://localhost:8080'
var BASE_URL = '';

// 职位映射
var JOB_MAP = {
    1: '班主任',
    2: '讲师',
    3: '学工主管',
    4: '教研主管',
    5: '咨询师'
};

// ===== Token 管理 =====

/**
 * 保存 JWT Token 到 localStorage
 */
function saveToken(token) {
    localStorage.setItem('tlias_token', token);
}

/**
 * 从 localStorage 获取 JWT Token
 */
function getToken() {
    return localStorage.getItem('tlias_token');
}

/**
 * 移除 JWT Token（退出登录）
 */
function removeToken() {
    localStorage.removeItem('tlias_token');
}

/**
 * 保存用户信息到 localStorage
 */
function saveUserInfo(user) {
    localStorage.setItem('tlias_user', JSON.stringify(user));
}

/**
 * 从 localStorage 获取用户信息
 */
function getUserInfo() {
    var str = localStorage.getItem('tlias_user');
    if (!str) return null;
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}

/**
 * 清除所有登录信息
 */
function clearLoginInfo() {
    removeToken();
    localStorage.removeItem('tlias_user');
}

/**
 * 检查是否已登录（token 是否存在）
 */
function isLoggedIn() {
    return !!getToken();
}

/**
 * 带 Token 的 fetch 请求封装
 * 自动在请求头中添加 token
 * 当收到 401 状态码时自动清除登录信息并跳转到登录页
 */
function authFetch(url, options) {
    options = options || {};
    options.headers = options.headers || {};

    // 自动添加 token
    var token = getToken();
    if (token) {
        options.headers['token'] = token;
    }

    return fetch(url, options)
        .then(function(response) {
            // 如果返回 401 未授权，说明 token 无效或过期
            if (response.status === 401) {
                clearLoginInfo();
                window.location.href = 'login.html';
                throw new Error('登录已过期，请重新登录');
            }
            return response;
        });
}