package com.lcx.tlias_web_management.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
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

    /**
     * 添加部门数据
     */
    @Insert("insert into dept(name,create_time,update_time) values(#{name},#{createTime},#{updateTime});")
    void add(Dept dept);

    /**
     * 根据id查询部门数据
     */
    @Select("select id,name,create_time,update_time from dept where id=#{id};")
    Dept getInfoById(Integer id);

    /**
     * 根据id修改部门数据
     */
    @Insert("update dept set name=#{name},update_time=#{updateTime} where id=#{id};")
    void update(Dept dept);
}
