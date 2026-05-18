package com.lcx.tlias_web_management.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.lcx.util.JwtUtils;

@Slf4j
@Component
public class TokenInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
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
            JwtUtils.parseJWT(token);
        }catch(Exception e){
            log.warn("请求携带的token无效，拒绝访问: {}", url);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        // token有效，放行
        log.info("请求携带的token有效，允许访问: {}", url);
        return true;
    }
}
