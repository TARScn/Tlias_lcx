package com.lcx.tlias_web_management.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.lcx.tlias_web_management.mapper.EmpMapper;
import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.service.EmpService;

@Service
public class EmpServiceImpl implements EmpService{
    @Autowired
    private EmpMapper empMapper;

    @Override
    public PageResult<Emp> page(Integer pageNum, Integer pageSize) {
        // 设置分页参数
        PageHelper.startPage(pageNum, pageSize);
        // 查询数据
        // 解析查询结果
        try(Page<Emp> page = (Page<Emp>) empMapper.list()){
            return new PageResult<>(page.getTotal(), page.getResult());
        }
    }
}
