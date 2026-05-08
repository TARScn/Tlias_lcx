package com.lcx.tlias_web_management.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import com.lcx.tlias_web_management.pojo.Emp;

@Mapper
public interface EmpMapper {
    /**
     * 查询全部员工数据
     * @return List<Emp>
     */
    @Select("select e.*,d.name as dept_name from emp e left join dept d on e.dept_id=d.id order by e.update_time desc;")
    List<Emp> list();
}
