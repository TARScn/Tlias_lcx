package com.lcx.tlias_web_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lcx.tlias_web_management.pojo.Dept;
import com.lcx.tlias_web_management.pojo.Result;
import com.lcx.tlias_web_management.service.DeptService;

@RestController
public class DeptController {
    @Autowired
    private DeptService deptService;

    /**
    * 查询全部部门数据
    * @param null
    * @return Result
    */
    @GetMapping("/depts")  
    public Result list() {
        System.out.println("查询全部部门数据");
        List<Dept> deptlist = deptService.findAll();
        return Result.success(deptlist);
    }
    /**
     * 根据id删除部门数据
     * @param id
     * @return Result
     */
    @GetMapping("/depts/delete")
    public Result delete(Integer id){
        System.out.println("根据id删除部门数据:"+id);
        deptService.deleteById(id);
        return Result.success();
    }
}
