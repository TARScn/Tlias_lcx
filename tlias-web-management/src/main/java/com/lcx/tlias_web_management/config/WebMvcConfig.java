package com.lcx.tlias_web_management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.lcx.tlias_web_management.interceptor.TokenInterceptor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private TokenInterceptor tokenInterceptor;

    @Value("${tlias.upload.path:d:/tlias}")
    private String uploadPath;

    /**
     * 注册拦截器
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tokenInterceptor)
                .addPathPatterns("/**") // 拦截所有请求
                .excludePathPatterns(
                    "/login/**",        // 排除登录相关的请求
                    "/js/**",           // 静态资源JS
                    "/css/**",          // 静态资源CSS
                    "/favicon.svg",     // 网站图标
                    "/index.html",      // 主页
                    "/login.html"       // 登录页
                );
    }

    /**
     * 配置静态资源映射，使上传的头像可通过 /images/** 访问
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 确保路径以 / 结尾
        String path = uploadPath.endsWith("/") ? uploadPath : uploadPath + "/";
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:" + path);
    }
}
