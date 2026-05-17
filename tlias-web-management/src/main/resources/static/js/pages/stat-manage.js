// ===== 统计页面 =====

var jobChart = null;
var genderChart = null;
var studentClazzChart = null;
var studentDegreeChart = null;

/**
 * 加载员工统计数据
 */
function loadEmpStats() {
    loadStats('emp');
}

/**
 * 加载学员统计数据
 */
function loadStudentStats() {
    loadStats('student');
}

function loadStats(type) {
    var statType = type === 'student' ? 'student' : 'emp';
    updateStatView(statType);

    if (!window.echarts) {
        showStatLoadError(statType, 'ECharts 未加载');
        return;
    }

    if (statType === 'student') {
        loadStudentClazzBarChart();
        loadStudentDegreePieChart();
    } else {
        loadJobBarChart();
        loadGenderPieChart();
    }

    setTimeout(resizeAllCharts, 0);
}

function updateStatView(type) {
    var title = document.getElementById('statPageTitle');
    var empSection = document.getElementById('empStatSection');
    var studentSection = document.getElementById('studentStatSection');

    if (title) {
        title.textContent = type === 'student' ? '学员信息统计' : '员工信息统计';
    }
    if (empSection) {
        empSection.style.display = type === 'student' ? 'none' : 'flex';
    }
    if (studentSection) {
        studentSection.style.display = type === 'student' ? 'flex' : 'none';
    }
}

function showStatLoadError(type, message) {
    if (type === 'student') {
        showChartError('studentBarChartContainer', message);
        showChartError('studentPieChartContainer', message);
    } else {
        showChartError('barChartContainer', message);
        showChartError('pieChartContainer', message);
    }
}

// ==================== 通用 ECharts 配置 ====================

function getBarOption(names, values, colorStart, colorEnd) {
    return {
        color: [colorEnd],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function(params) {
                var item = params && params[0] ? params[0] : null;
                return item ? item.name + '<br/>人数：' + item.value + ' 人' : '';
            }
        },
        grid: {
            left: 42,
            right: 28,
            top: 36,
            bottom: 48,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: names,
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: '#d9d9d9' } },
            axisLabel: {
                color: '#606266',
                interval: 0,
                rotate: names.length > 6 ? 25 : 0
            }
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            name: '人数',
            nameTextStyle: { color: '#606266' },
            axisLabel: { color: '#606266' },
            splitLine: { lineStyle: { color: '#eef0f4' } }
        },
        series: [{
            name: '人数',
            type: 'bar',
            data: values,
            barMaxWidth: 52,
            itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: colorStart },
                    { offset: 1, color: colorEnd }
                ])
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}人',
                color: '#333',
                fontWeight: 600
            }
        }],
        graphic: values.length === 0 ? getEmptyGraphic() : []
    };
}

function getPieOption(name, data, colors) {
    return {
        color: colors,
        tooltip: {
            trigger: 'item',
            formatter: '{b}<br/>人数：{c} 人<br/>占比：{d}%'
        },
        legend: {
            orient: 'vertical',
            right: 24,
            top: 'center',
            icon: 'circle',
            itemWidth: 10,
            itemHeight: 10,
            textStyle: {
                color: '#606266',
                fontSize: 14
            }
        },
        series: [{
            name: name,
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: true,
            label: {
                formatter: '{b}: {c}人',
                color: '#333'
            },
            labelLine: {
                length: 14,
                length2: 8
            },
            emphasis: {
                scale: true,
                scaleSize: 6,
                itemStyle: {
                    shadowBlur: 12,
                    shadowColor: 'rgba(0, 0, 0, 0.18)'
                }
            },
            data: data
        }],
        graphic: data.length === 0 ? getEmptyGraphic() : []
    };
}

function getEmptyGraphic() {
    return [{
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
            text: '暂无数据',
            fill: '#999',
            fontSize: 14
        }
    }];
}

function normalizeNumberList(list) {
    return (list || []).map(function(item) {
        return Number(item) || 0;
    });
}

function normalizePieData(data, nameField) {
    return (data || []).map(function(item) {
        return {
            name: item[nameField] || '未知',
            value: Number(item.count) || 0
        };
    }).filter(function(item) {
        return item.value > 0;
    });
}

function initOrReuseChart(instance, container) {
    container.innerHTML = '';
    return instance || echarts.init(container);
}

// ==================== 员工统计 ====================

function loadJobBarChart() {
    apiCountEmpJob().then(function(res) {
        if (res.code === 1) {
            renderJobBarChart(res.data || {});
        } else {
            showChartError('barChartContainer', res.message || res.msg || '获取职位统计数据失败');
        }
    }).catch(function(err) {
        console.error('请求职位统计数据异常:', err);
        showChartError('barChartContainer', '请求职位统计数据异常');
    });
}

function renderJobBarChart(data) {
    var container = document.getElementById('barChartContainer');
    if (!container) return;

    jobChart = initOrReuseChart(jobChart, container);
    jobChart.setOption(getBarOption(
        data.jobList || [],
        normalizeNumberList(data.dataList),
        '#40a9ff',
        '#1890ff'
    ), true);
}

function loadGenderPieChart() {
    apiCountEmpGender().then(function(res) {
        if (res.code === 1) {
            renderGenderPieChart(res.data || []);
        } else {
            showChartError('pieChartContainer', res.message || res.msg || '获取性别统计数据失败');
        }
    }).catch(function(err) {
        console.error('请求性别统计数据异常:', err);
        showChartError('pieChartContainer', '请求性别统计数据异常');
    });
}

function renderGenderPieChart(data) {
    var container = document.getElementById('pieChartContainer');
    if (!container) return;

    genderChart = initOrReuseChart(genderChart, container);
    genderChart.setOption(getPieOption(
        '员工性别统计',
        normalizePieData(data, 'gender'),
        ['#1890ff', '#ff7875', '#52c41a', '#faad14', '#8c8c8c']
    ), true);
}

// ==================== 学员统计 ====================

function loadStudentClazzBarChart() {
    apiCountStudentByClazz().then(function(res) {
        if (res.code === 1) {
            renderStudentClazzBarChart(res.data || {});
        } else {
            showChartError('studentBarChartContainer', res.message || res.msg || '获取班级人数统计数据失败');
        }
    }).catch(function(err) {
        console.error('请求班级人数统计异常:', err);
        showChartError('studentBarChartContainer', '请求班级人数统计数据异常');
    });
}

function renderStudentClazzBarChart(data) {
    var container = document.getElementById('studentBarChartContainer');
    if (!container) return;

    studentClazzChart = initOrReuseChart(studentClazzChart, container);
    studentClazzChart.setOption(getBarOption(
        data.jobList || [],
        normalizeNumberList(data.dataList),
        '#73d13d',
        '#52c41a'
    ), true);
}

function loadStudentDegreePieChart() {
    apiCountStudentByDegree().then(function(res) {
        if (res.code === 1) {
            renderStudentDegreePieChart(res.data || []);
        } else {
            showChartError('studentPieChartContainer', res.message || res.msg || '获取学历统计数据失败');
        }
    }).catch(function(err) {
        console.error('请求学历统计异常:', err);
        showChartError('studentPieChartContainer', '请求学历统计数据异常');
    });
}

function renderStudentDegreePieChart(data) {
    var container = document.getElementById('studentPieChartContainer');
    if (!container) return;

    studentDegreeChart = initOrReuseChart(studentDegreeChart, container);
    studentDegreeChart.setOption(getPieOption(
        '学员学历统计',
        normalizePieData(data, 'degree'),
        ['#1890ff', '#52c41a', '#faad14', '#ff7875', '#722ed1', '#13c2c2']
    ), true);
}

function resizeAllCharts() {
    if (jobChart) jobChart.resize();
    if (genderChart) genderChart.resize();
    if (studentClazzChart) studentClazzChart.resize();
    if (studentDegreeChart) studentDegreeChart.resize();
}

function showChartError(containerId, message) {
    disposeChart(containerId);

    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="chart-empty">' + escapeHtml(message || '暂无数据') + '</div>';
}

function disposeChart(containerId) {
    if (containerId === 'barChartContainer' && jobChart) {
        jobChart.dispose();
        jobChart = null;
    } else if (containerId === 'pieChartContainer' && genderChart) {
        genderChart.dispose();
        genderChart = null;
    } else if (containerId === 'studentBarChartContainer' && studentClazzChart) {
        studentClazzChart.dispose();
        studentClazzChart = null;
    } else if (containerId === 'studentPieChartContainer' && studentDegreeChart) {
        studentDegreeChart.dispose();
        studentDegreeChart = null;
    }
}

window.addEventListener('resize', resizeAllCharts);
