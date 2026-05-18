package com.lcx.tlias_web_management.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.beans.factory.annotation.Autowired;

import com.lcx.tlias_web_management.pojo.Emp;
import com.lcx.tlias_web_management.pojo.LoginInfo;
import com.lcx.tlias_web_management.pojo.Result;
import com.lcx.tlias_web_management.service.EmpService;

/**
 * 登录控制器，处理用户登录相关的请求
 */
@Slf4j
@RestController
@RequestMapping("/login")
public class LoginController {
    @Autowired
    private EmpService empService;
    /**
     * 处理用户登录请求
     */
    @PostMapping
    public Result login(@RequestBody Emp emp) {
        log.info("用户登录请求: {}", emp);
        LoginInfo info = empService.login(emp);
        if (info == null) {
            log.warn("登录失败，用户名或密码错误: {}", emp.getName());
            return Result.error("用户名或密码错误");
        }
        return Result.success(info);
    }
    
}
