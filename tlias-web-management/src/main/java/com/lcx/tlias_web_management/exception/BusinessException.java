package com.lcx.tlias_web_management.exception;

/**
 * 自定义业务异常，用于处理业务逻辑中的异常情况
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
