package com.lcx.tlias_web_management.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.lcx.tlias_web_management.exception.BusinessException;
import com.lcx.tlias_web_management.mapper.ClazzMapper;
import com.lcx.tlias_web_management.pojo.Clazz;
import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.service.ClazzService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClazzServiceImpl implements ClazzService {

    @Autowired
    private ClazzMapper clazzMapper;

    @Override
    public PageResult<Clazz> page(Integer pageNum, Integer pageSize, String name) {
        PageHelper.startPage(pageNum, pageSize);
        List<Clazz> list = clazzMapper.page(name);
        try (Page<Clazz> page = (Page<Clazz>) list) {
            // 为每个班级计算状态
            for (Clazz clazz : page.getResult()) {
                clazz.setStatus(calcStatus(clazz));
            }
            return new PageResult<>(page.getTotal(), page.getResult());
        }
    }

    @Override
    public Clazz getById(Integer id) {
        Clazz clazz = clazzMapper.getById(id);
        if (clazz != null) {
            clazz.setStatus(calcStatus(clazz));
        }
        return clazz;
    }

    @Override
    public void add(Clazz clazz) {
        // 补全时间
        clazz.setCreateTime(LocalDateTime.now());
        clazz.setUpdateTime(LocalDateTime.now());
        clazzMapper.insert(clazz);
    }

    @Override
    public void update(Clazz clazz) {
        // 补全修改时间
        clazz.setUpdateTime(LocalDateTime.now());
        clazzMapper.update(clazz);
    }

    @Override
    @Transactional
    public void deleteById(Integer id) {
        // 检查班级下是否有学生
        Integer studentCount = clazzMapper.countStudentByClazzId(id);
        if (studentCount != null && studentCount > 0) {
            throw new BusinessException("对不起, 该班级下有学生, 不能直接删除");
        }
        clazzMapper.deleteById(id);
    }

    @Override
    public List<Emp> listMasters() {
        return clazzMapper.listMasters();
    }

    /**
     * 计算班级状态
     * 根据当前时间和结课时间判断：
     * - 当前时间 < 开课时间：未开班
     * - 当前时间 > 结课时间：已结课
     * - 其他：在读中
     */
    private String calcStatus(Clazz clazz) {
        java.time.LocalDate now = java.time.LocalDate.now();
        if (clazz.getBeginDate() != null && now.isBefore(clazz.getBeginDate())) {
            return "未开班";
        }
        if (clazz.getEndDate() != null && now.isAfter(clazz.getEndDate())) {
            return "已结课";
        }
        return "在读中";
    }
}
