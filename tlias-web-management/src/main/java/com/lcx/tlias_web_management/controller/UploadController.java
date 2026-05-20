/**
 * 文件上传控制器
 * 处理用户头像图片的上传，返回可访问的图片 URL
 */
package com.lcx.tlias_web_management.controller;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lcx.tlias_web_management.pojo.Result;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
public class UploadController {

    @Value("${tlias.upload.path:d:/tlias}")
    private String uploadPath;

    /**
     * 上传头像图片
     */
    @PostMapping("/upload")
    public Result upload(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            return Result.error("请选择要上传的文件");
        }

        // 获取原始文件名
        String originalFilename = image.getOriginalFilename();
        log.info("上传文件: {}", originalFilename);

        // 提取文件扩展名
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 生成唯一文件名，防止覆盖
        String newFileName = UUID.randomUUID().toString() + ext;

        // 确保上传目录存在
        File dir = new File(uploadPath);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        // 保存文件
        File dest = new File(dir, newFileName);
        try {
            image.transferTo(dest);
        } catch (IOException e) {
            log.error("文件上传失败", e);
            return Result.error("文件上传失败: " + e.getMessage());
        }

        // 返回可访问的图片URL
        String imageUrl = "/images/" + newFileName;
        log.info("文件上传成功: {}", imageUrl);
        return Result.success(imageUrl);
    }
}
