package com.lcx.tlias_web_management.mapper;

import com.lcx.tlias_web_management.pojo.Student;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StudentMapper {

    /**
     * 分页条件查询学员列表（关联查询班级名称）
     */
    List<Student> page(@Param("name") String name,
                       @Param("degree") Integer degree,
                       @Param("clazzId") Integer clazzId);

    /**
     * 根据ID查询学员详情
     */
    Student getById(Integer id);

    /**
     * 新增学员
     */
    void insert(Student student);

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
    void deleteByIds(@Param("ids") List<Integer> ids);

    /**
     * 更新学员违纪扣分
     */
    void updateViolation(@Param("id") Integer id,
                         @Param("violationCount") Short violationCount,
                         @Param("violationScore") Short violationScore);

    /**
     * 查询所有班级列表（供学员表单下拉使用）
     */
    List<com.lcx.tlias_web_management.pojo.Clazz> listAllClazz();

    /**
     * 统计每个班级的学员人数
     * @return List of {name, count}
     */
    List<Map<String, Object>> countStudentByClazz();

    /**
     * 统计学员学历分布
     * @return List of {degree, count}
     */
    List<Map<String, Object>> countStudentByDegree();
}
