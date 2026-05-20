package com.lcx.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * JWT 工具类
 * 基于 HMAC-SHA256 算法提供 JWT 令牌的生成与解析功能
 */
public class JwtUtils {

    /** 签名密钥（原始 Base64 字符串，内部使用时需满足 HS256 32 字节要求） */
    private static final String SIGN_KEY = "SVRIRUlNQQ==";

    /** 令牌过期时间（毫秒），默认 12 小时 */
    private static final Long EXPIRE = 43200000L;

    /** 预构建的 SecretKey 实例，避免每次调用时重复创建 */
    private static final SecretKey SECRET_KEY;

    static {
        // HS256 要求密钥长度至少 32 字节，重复原始字符串以补足
        byte[] keyBytes = SIGN_KEY.repeat(4).getBytes(StandardCharsets.UTF_8);
        SECRET_KEY = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 生成 JWT 令牌
     *
     * @param claims 要存储在令牌中的声明（payload）数据
     * @return 签名的 JWT 字符串（紧凑格式）
     */
    public static String generateJwt(Map<String, Object> claims) {
        return Jwts.builder()
                .signWith(SECRET_KEY)               // 使用预构建的密钥签名
                .addClaims(claims)                  // 设置自定义声明
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE)) // 设置过期时间
                .compact();
    }

    /**
     * 解析 JWT 令牌，并获取其 Payload 部分
     *
     * @param jwt JWT 令牌字符串
     * @return Claims 对象，包含令牌中存储的所有声明数据
     * @throws io.jsonwebtoken.JwtException 如果令牌无效、过期或签名不匹配
     */
    public static Claims parseJWT(String jwt) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)           // 设置验证签名的密钥
                .build()                             // 构建线程安全的解析器
                .parseClaimsJws(jwt)                 // 解析并验证 JWT
                .getBody();                          // 获取 Payload 内容
    }
}
