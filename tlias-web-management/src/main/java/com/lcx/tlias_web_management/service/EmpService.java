package com.lcx.tlias_web_management.service;

import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.PageResult;

public interface EmpService {
    /**
     * 分页查询员工数据
     * @param pageNum
     * @param pageSize
     * @return
     */
    PageResult<Emp> page(Integer pageNum, Integer pageSize);
}
