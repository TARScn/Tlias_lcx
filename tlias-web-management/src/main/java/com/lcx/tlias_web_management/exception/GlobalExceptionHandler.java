package com.lcx.tlias_web_management.exception;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.lcx.tlias_web_management.pojo.Result;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler
    public Result handleException(Exception e) {
        log.error("发生异常: ", e);
        return Result.error("服务器发生异常，请稍后再试");
    }

    @ExceptionHandler
    public Result handleDuplicateKeyException(DuplicateKeyException e) {
        log.error("发生异常: ", e);
        String msg = e.getMessage();
        int i=msg.indexOf("Duplicate entry");
        String errMsg = msg.substring(i);
        String[] arr = errMsg.split(" ");       
        return Result.error(arr[2]+"已存在，请勿重复添加");
    }
}
