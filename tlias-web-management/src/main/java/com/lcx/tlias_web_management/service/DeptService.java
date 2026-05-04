package com.lcx.tlias_web_management.service;
import java.util.*;
import com.lcx.tlias_web_management.pojo.Dept;
public interface DeptService {
    /*
    * 查询全部部门数据
    */
    List<Dept> findAll();
}
