package com.lcx.tlias_web_management.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.lcx.tlias_web_management.mapper.EmpExprMapper;
import com.lcx.tlias_web_management.mapper.EmpMapper;
import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.EmpExpr;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.service.EmpService;

@Service
public class EmpServiceImpl implements EmpService {
    @Autowired
    private EmpMapper empMapper;

    @Autowired
    private EmpExprMapper empExprMapper;

    @Override
    public PageResult<Emp> page(Integer pageNum, Integer pageSize,
                                String name, Integer gender,
                                LocalDate begin, LocalDate end) {
        PageHelper.startPage(pageNum, pageSize);
        List<Emp> list = empMapper.list(name, gender, begin, end);
        try (Page<Emp> page = (Page<Emp>) list) {
            return new PageResult<>(page.getTotal(), page.getResult());
        }
    }

    @Override
    public Emp getById(Integer id) {
        return empMapper.getById(id);
    }

    @Override
    @Transactional
    public void add(Emp emp) {
        // 补齐默认值
        if (emp.getUsername() == null || emp.getUsername().isEmpty()) {
            emp.setUsername(emp.getPhone() != null ? emp.getPhone() : "user" + System.currentTimeMillis());
        }
        if (emp.getPassword() == null || emp.getPassword().isEmpty()) {
            emp.setPassword("123456");
        }
        emp.setCreateTime(LocalDateTime.now());
        emp.setUpdateTime(LocalDateTime.now());
        empMapper.insert(emp);

        // 插入工作经历（前端传 null 则不插入）
        List<EmpExpr> exprList = emp.getEmpExprList();
        if (exprList != null && !exprList.isEmpty()) {
            exprList.forEach(e -> e.setEmpId(emp.getId())); // 在xml中配置了 useGeneratedKeys，所以 emp.getId() 已经有值了
            empExprMapper.insertBatch(exprList);
        }
    }

    @Override
    public void update(Emp emp) {
        emp.setUpdateTime(LocalDateTime.now());
        empMapper.update(emp);
    }

    @Override
    public void deleteById(Integer id) {
        empMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByIds(List<Integer> ids) {
        empMapper.deleteByIds(ids);
    }
}
