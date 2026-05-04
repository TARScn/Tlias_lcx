package com.lcx.tlias_web_management.service;
import java.util.List;

import com.lcx.tlias_web_management.pojo.Dept;
public interface DeptService {
    /*
    * 查询全部部门数据
    */
    List<Dept> findAll();

    /**
     * 根据id删除部门数据
     */
    void deleteById(Integer id);
}
