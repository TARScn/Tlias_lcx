package com.lcx.tlias_web_management.service;

import com.lcx.tlias_web_management.pojo.Clazz;
import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.PageResult;

import java.util.List;

public interface ClazzService {

    /**
     * 分页条件查询班级列表
     */
    PageResult<Clazz> page(Integer pageNum, Integer pageSize, String name);

    /**
     * 根据ID查询班级详情
     */
    Clazz getById(Integer id);

    /**
     * 新增班级
     */
    void add(Clazz clazz);

    /**
     * 更新班级
     */
    void update(Clazz clazz);

    /**
     * 根据ID删除班级（如果班级下有学生则不允许删除）
     */
    void deleteById(Integer id);

    /**
     * 查询所有班主任（员工表中职位为班主任的员工）
     */
    List<Emp> listMasters();
}
