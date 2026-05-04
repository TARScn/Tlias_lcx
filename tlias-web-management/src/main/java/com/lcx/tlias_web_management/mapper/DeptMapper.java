package com.lcx.tlias_web_management.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.lcx.tlias_web_management.pojo.Dept;
import java.util.*;

@Mapper
public interface DeptMapper {
    /*
     * 查询全部部门数据
     */
    @Select("select * from dept order by update_time desc;")
    List<Dept> findAll();
}
