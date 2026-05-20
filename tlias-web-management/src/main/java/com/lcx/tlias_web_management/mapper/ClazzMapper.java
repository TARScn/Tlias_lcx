/**
 * 班级数据访问接口
 * 提供班级表 CRUD、分页查询、学生数量统计、班主任列表查询等数据库操作
 */
package com.lcx.tlias_web_management.mapper;

import com.lcx.tlias_web_management.pojo.Clazz;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ClazzMapper {

    /**
     * 分页条件查询班级列表（关联查询班主任姓名）
     */
    List<Clazz> page(@Param("name") String name);

    /**
     * 根据ID查询班级详情
     */
    Clazz getById(Integer id);

    /**
     * 新增班级
     */
    void insert(Clazz clazz);

    /**
     * 更新班级
     */
    void update(Clazz clazz);

    /**
     * 根据ID删除班级
     */
    void deleteById(Integer id);

    /**
     * 统计某个班级下的学生数量
     */
    Integer countStudentByClazzId(Integer clazzId);

    /**
     * 查询所有班主任（员工表中职位为班主任的员工）
     */
    List<com.lcx.tlias_web_management.pojo.Emp> listMasters();
}
