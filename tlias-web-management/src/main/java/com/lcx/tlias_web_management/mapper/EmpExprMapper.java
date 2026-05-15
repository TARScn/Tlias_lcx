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

    /**
     * 批量删除员工工作经历
     */
    void deleteBatch(List<Integer> empIds);

    /**
     * 根据员工ID删除工作经历
     * @param empId
     * @return
     */
    void deleteByEmpId(Integer empId);
    
    /**
     * 根据员工ID查询工作经历
     */
    List<EmpExpr> listByEmpId(Integer empId);

    /**
     * 根据员工ID修改工作经历
     */
    void updateBatch(List<EmpExpr> exprList);

}
