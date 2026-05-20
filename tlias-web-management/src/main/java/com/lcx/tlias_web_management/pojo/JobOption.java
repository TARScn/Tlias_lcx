/**
 * 职位/班级统计选项封装类
 * 用于统计图表的 X 轴标签列表和数据列表
 */
package com.lcx.tlias_web_management.pojo;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobOption {
    private List<Object> jobList;
    private List<Object> dataList;
}
