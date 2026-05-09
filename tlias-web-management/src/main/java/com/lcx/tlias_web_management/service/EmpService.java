package com.lcx.tlias_web_management.service;

import java.time.LocalDate;
import java.util.List;

import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.PageResult;

public interface EmpService {
    /**
     * 分页条件查询员工数据
     */
    PageResult<Emp> page(Integer pageNum, Integer pageSize,
                         String name, Integer gender,
                         LocalDate begin, LocalDate end);

    /**
     * 根据ID查询员工
     */
    Emp getById(Integer id);

    /**
     * 新增员工
     */
    void add(Emp emp);

    /**
     * 更新员工
     */
    void update(Emp emp);

    /**
     * 根据ID删除员工
     */
    void deleteById(Integer id);

    /**
     * 批量删除员工
     */
    void deleteByIds(List<Integer> ids);
}
