package com.lcx.tlias_web_management.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.pojo.Result;
import com.lcx.tlias_web_management.service.EmpService;
import com.lcx.tlias_web_management.aop.LogOperation;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequestMapping("/emps")
@RestController
public class EmpController {
    @Autowired
    private EmpService empService;

    /**
     * 分页条件查询员工列表
     */
    @GetMapping
    public Result page(@RequestParam(defaultValue = "1") Integer pageNum,
                       @RequestParam(defaultValue = "10") Integer pageSize,
                       @RequestParam(required = false) String name,
                       @RequestParam(required = false) Integer gender,
                       @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
                       @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate end) {
        log.info("分页条件查询员工: pageNum={}, pageSize={}, name={}, gender={}, begin={}, end={}",
                pageNum, pageSize, name, gender, begin, end);
        PageResult<Emp> pageResult = empService.page(pageNum, pageSize, name, gender, begin, end);
        return Result.success(pageResult);
    }

    /**
     * 根据ID查询员工详情
     */
    @GetMapping("/{id}")
    public Result getById(@PathVariable Integer id) {
        log.info("根据ID查询员工: {}", id);
        Emp emp = empService.getById(id);
        return Result.success(emp);
    }

    /**
     * 新增员工
     */
    @LogOperation
    @PostMapping
    public Result add(@RequestBody Emp emp) {
        log.info("新增员工: {}", emp);
        empService.add(emp);
        return Result.success();
    }

    /**
     * 修改员工
     */
    @LogOperation
    @PutMapping
    public Result update(@RequestBody Emp emp) {
        log.info("修改员工: {}", emp);
        empService.update(emp);
        return Result.success();
    }

    /**
     * 根据ID删除员工
     */
    @LogOperation
    @DeleteMapping("/{id}")
    public Result deleteById(@PathVariable Integer id) {
        log.info("删除员工: {}", id);
        empService.deleteById(id);
        return Result.success();
    }

    /**
     * 批量删除员工
     */
    @LogOperation
    @DeleteMapping("/batch")
    public Result deleteByIds(@RequestParam List<Integer> ids) {
        log.info("批量删除员工: {}", ids);
        empService.deleteByIds(ids);
        return Result.success();
    }

    /**
     * 统计员工职位人数
     */
    @GetMapping("/countJob")
    public Result countEmpJob() {
        log.info("统计员工职位人数");
        return Result.success(empService.countEmpJob());
    }

    /**
     * 统计员工性别
     */
    @GetMapping("/countGender")
    public Result countEmpGender() {
        log.info("统计员工性别");
        return Result.success(empService.countEmpGender());
    }
}
