/**
 * 班级控制器
 * 提供班级 CRUD、分页条件查询、班主任列表查询等接口
 */
package com.lcx.tlias_web_management.controller;

import com.lcx.tlias_web_management.pojo.Clazz;
import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.PageResult;
import com.lcx.tlias_web_management.pojo.Result;
import com.lcx.tlias_web_management.service.ClazzService;
import com.lcx.tlias_web_management.aop.LogOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RequestMapping("/clazz")
@RestController
public class ClazzController {

    @Autowired
    private ClazzService clazzService;

    /**
     * 分页条件查询班级列表
     */
    @GetMapping
    public Result page(@RequestParam(defaultValue = "1") Integer pageNum,
                       @RequestParam(defaultValue = "10") Integer pageSize,
                       @RequestParam(required = false) String name) {
        log.info("分页查询班级列表: pageNum={}, pageSize={}, name={}", pageNum, pageSize, name);
        PageResult<Clazz> pageResult = clazzService.page(pageNum, pageSize, name);
        return Result.success(pageResult);
    }

    /**
     * 查询所有班主任（放在 /{id} 之前避免路径冲突）
     */
    @GetMapping("/masters")
    public Result listMasters() {
        log.info("查询所有班主任");
        List<Emp> masters = clazzService.listMasters();
        return Result.success(masters);
    }

    /**
     * 根据ID查询班级详情
     */
    @GetMapping("/{id}")
    public Result getById(@PathVariable Integer id) {
        log.info("根据ID查询班级: {}", id);
        Clazz clazz = clazzService.getById(id);
        return Result.success(clazz);
    }

    /**
     * 新增班级
     */
    @LogOperation
    @PostMapping
    public Result add(@RequestBody Clazz clazz) {
        log.info("新增班级: {}", clazz);
        clazzService.add(clazz);
        return Result.success();
    }

    /**
     * 修改班级
     */
    @LogOperation
    @PutMapping
    public Result update(@RequestBody Clazz clazz) {
        log.info("修改班级: {}", clazz);
        clazzService.update(clazz);
        return Result.success();
    }

    /**
     * 根据ID删除班级
     */
    @LogOperation
    @DeleteMapping("/{id}")
    public Result deleteById(@PathVariable Integer id) {
        log.info("删除班级: {}", id);
        clazzService.deleteById(id);
        return Result.success();
    }
}
