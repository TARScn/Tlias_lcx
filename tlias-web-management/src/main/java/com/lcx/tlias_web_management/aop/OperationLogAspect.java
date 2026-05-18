package com.lcx.tlias_web_management.aop;

import com.lcx.tlias_web_management.mapper.OperateLogMapper;
import com.lcx.tlias_web_management.pojo.OperateLog;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.lcx.util.CurrentHolder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.stream.Collectors;


@Aspect
@Component
public class OperationLogAspect {
    /** 返回值/参数最大记录长度 */
    private static final int MAX_STRING_LENGTH = 2000;

    @Autowired
    private OperateLogMapper operateLogMapper;

    // 环绕通知
    @Around("@annotation(log)")
    public Object logOperation(ProceedingJoinPoint joinPoint, LogOperation log) throws Throwable {
        // 记录开始时间
        long startTime = System.currentTimeMillis();
        // 执行方法
        Object result = joinPoint.proceed();
        // 当前时间
        long endTime = System.currentTimeMillis();
        // 耗时
        long costTime = endTime - startTime;

        // 构建日志对象
        OperateLog operateLog = new OperateLog();
        operateLog.setOperateEmpId(getCurrentUserId());
        operateLog.setOperateTime(LocalDateTime.now());
        operateLog.setClassName(joinPoint.getTarget().getClass().getName());
        operateLog.setMethodName(joinPoint.getSignature().getName());
        operateLog.setMethodParams(formatParams(joinPoint.getArgs()));
        // 处理 void 方法返回 null 的情况，避免 NullPointerException；截断过长返回值
        operateLog.setReturnValue(result != null ? truncate(result.toString()) : "void");
        operateLog.setCostTime(costTime);

        // 插入日志
        operateLogMapper.insert(operateLog);
        return result;
    }

    /**
     * 格式化方法参数：过滤掉 MultipartFile 等不可序列化类型，防敏感信息泄露
     */
    private String formatParams(Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        String params = Arrays.stream(args)
                .map(arg -> {
                    if (arg instanceof MultipartFile) {
                        MultipartFile file = (MultipartFile) arg;
                        return "{MultipartFile: " + file.getOriginalFilename() + "}";
                    }
                    return String.valueOf(arg);
                })
                .collect(Collectors.joining(", ", "[", "]"));
        return truncate(params);
    }

    /**
     * 截断过长的字符串，防止日志表字段溢出
     */
    private String truncate(String str) {
        if (str != null && str.length() > MAX_STRING_LENGTH) {
            return str.substring(0, MAX_STRING_LENGTH) + "... [truncated, total=" + str.length() + " chars]";
        }
        return str;
    }

    private int getCurrentUserId() {
        Integer id = CurrentHolder.getCurrentId();
        return id != null ? id : 0; // 防御性处理：ThreadLocal 中无数据时返回 0
    }
}
