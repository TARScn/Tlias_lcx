package com.lcx.tlias_web_management.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lcx.tlias_web_management.exception.BusinessException;
import com.lcx.tlias_web_management.pojo.Clazz;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.pojo.Result;
import com.lcx.tlias_web_management.pojo.Student;
import com.lcx.tlias_web_management.service.StudentService;
import com.lcx.tlias_web_management.aop.LogOperation;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequestMapping("/students")
@RestController
public class StudentController {

    @Autowired
    private StudentService studentService;

    /**
     * 分页条件查询学员列表
     */
    @GetMapping
    public Result page(@RequestParam(defaultValue = "1") Integer pageNum,
                       @RequestParam(defaultValue = "10") Integer pageSize,
                       @RequestParam(required = false) String name,
                       @RequestParam(required = false) Integer degree,
                       @RequestParam(required = false) Integer clazzId) {
        log.info("分页查询学员列表: pageNum={}, pageSize={}, name={}, degree={}, clazzId={}",
                pageNum, pageSize, name, degree, clazzId);
        PageResult<Student> pageResult = studentService.page(pageNum, pageSize, name, degree, clazzId);
        return Result.success(pageResult);
    }

    /**
     * 根据ID查询学员详情
     */
    @GetMapping("/{id}")
    public Result getById(@PathVariable Integer id) {
        log.info("根据ID查询学员: {}", id);
        Student student = studentService.getById(id);
        return Result.success(student);
    }

    /**
     * 新增学员
     */
    @LogOperation
    @PostMapping
    public Result add(@RequestBody Student student) {
        log.info("新增学员: {}", student);
        studentService.add(student);
        return Result.success();
    }

    /**
     * 修改学员
     */
    @LogOperation
    @PutMapping
    public Result update(@RequestBody Student student) {
        log.info("修改学员: {}", student);
        studentService.update(student);
        return Result.success();
    }

    /**
     * 根据ID删除学员
     */
    @LogOperation
    @DeleteMapping("/{id}")
    public Result deleteById(@PathVariable Integer id) {
        log.info("删除学员: {}", id);
        studentService.deleteById(id);
        return Result.success();
    }

    /**
     * 批量删除学员
     */
    @LogOperation
    @DeleteMapping("/batch")
    public Result deleteByIds(@RequestParam List<Integer> ids) {
        log.info("批量删除学员: {}", ids);
        studentService.deleteByIds(ids);
        return Result.success();
    }

    /**
     * 学员违纪扣分
     */
    @LogOperation
    @PutMapping("/violation")
    public Result updateViolation(@RequestBody Map<String, Object> params) {
        Number idValue = (Number) params.get("id");
        Number scoreValue = (Number) params.get("score");
        if (idValue == null || scoreValue == null || scoreValue.intValue() <= 0) {
            throw new BusinessException("学员ID和扣分分数不能为空，且扣分分数必须大于0");
        }
        Integer id = idValue.intValue();
        Integer score = scoreValue.intValue();
        log.info("学员违纪扣分: id={}, score={}", id, score);
        studentService.updateViolation(id, score.shortValue());
        return Result.success();
    }

    /**
     * 查询所有班级列表（供学员表单下拉使用）
     */
    @GetMapping("/clazzList")
    public Result listAllClazz() {
        log.info("查询所有班级列表");
        List<Clazz> clazzList = studentService.listAllClazz();
        return Result.success(clazzList);
    }

    /**
     * 统计每个班级的学员人数（柱状图数据）
     */
    @GetMapping("/countClazz")
    public Result countStudentByClazz() {
        log.info("统计班级学员人数");
        return Result.success(studentService.countStudentByClazz());
    }

    /**
     * 统计学员学历分布（饼状图数据）
     */
    @GetMapping("/countDegree")
    public Result countStudentByDegree() {
        log.info("统计学员学历分布");
        return Result.success(studentService.countStudentByDegree());
    }
}
