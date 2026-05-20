/**
 * 部门业务实现类
 * 实现部门 CRUD 业务逻辑，维护创建时间和修改时间
 */
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

    @Override
    public void add(Dept dept) {
        // 补全时间
        dept.setCreateTime(java.time.LocalDateTime.now());
        dept.setUpdateTime(java.time.LocalDateTime.now());
        deptMapper.add(dept);
    }

    @Override
    public Dept getInfoById(Integer id) {
        Dept dept = deptMapper.getInfoById(id);
        return dept;
    }

    @Override
    public void update(Dept dept) {
        // 补全时间
        dept.setUpdateTime(java.time.LocalDateTime.now());
        deptMapper.update(dept);
    }
}
