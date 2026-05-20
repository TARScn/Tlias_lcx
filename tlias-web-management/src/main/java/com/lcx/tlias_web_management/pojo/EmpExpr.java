/**
 * 员工工作经历实体类
 * 映射工作经历表字段：ID、员工ID、起止时间、公司、职位
 */
package com.lcx.tlias_web_management.pojo;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmpExpr {
    private Integer id;         // ID
    private Integer empId;      // 员工ID
    private LocalDate begin;    // 开始时间
    private LocalDate end;      // 结束时间
    private String company;     // 公司名称
    private String job;         // 职位
}