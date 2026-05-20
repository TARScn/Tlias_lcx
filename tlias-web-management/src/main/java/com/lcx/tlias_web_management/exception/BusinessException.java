package com.lcx.tlias_web_management.exception;

/**
 * 自定义业务异常类
 * 用于业务逻辑校验失败时抛出的可控异常，由 GlobalExceptionHandler 统一处理
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
