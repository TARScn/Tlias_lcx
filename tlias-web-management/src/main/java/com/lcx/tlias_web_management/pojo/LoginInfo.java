/**
 * 登录信息响应封装类
 * 包含用户ID、用户名、姓名、JWT 令牌
 */
package com.lcx.tlias_web_management.pojo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginInfo {
    private Integer id; //用户ID
    private String username; //登录用户名
    private String name; //用户姓名
    private String token; //登录令牌
}
