// ===== 应用入口与导航 =====

/**
 * 视图切换
 */
function switchView(view, el) {
    // 隐藏所有视图
    var panels = document.querySelectorAll('.view-panel');
    panels.forEach(function(p) { p.classList.remove('active'); });

    // 显示目标视图
    var viewName = 'view' + view.charAt(0).toUpperCase() + view.slice(1);
    var panel = document.getElementById(viewName);
    if (panel) panel.classList.add('active');

    // 更新侧边栏激活状态
    if (el) {
        var subLinks = document.querySelectorAll('.submenu li a');
        subLinks.forEach(function(a) { a.classList.remove('active'); });
        el.classList.add('active');

        // 确保父级菜单展开且激活
        var submenu = el.closest('ul.submenu');
        if (submenu) {
            var parentNav = submenu.previousElementSibling;
            if (parentNav && parentNav.classList.contains('has-submenu')) {
                parentNav.classList.add('active');
                submenu.style.display = 'block';
                var arrow = parentNav.querySelector('.arrow');
                if (arrow) { arrow.textContent = '▼'; arrow.classList.add('open'); }
            }
        }
    }

    // 加载对应数据
    if (view === 'dept') {
        fetchDepts();
    } else if (view === 'emp') {
        fetchEmps();
    }
}

/**
 * 导航栏折叠展开
 */
function toggleSubmenu(element) {
    var submenu = element.nextElementSibling;
    var arrow = element.querySelector('.arrow');

    if (submenu.style.display === 'block') {
        submenu.style.display = 'none';
        arrow.textContent = '▶';
        arrow.classList.remove('open');
    } else {
        submenu.style.display = 'block';
        arrow.textContent = '▼';
        arrow.classList.add('open');
    }
}

/**
 * 退出登录
 */
function logout() {
    if (confirm('确定要退出登录吗？')) {
        alert('已退出登录');
    }
}

// ===== 弹窗外部点击关闭 =====
window.onclick = function(event) {
    if (event.target === document.getElementById('deptModal')) closeDeptModal();
    if (event.target === document.getElementById('deptDeleteModal')) closeDeptDeleteModal();
    if (event.target === document.getElementById('empModal')) closeEmpModal();
    if (event.target === document.getElementById('empDeleteModal')) closeEmpDeleteModal();
};

// ===== 页面加载：默认显示部门管理 =====
document.addEventListener('DOMContentLoaded', function() {
    fetchDepts();
});
