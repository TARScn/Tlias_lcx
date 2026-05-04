package com.lcx.tlias_web_management.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.lcx.tlias_web_management.mapper.DeptMapper;
import com.lcx.tlias_web_management.pojo.Dept;
import com.lcx.tlias_web_management.service.DeptService;

@Service
public class DeptServiceImpl implements DeptService{
    @Autowired
    private DeptMapper deptMapper;

    @Override
    public List<Dept> findAll() {
        return deptMapper.findAll();
    }

    @Override
    public void deleteById(Integer id) {
        deptMapper.deleteById(id);
    }
}
