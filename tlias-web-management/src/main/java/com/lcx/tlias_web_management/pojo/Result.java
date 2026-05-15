package com.lcx.tlias_web_management.pojo;

import lombok.Data;

@Data
public class Result {
    private Integer code;
    private String message;
    private Object data;

    public static Result success() {
        Result result = new Result();
        result.code=1;
        result.message="success";
        return result;
    }

    public static Result success(Object object) {
        Result result = new Result();
        result.data=object;
        result.code=1;
        result.message="success";
        return result;
    }

    public static Result error() {
        Result result = new Result();
        result.code=0;
        result.message="error";
        return result;
    }

    public static Result error(String msg) {
        Result result = new Result();
        result.code=0;
        result.message = msg;
        return result;
    }
}
