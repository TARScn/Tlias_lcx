package com.lcx.tlias_web_management.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.lcx.tlias_web_management.pojo.Dept;

@Mapper
public interface DeptMapper {
    /**
     * 查询全部部门数据
     * @return List<Dept>
     */
    @Select("select id,name,create_time,update_time from dept order by update_time desc;")
    List<Dept> findAll();

    /**
     * 根据id删除部门数据
     */
    @Delete("delete from dept where id=#{id};")
    void deleteById(Integer id);
}
