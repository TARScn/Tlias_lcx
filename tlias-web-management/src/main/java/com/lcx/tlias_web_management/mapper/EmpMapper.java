package com.lcx.tlias_web_management.mapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.lcx.tlias_web_management.pojo.Emp;

@Mapper
public interface EmpMapper {
    /**
     * 条件分页查询员工列表
     * @param name   姓名（模糊查询）
     * @param gender 性别
     * @param begin  入职开始日期
     * @param end    入职结束日期
     * @return List<Emp>
     */
    List<Emp> list(@Param("name") String name,
                   @Param("gender") Integer gender,
                   @Param("begin") LocalDate begin,
                   @Param("end") LocalDate end);

    /**
     * 根据ID查询员工
     */
    Emp getById(Integer id);

    /**
     * 新增员工
     */
    void insert(Emp emp);

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
    void deleteByIds(@Param("ids") List<Integer> ids);

    /**
     * 统计员工的职位人数
     * @return List of {pos, count}
     */
    List<Map<String, Object>> countEmpJob();

    /**
     * 统计员工的性别
     * @return List of {gender, count}
     */
    List<Map<String, Object>> countEmpGender();
}
