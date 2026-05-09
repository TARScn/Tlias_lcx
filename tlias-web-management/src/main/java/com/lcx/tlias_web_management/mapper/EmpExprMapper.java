package com.lcx.tlias_web_management.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.lcx.tlias_web_management.pojo.EmpExpr;

@Mapper
public interface EmpExprMapper {
    /**
     * 批量插入员工工作经历
     */
    void insertBatch(List<EmpExpr> exprList);
}
