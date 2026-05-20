/**
 * 分页结果封装类
 * 用于统一分页查询的返回格式：总记录数（total）和当前页数据（data）
 */
package com.lcx.tlias_web_management.pojo;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageResult<T> {
    private long total;  // 总记录数
    private List<T> data;        // 当前页数据
}
