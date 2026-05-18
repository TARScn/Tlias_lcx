package com.lcx.tlias_web_management.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 封装登入信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginInfo {
    private Integer id; //用户ID
    private String username; //登录用户名
    private String name; //用户姓名
    private String token; //登录令牌
}
