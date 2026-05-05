package com.lcx.tlias_web_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.lcx.tlias_web_management.pojo.Dept;
import com.lcx.tlias_web_management.pojo.Result;
import com.lcx.tlias_web_management.service.DeptService;
import org.springframework.web.bind.annotation.PutMapping;



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
    @DeleteMapping("/depts") // http://localhost:8080/depts?id=1
    public Result delete(Integer id){
        System.out.println("根据id删除部门数据:"+id);
        deptService.deleteById(id);
        return Result.success();
    }
    
    /**
     * 添加部门数据
     * @param dept
     * @return Result
     */
    @PostMapping("/depts")
    public Result add(@RequestBody Dept dept) {
        System.out.println("添加部门数据:"+dept);
        deptService.add(dept);
        return Result.success();
    }
    
    /**
     * 根据id查询部门数据
     * @param id
     * @return Result
     */
    @GetMapping("/depts/{id}") // http://localhost:8080/depts/1
    public Result getInfo(@PathVariable Integer id) {
        System.out.println("根据id查询部门数据:"+id);
        Dept dept = deptService.getInfoById(id);        
        return Result.success(dept);
    }

    @PutMapping("depts") 
    public Result update(@RequestBody Dept dept) {
        System.out.println("修改部门数据:"+dept);
        deptService.update(dept);
        return Result.success();
    }
}
