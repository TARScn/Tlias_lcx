package com.lcx.tlias_web_management.service;

import com.lcx.tlias_web_management.pojo.Clazz;
import com.lcx.tlias_web_management.pojo.JobOption;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.pojo.Student;

import java.util.List;
import java.util.Map;

public interface StudentService {

    /**
     * 分页条件查询学员列表
     */
    PageResult<Student> page(Integer pageNum, Integer pageSize,
                             String name, Integer degree, Integer clazzId);

    /**
     * 根据ID查询学员详情
     */
    Student getById(Integer id);

    /**
     * 新增学员
     */
    void add(Student student);

    /**
     * 更新学员
     */
    void update(Student student);

    /**
     * 根据ID删除学员
     */
    void deleteById(Integer id);

    /**
     * 批量删除学员
     */
    void deleteByIds(List<Integer> ids);

    /**
     * 更新学员违纪扣分
     */
    void updateViolation(Integer id, Short score);

    /**
     * 查询所有班级列表
     */
    List<Clazz> listAllClazz();

    /**
     * 统计每个班级的学员人数
     * @return JobOption 包含班级名称列表和人数列表
     */
    JobOption countStudentByClazz();

    /**
     * 统计学员学历分布
     * @return List of {degree, count}
     */
    List<Map<String, Object>> countStudentByDegree();
}
