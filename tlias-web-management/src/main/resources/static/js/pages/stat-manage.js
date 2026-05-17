// ===== 员工信息统计页面 =====

var jobChart = null;
var genderChart = null;

/**
 * 加载员工统计数据
 */
function loadEmpStats() {
    if (!window.echarts) {
        console.error('ECharts 未加载，无法渲染统计图表');
        showChartError('barChartContainer', 'ECharts 未加载');
        showChartError('pieChartContainer', 'ECharts 未加载');
        return;
    }

    loadJobBarChart();
    loadGenderPieChart();

    setTimeout(resizeEmpCharts, 0);
}

// ==================== 职位人数柱状图（ECharts） ====================

function loadJobBarChart() {
    apiCountEmpJob().then(function(res) {
        if (res.code === 1) {
            renderJobBarChart(res.data || {});
        } else {
            console.error('获取职位统计数据失败:', res.msg);
            showChartError('barChartContainer', res.msg || '获取职位统计数据失败');
        }
    }).catch(function(err) {
        console.error('请求职位统计数据异常:', err);
        showChartError('barChartContainer', '请求职位统计数据异常');
    });
}

/**
 * 渲染职位人数柱状图
 * @param {Object} data - { jobList: [...], dataList: [...] }
 */
function renderJobBarChart(data) {
    var container = document.getElementById('barChartContainer');
    if (!container) return;

    container.innerHTML = '';
    var jobList = data.jobList || [];
    var dataList = (data.dataList || []).map(function(item) {
        return Number(item) || 0;
    });

    if (!jobChart) {
        jobChart = echarts.init(container);
    }

    jobChart.setOption({
        color: ['#1890ff'],
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
            data: jobList,
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: '#d9d9d9' } },
            axisLabel: {
                color: '#606266',
                interval: 0
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
            data: dataList,
            barMaxWidth: 52,
            itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#40a9ff' },
                    { offset: 1, color: '#1890ff' }
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
        graphic: dataList.length === 0 ? [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
                text: '暂无数据',
                fill: '#999',
                fontSize: 14
            }
        }] : []
    });
}

// ==================== 员工性别统计饼状图（ECharts） ====================

function loadGenderPieChart() {
    apiCountEmpGender().then(function(res) {
        if (res.code === 1) {
            renderGenderPieChart(res.data || []);
        } else {
            console.error('获取性别统计数据失败:', res.msg);
            showChartError('pieChartContainer', res.msg || '获取性别统计数据失败');
        }
    }).catch(function(err) {
        console.error('请求性别统计数据异常:', err);
        showChartError('pieChartContainer', '请求性别统计数据异常');
    });
}

/**
 * 渲染员工性别统计饼状图
 * @param {Array} data - [{gender: '男', count: 11}, {gender: '女', count: 10}]
 */
function renderGenderPieChart(data) {
    var container = document.getElementById('pieChartContainer');
    if (!container) return;

    container.innerHTML = '';
    var pieData = (data || []).map(function(item) {
        return {
            name: item.gender || '未知',
            value: Number(item.count) || 0
        };
    });

    if (!genderChart) {
        genderChart = echarts.init(container);
    }

    genderChart.setOption({
        color: ['#1890ff', '#ff7875', '#52c41a', '#faad14', '#8c8c8c'],
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
            name: '性别统计',
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
            data: pieData
        }],
        graphic: pieData.length === 0 ? [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
                text: '暂无数据',
                fill: '#999',
                fontSize: 14
            }
        }] : []
    });
}

function resizeEmpCharts() {
    if (jobChart) jobChart.resize();
    if (genderChart) genderChart.resize();
}

function showChartError(containerId, message) {
    if (containerId === 'barChartContainer' && jobChart) {
        jobChart.dispose();
        jobChart = null;
    }
    if (containerId === 'pieChartContainer' && genderChart) {
        genderChart.dispose();
        genderChart = null;
    }

    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="chart-empty">' + escapeHtml(message || '暂无数据') + '</div>';
}

window.addEventListener('resize', resizeEmpCharts);
