package com.lcx.tlias_web_management.controller;

import org.springframework.web.bind.annotation.RestController;

import com.lcx.tlias_web_management.pojo.Result;

import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;

import org.springframework.web.bind.annotation.GetMapping;

import com.lcx.tlias_web_management.pojo.Dept;
import com.lcx.tlias_web_management.service.DeptService;


@RestController
public class DeptController {
    @Autowired
    private DeptService deptService;

    // @RequestMapping(value = "/depts", method = RequestMethod.GET)  
    @GetMapping("/depts")  
    public Result list() {
        System.out.println("查询全部部门数据");
        List<Dept> deptlist = deptService.findAll();
        return Result.success(deptlist);
    }
}
