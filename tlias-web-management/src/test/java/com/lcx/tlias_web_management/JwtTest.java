package com.lcx.tlias_web_management;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class JwtTest {
    @Test
    public void testGenJwt() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", 10);
        claims.put("username", "itheima");

        // 构建密钥：HS256 要求密钥至少 32 字节，重复原 Base64 字符串以满足长度要求
        SecretKey key = Keys.hmacShaKeyFor("aXRjYXN0aXRjYXN0aXRjYXN0aXRjYXN0".getBytes(StandardCharsets.UTF_8));
        String jwt = Jwts.builder()
                .signWith(key)
                .addClaims(claims)
                .setExpiration(new Date(System.currentTimeMillis() + 12 * 3600 * 1000))
                .compact();

        System.out.println(jwt);
    }
}
