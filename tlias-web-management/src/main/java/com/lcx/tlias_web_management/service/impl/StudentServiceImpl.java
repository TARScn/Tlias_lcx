package com.lcx.tlias_web_management.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.lcx.tlias_web_management.mapper.StudentMapper;
import com.lcx.tlias_web_management.pojo.Clazz;
import com.lcx.tlias_web_management.pojo.JobOption;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.pojo.Student;
import com.lcx.tlias_web_management.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class StudentServiceImpl implements StudentService {

    @Autowired
    private StudentMapper studentMapper;

    @Override
    public PageResult<Student> page(Integer pageNum, Integer pageSize,
                                    String name, Integer degree, Integer clazzId) {
        PageHelper.startPage(pageNum, pageSize);
        List<Student> list = studentMapper.page(name, degree, clazzId);
        try (Page<Student> page = (Page<Student>) list) {
            return new PageResult<>(page.getTotal(), page.getResult());
        }
    }

    @Override
    public Student getById(Integer id) {
        return studentMapper.getById(id);
    }

    @Override
    public void add(Student student) {
        if (student.getViolationCount() == null) {
            student.setViolationCount((short) 0);
        }
        if (student.getViolationScore() == null) {
            student.setViolationScore((short) 0);
        }
        student.setCreateTime(LocalDateTime.now());
        student.setUpdateTime(LocalDateTime.now());
        studentMapper.insert(student);
    }

    @Override
    public void update(Student student) {
        student.setUpdateTime(LocalDateTime.now());
        studentMapper.update(student);
    }

    @Override
    @Transactional
    public void deleteById(Integer id) {
        studentMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByIds(List<Integer> ids) {
        studentMapper.deleteByIds(ids);
    }

    @Override
    @Transactional
    public void updateViolation(Integer id, Short score) {
        Student student = studentMapper.getById(id);
        if (student != null) {
            short currentCount = student.getViolationCount() == null ? 0 : student.getViolationCount();
            short currentScore = student.getViolationScore() == null ? 0 : student.getViolationScore();
            short addScore = score == null ? 0 : score;
            short newCount = (short) (currentCount + 1);
            short newScore = (short) (currentScore + addScore);
            studentMapper.updateViolation(id, newCount, newScore);
        }
    }

    @Override
    public List<Clazz> listAllClazz() {
        return studentMapper.listAllClazz();
    }

    @Override
    public JobOption countStudentByClazz() {
        List<Map<String, Object>> list = studentMapper.countStudentByClazz();
        List<Object> nameList = new ArrayList<>();
        List<Object> countList = new ArrayList<>();
        for (Map<String, Object> map : list) {
            nameList.add(map.get("name"));
            countList.add(map.get("count"));
        }
        return new JobOption(nameList, countList);
    }

    @Override
    public List<Map<String, Object>> countStudentByDegree() {
        return studentMapper.countStudentByDegree();
    }
}
