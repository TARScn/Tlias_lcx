package com.lcx.tlias_web_management.pojo;

import java.time.LocalDate;

import lombok.Data;

@Data
public class EmpExpr {
    private Integer id;         // ID
    private Integer empId;      // 员工ID
    private LocalDate begin;    // 开始时间
    private LocalDate end;      // 结束时间
    private String company;     // 公司名称
    private String job;         // 职位
}