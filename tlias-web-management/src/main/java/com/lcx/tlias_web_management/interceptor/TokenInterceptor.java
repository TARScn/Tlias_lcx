/**
 * Token 认证拦截器
 * 拦截除登录和静态资源外的所有请求，校验 JWT 令牌有效性
 */
package com.lcx.tlias_web_management.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.lcx.util.JwtUtils;
import com.lcx.util.CurrentHolder;
import io.jsonwebtoken.Claims;

@Slf4j
@Component
public class TokenInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        // 获取请求url
        String url = request.getRequestURI();
        // 获取请求头中的token
        String token = request.getHeader("token");
        // 判断token是否存在，如果不存在则返回401未授权
        if (token == null || token.isEmpty()) {
            log.warn("请求未携带token，拒绝访问: {}", url);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        // 解析token
        try{
            Claims claims = JwtUtils.parseJWT(token);
            // 注意：JWT 中存储的 key 为 "id"（见 EmpServiceImpl.login）
            Integer empId = (Integer) claims.get("id");
            CurrentHolder.setCurrentId(empId);
        }catch(Exception e){
            log.warn("请求携带的token无效，拒绝访问: {}", url);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        // token有效，放行
        log.info("请求携带的token有效，允许访问: {}", url);
        return true;
    }

    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler, @Nullable Exception ex) throws Exception {
        // 请求处理完毕，必须清除ThreadLocal中的数据
        CurrentHolder.remove();
    }
}
