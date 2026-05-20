package com.lcx.tlias_web_management.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 自定义注解 - 操作日志记录
 * 标注在需要记录操作日志的 Controller 方法上，由 OperationLogAspect 切入处理
 */
@Target(ElementType.METHOD) // 注解作用于方法
@Retention(RetentionPolicy.RUNTIME) // 运行时起作用
public @interface LogOperation {

}
