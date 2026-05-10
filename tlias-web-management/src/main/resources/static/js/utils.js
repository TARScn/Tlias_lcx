// ===== 工具函数 =====

/**
 * 格式化日期（支持数组格式 [y,m,d] 和字符串格式）
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    if (Array.isArray(dateStr)) {
        var y = dateStr[0], m = dateStr[1], d = dateStr[2];
        return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    }
    return dateStr;
}

/**
 * 格式化日期时间（支持数组格式 [y,m,d,h,min,s] 和 ISO 字符串）
 */
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '-';
    if (Array.isArray(dateTimeStr)) {
        var y = dateTimeStr[0], m = dateTimeStr[1], d = dateTimeStr[2],
            h = dateTimeStr[3] || 0, min = dateTimeStr[4] || 0, s = dateTimeStr[5] || 0;
        return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0')
            + ' ' + String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    try {
        var dt = new Date(dateTimeStr);
        if (isNaN(dt.getTime())) return dateTimeStr;
        var year = dt.getFullYear();
        var month = String(dt.getMonth() + 1).padStart(2, '0');
        var day = String(dt.getDate()).padStart(2, '0');
        var hours = String(dt.getHours()).padStart(2, '0');
        var minutes = String(dt.getMinutes()).padStart(2, '0');
        var seconds = String(dt.getSeconds()).padStart(2, '0');
        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
    } catch (e) {
        return dateTimeStr;
    }
}

/**
 * 获取性别文本
 */
function getGenderText(gender) {
    if (gender === 1) return '男';
    if (gender === 2) return '女';
    return '-';
}

/**
 * 获取职位文本
 */
function getJobText(job) {
    return JOB_MAP[job] || '-';
}

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
