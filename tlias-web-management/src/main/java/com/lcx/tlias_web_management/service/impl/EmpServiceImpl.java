package com.lcx.tlias_web_management.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.lcx.tlias_web_management.mapper.EmpExprMapper;
import com.lcx.tlias_web_management.mapper.EmpMapper;
import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.EmpExpr;
import com.lcx.tlias_web_management.pojo.JobOption;
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
        // 添加员工工作经历查询
        Emp emp = empMapper.getById(id);
        if (emp != null) {
            List<EmpExpr> exprList = empExprMapper.listByEmpId(id);
            emp.setEmpExprList(exprList);
        }
        return emp;
    }

    @Override
    @Transactional // 声明式事务管理:新增员工和工作经历需要放在同一个事务中
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
    @Transactional // 更新员工和工作经历需要放在同一个事务中
    public void update(Emp emp) {
        emp.setUpdateTime(LocalDateTime.now());
        // 工作经历更新：先删除原有的，再插入新的（前端传 null 则不更新）
        List<EmpExpr> exprList = emp.getEmpExprList();
        if (exprList != null) {
            empExprMapper.deleteByEmpId(emp.getId());
            if (!exprList.isEmpty()) {
                exprList.forEach(e -> e.setEmpId(emp.getId()));
                empExprMapper.insertBatch(exprList);
            }
        }
        empMapper.update(emp);
    }

    @Override
    @Transactional // 删除员工和工作经历需要放在同一个事务中
    public void deleteById(Integer id) {
        // 先删除工作经历（外键关联），再删除员工
        empExprMapper.deleteByEmpId(id);
        empMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByIds(List<Integer> ids) {
        // 先批量删除工作经历（外键关联），再批量删除员工
        empExprMapper.deleteBatch(ids);
        empMapper.deleteByIds(ids);
    }

    @Override
    public JobOption countEmpJob() {
        List<Map<String, Object>> list = empMapper.countEmpJob();
        List<Object> jobList = new ArrayList<>();
        List<Object> dataList = new ArrayList<>();
        for (Map<String, Object> map : list) {
            jobList.add(map.get("pos"));
            dataList.add(map.get("count"));
        }
        return new JobOption(jobList, dataList);
    }

    @Override
    public List<Map<String, Object>> countEmpGender() {
        return empMapper.countEmpGender();
    }
}
