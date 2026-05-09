package com.lcx.tlias_web_management.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.lcx.tlias_web_management.pojo.Dept;

@Mapper
public interface DeptMapper {
    /**
     * 查询全部部门数据
     * @return List<Dept>
     */
    List<Dept> findAll();

    /**
     * 根据id删除部门数据
     */
    void deleteById(Integer id);

    /**
     * 添加部门数据
     */
    void add(Dept dept);

    /**
     * 根据id查询部门数据
     */
    Dept getInfoById(Integer id);

    /**
     * 根据id修改部门数据
     */
    void update(Dept dept);
}
