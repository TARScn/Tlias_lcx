# Cookie、Session、Token 与登录校验详解（基于 Spring Boot 项目）

## 一、概述

在 Web 应用中，HTTP 是一种**无状态协议**——每次请求之间相互独立，服务器不会"记住"客户端之前的操作。为了让服务器能够识别用户的身份，必须引入一套**身份认证与状态保持机制**。Cookie、Session、Token 是其中最核心的三种技术。

本文结合 [`tlias-web-management`](../tlias-web-management) 项目的实际代码，详细讲解上述技术的原理与实现方式，并深入分析 JWT（JSON Web Token）、过滤器（Filter）、拦截器（Interceptor）以及如何利用拦截器实现登录校验。

---

## 二、Cookie

### 2.1 什么是 Cookie？

**Cookie** 是由服务器生成、存储在客户端（浏览器）中的一小段文本数据。浏览器会在后续访问同一服务器时自动携带 Cookie，从而让服务器识别用户身份。

### 2.2 Cookie 的工作原理

```
用户 → 浏览器 → 请求（无 Cookie）→ 服务器
                                              ↓
用户 ← 浏览器 ← 响应（Set-Cookie 头部）← 服务器 生成 Cookie
                                              ↓
用户 → 浏览器 → 请求（Cookie 头部）→ 服务器  识别用户
```

1. **服务器下发**：当用户首次访问时，服务器通过 HTTP 响应头 `Set-Cookie` 将 Cookie 发送给浏览器。
2. **浏览器存储**：浏览器解析响应头，将 Cookie 保存在本地。
3. **自动携带**：后续每次请求同一域名下的资源时，浏览器自动在请求头 `Cookie` 中携带该 Cookie。
4. **服务器读取**：服务器解析请求头中的 Cookie，获取用户信息。

### 2.3 Cookie 的属性

| 属性 | 说明 | 示例 |
|------|------|------|
| `Name=Value` | Cookie 的名称和值 | `token=abc123` |
| `Domain` | 指定哪些域名可以访问该 Cookie | `.example.com` |
| `Path` | 指定哪些路径可以访问该 Cookie | `/` |
| `Max-Age` / `Expires` | 有效期（秒 / 日期时间） | `Max-Age=3600` |
| `HttpOnly` | 禁止 JavaScript 访问（防止 XSS 攻击） | `HttpOnly` |
| `Secure` | 仅通过 HTTPS 传输 | `Secure` |
| `SameSite` | 控制跨站请求是否携带 Cookie | `Strict` / `Lax` / `None` |

### 2.4 Cookie 的优缺点

| 优点 | 缺点 |
|------|------|
| 浏览器自动管理，无需前端额外编码 | 大小限制（通常 4KB） |
| 可设置过期时间，支持持久化 | 每次请求都会携带，增加流量开销 |
| 可配置 HttpOnly 防止 XSS | 跨域场景下行为复杂 |
| 实现简单，兼容性好 | 存储在客户端，存在篡改风险 |

---

## 三、Session

### 3.1 什么是 Session？

**Session（会话）** 是服务器端为每个用户创建的一个独立数据存储空间，用于在多次请求间保持用户状态。Session 数据存储在服务器内存（或 Redis 等外部存储）中，客户端仅持有一个指向该 Session 的 ID（通常是 `JSESSIONID`），该 ID 通过 Cookie 传递。

### 3.2 Session 的工作原理

```
用户 → 浏览器 → 请求（无 Cookie）→ 服务器
                                              ↓
                                     服务器创建 Session
                                     生成 SessionID
                                              ↓
用户 ← 浏览器 ← 响应（Set-Cookie: JSESSIONID=xxx）← 服务器
                                              ↓
用户 → 浏览器 → 请求（Cookie: JSESSIONID=xxx）→ 服务器
                                              ↓
                                     服务器根据 SessionID
                                     查找对应的 Session 数据
```

1. **创建 Session**：用户首次访问时，服务器为该用户创建一个唯一的 Session 对象，并生成 SessionID。
2. **下发 SessionID**：服务器通过 Cookie（默认名称 `JSESSIONID`）将 SessionID 发送给浏览器。
3. **携带 SessionID**：浏览器后续请求自动携带该 Cookie。
4. **查找 Session**：服务器根据 SessionID 找到对应的 Session 数据，从而识别用户身份。

### 3.3 Session 的存储方式

| 存储方式 | 说明 | 适用场景 |
|----------|------|----------|
| **本地内存** | Session 存储在应用服务器的 JVM 中 | 单机部署，开发环境 |
| **Redis** | Session 存储在 Redis 中，实现多实例共享 | 集群部署，生产环境 |
| **数据库** | Session 存储在关系型数据库中 | 需要持久化 Session 数据的场景 |

> Spring Session 提供了对 Redis 存储 Session 的开箱支持，只需引入 `spring-session-data-redis` 依赖即可。

### 3.4 Session 的优缺点

| 优点 | 缺点 |
|------|------|
| 数据存储在服务端，相对安全 | 占用服务器内存，高并发下压力大 |
| 可以存储任意大小的数据 | 集群环境下需要 Session 共享方案 |
| 天然支持服务端主动失效 | 依赖于 Cookie 传递 SessionID，Cookie 被禁用则无法工作 |
| API 简单（`request.getSession()`） | 移动端 / 跨平台支持不友好 |

---

## 四、Cookie vs. Session 对比

| 对比维度 | Cookie | Session |
|----------|--------|---------|
| **存储位置** | 客户端（浏览器） | 服务器端 |
| **数据容量** | 约 4KB | 无严格限制（取决于服务器资源） |
| **安全性** | 较低（可被篡改） | 较高（数据在服务端） |
| **生命周期** | 由 `Max-Age` / `Expires` 控制 | 由服务器控制（默认到浏览器关闭或超时） |
| **性能影响** | 每次请求自动携带，增加带宽 | 每次请求查询 Session，增加服务器开销 |
| **跨域支持** | 受限（Domain 属性限制） | 受限于 SessionID 的 Cookie 传递 |
| **移动端支持** | 需手动管理（无自动 Cookie 机制） | 依赖 SessionID 传递，移动端不友好 |

---

## 五、Token

### 5.1 什么是 Token？

**Token（令牌）** 是一种无状态的身份认证凭据。用户首次登录成功后，服务器签发一个经过签名的 Token 返回给客户端，客户端在后续请求中携带该 Token，服务器通过验证 Token 的签名来确认用户身份，**无需在服务端存储会话数据**。

### 5.2 Token 的工作原理

```
用户 → 浏览器 → 登录请求（用户名 + 密码）→ 服务器
                                              ↓
                                     服务器验证身份
                                     生成并签名 Token
                                              ↓
用户 ← 浏览器 ← 响应（返回 Token）← 服务器
                                              ↓
用户 → 浏览器 → 请求（Header: token=xxx）→ 服务器
                                              ↓
                                     服务器验证 Token 签名
                                     解析 Token 获取用户信息
```

1. **身份验证**：用户提交凭据（用户名 / 密码）到服务器。
2. **签发 Token**：服务器验证通过后，生成一个包含用户信息的 Token，签名后返回。
3. **客户端存储**：客户端（浏览器 / 移动端）将 Token 存储在本地（localStorage / 内存 / Cookie）。
4. **携带 Token**：后续请求在 HTTP 请求头中携带 Token（通常放在 `Authorization` 或自定义头中）。
5. **验证 Token**：服务器验证 Token 的签名和有效期，无需查询会话存储。

### 5.3 Token 相比 Cookie/Session 的优势

| 特性 | Cookie / Session | Token |
|------|------------------|-------|
| **无状态** | 服务端存储 Session，有状态 | Token 自包含用户信息，服务端无状态 |
| **跨域** | 受同源策略限制 | 天然支持跨域（通过请求头发送） |
| **移动端** | 不支持原生 Cookie | 完美支持移动端 |
| **分布式** | 需要 Session 共享方案 | 天生支持分布式，无需额外配置 |
| **扩展性** | 随用户量增加，Session 存储压力增大 | 服务端无状态，易于水平扩展 |
| **安全性** | SessionID 固定，CSRF 风险高 | 可通过签名防止篡改，有效期短 |

### 5.4 Token 的缺点

- **Token 体积较大**：自包含用户信息，比 SessionID 长得多，增加每次请求的传输开销。
- **无法主动失效**：服务端无状态意味着无法主动删除已签发的 Token（可通过黑名单或短有效期 + 刷新机制解决）。
- **需客户端自行管理**：Token 的存储、携带、刷新都需要前端编码实现。

---

## 六、JWT（JSON Web Token）详解

### 6.1 什么是 JWT？

**JWT（JSON Web Token）** 是目前最主流的 Token 实现标准（RFC 7519）。它将用户信息编码为一个紧凑的、自包含的 JSON 对象，并通过数字签名保证其完整性和真实性。

### 6.2 JWT 的结构

一个 JWT 由三部分组成，以 `.` 分隔：

```
xxxxx.yyyyy.zzzzz
  ↑     ↑     ↑
Header  Payload  Signature
```

#### （1）Header（头部）

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg`：签名算法，常用 `HS256`（HMAC-SHA256）或 `RS256`（RSA-SHA256）
- `typ`：令牌类型，固定为 `JWT`

Header 经过 **Base64URL 编码** 后作为 JWT 的第一部分。

#### （2）Payload（载荷）

Payload 是 JWT 的主体，包含要传递的声明（claims）：

```json
{
  "id": 1,
  "username": "admin",
  "iat": 1690000000,
  "exp": 1690043200
}
```

**注册声明（标准字段）**：

| 字段 | 全称 | 说明 |
|------|------|------|
| `iss` | Issuer | 签发者 |
| `sub` | Subject | 主题 |
| `aud` | Audience | 接收方 |
| `exp` | Expiration Time | 过期时间（时间戳） |
| `nbf` | Not Before | 生效时间 |
| `iat` | Issued At | 签发时间 |
| `jti` | JWT ID | 唯一标识 |

**自定义声明**：除了标准字段，可以添加业务需要的任意数据（如 `id`、`username`、`role` 等）。

> **注意**：Payload 是 Base64URL 编码，**不是加密**，本质上是明文。**绝对不要**在 Payload 中存放密码等敏感信息。

Payload 经过 **Base64URL 编码** 后作为 JWT 的第二部分。

#### （3）Signature（签名）

```
signature = HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secretKey
)
```

签名的作用：
- **防篡改**：任何对 Header 或 Payload 的修改都会导致签名验证失败
- **身份验证**：只有持有正确密钥的签发者才能生成有效签名

### 6.3 本项目中的 JWT 实现

#### JWT 工具类

位于 [`JwtUtils.java`](../tlias-web-management/src/main/java/com/lcx/util/JwtUtils.java)：

```java
public class JwtUtils {
    /** 签名密钥 */
    private static final String SIGN_KEY = "SVRIRUlNQQ==";
    /** 过期时间：12小时 */
    private static final Long EXPIRE = 43200000L;

    /** 生成 JWT */
    public static String generateJwt(Map<String, Object> claims) {
        return Jwts.builder()
                .signWith(SECRET_KEY)                          // 使用 HMAC-SHA256 签名
                .addClaims(claims)                             // 设置自定义声明
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE)) // 过期时间
                .compact();
    }

    /** 解析 JWT */
    public static Claims parseJWT(String jwt) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)                     // 设置验证密钥
                .build()
                .parseClaimsJws(jwt)                           // 解析并验证签名
                .getBody();                                    // 获取 Payload
    }
}
```

关键要点：
- **签名算法**：使用 `HMAC-SHA256`（HS256）
- **密钥强度**：HS256 要求密钥长度至少 32 字节，工具类中通过 `SIGN_KEY.repeat(4)` 补足
- **过期机制**：通过 `setExpiration()` 设置过期时间，解析时 JWT 库会自动校验

#### 登录时签发 JWT

位于 [`EmpServiceImpl.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java#L128-L140)：

```java
public LoginInfo login(Emp emp) {
    Emp result = empMapper.selectByUsernameAndPassword(emp);
    if (result != null) {
        Map<String,Object> dataMap = new HashMap<>();
        dataMap.put("id", result.getId());
        dataMap.put("username", result.getUsername());
        String jwt = JwtUtils.generateJwt(dataMap);  // 签发 JWT
        return new LoginInfo(result.getId(), result.getUsername(), result.getName(), jwt);
    }
    return null;
}
```

调用流程：
1. 查询数据库验证用户名和密码
2. 验证通过后，将 `id` 和 `username` 放入 claims
3. 调用 `JwtUtils.generateJwt()` 生成 JWT
4. 将 JWT 封装在 [`LoginInfo`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/LoginInfo.java) 对象中返回给前端

### 6.4 JWT 的优点

- **无状态**：服务端无需存储会话信息，减轻服务器压力
- **自包含**：用户信息和权限直接编码在 Token 中，一次解析即可获取全部信息
- **跨语言**：基于 JSON 标准，几乎所有语言都有对应的 JWT 库
- **跨域友好**：通过 HTTP Header 传递，不受同源策略限制
- **分布式友好**：无需 Session 共享，任何节点都能独立验证 Token
- **防篡改**：签名机制确保 Token 内容的完整性

### 6.5 JWT 的安全最佳实践

| 实践 | 说明 |
|------|------|
| **使用 HTTPS** | 防止 Token 在传输过程中被窃取 |
| **设置合理的过期时间** | 推荐 15 分钟～24 小时，降低泄露风险 |
| **密钥强度** | HS256 密钥 >= 32 字节，RS256 密钥 >= 2048 位 |
| **不在 Payload 存放敏感信息** | Payload 是 Base64 编码，并非加密 |
| **使用刷新令牌（Refresh Token）** | 配合长期有效的 Refresh Token 实现无感续期 |
| **Token 黑名单** | 对于需要主动失效的场景，维护一个 Token 黑名单 |

---

## 七、过滤器（Filter）

### 7.1 什么是过滤器？

**Filter（过滤器）** 是 Java Servlet 规范中的一部分，位于 Servlet 容器（如 Tomcat）层面。它可以在请求到达 Servlet（即 Controller）**之前**对请求进行预处理，也可以在响应返回客户端**之后**对响应进行后处理。

### 7.2 过滤器的执行流程

```
客户端请求
    ↓
  [Filter 1]  → doFilter() → 放行
    ↓
  [Filter 2]  → doFilter() → 放行
    ↓
  [Filter 3]  → doFilter() → 放行
    ↓
  Servlet / Controller 处理请求
    ↓
  [Filter 3]  ← 响应返回 ← 后处理
    ↓
  [Filter 2]  ← 响应返回 ← 后处理
    ↓
  [Filter 1]  ← 响应返回 ← 后处理
    ↓
客户端收到响应
```

### 7.3 过滤器的主要用途

| 用途 | 说明 |
|------|------|
| **请求日志** | 记录所有请求的 URL、IP、耗时等 |
| **字符编码** | 统一设置请求和响应的字符编码 |
| **身份认证** | 验证用户是否已登录（Filter 层面） |
| **权限校验** | 检查用户是否有权访问某资源 |
| **XSS/CSRF 防护** | 过滤恶意请求参数 |
| **请求压缩** | 对请求或响应进行 GZIP 压缩 |
| **跨域处理（CORS）** | 设置跨域响应头 |

### 7.4 过滤器的使用方式

#### 方式一：`@WebFilter` 注解 + `@ServletComponentScan`

```java
@WebFilter("/*")
public class LogFilter implements Filter {
    @Override
    public void init(FilterConfig filterConfig) {}
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        // 前置处理
        chain.doFilter(request, response); // 放行
        // 后置处理
    }
    
    @Override
    public void destroy() {}
}
```

#### 方式二：`@Component` + `@Order`（注册为 Spring Bean）

```java
@Component
@Order(1)
public class LogFilter implements Filter { ... }
```

### 7.5 Filter 与 Interceptor 的对比

| 对比维度 | Filter（过滤器） | Interceptor（拦截器） |
|----------|-----------------|----------------------|
| **规范层级** | Servlet 规范 | Spring MVC 框架 |
| **配置方式** | web.xml / `@WebFilter` | `WebMvcConfigurer.addInterceptors()` |
| **作用范围** | 所有 Web 资源（含静态资源） | 仅 Spring MVC 管理的 Controller |
| **上下文** | 无法访问 Spring IoC 容器 | 可以访问 Spring IoC 容器（Bean） |
| **粒度** | 粗粒度（URL 模式匹配） | 细粒度（方法级别，可通过注解控制） |
| **拦截点** | 请求进入 Servlet 前 | 请求进入 Controller 前后 / 视图渲染后 |
| **数量** | 通常较少 | 可以根据业务需求配置多个 |

---

## 八、拦截器（Interceptor）

### 8.1 什么是拦截器？

**Interceptor（拦截器）** 是 Spring MVC 框架提供的一种 AOP（面向切面编程）实现，它允许在 **Controller 方法执行前后** 进行拦截处理，粒度比 Filter 更细，且能直接访问 Spring 容器中的 Bean。

### 8.2 拦截器的三个核心方法

Spring MVC 的拦截器通过实现 [`HandlerInterceptor`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html) 接口来定义，该接口包含三个方法：

| 方法 | 执行时机 | 返回值 | 用途 |
|------|----------|--------|------|
| `preHandle()` | Controller 方法执行**之前** | `true` 放行，`false` 拦截 | 权限校验、日志记录、参数检查 |
| `postHandle()` | Controller 方法执行**之后**、视图渲染**之前** | 无 | 修改 ModelAndView、添加公共数据 |
| `afterCompletion()` | 请求**全部完成**之后（视图渲染完毕） | 无 | 资源清理、请求耗时统计 |

### 8.3 拦截器的执行流程

```
    请求
     ↓
  preHandle()  → 返回 false → 拦截，请求结束
     ↓ 返回 true
  Controller 方法处理请求
     ↓
  postHandle() → 修改 ModelAndView
     ↓
  视图渲染
     ↓
  afterCompletion() → 清理资源
```

### 8.4 本项目中的拦截器实现

#### 拦截器类

位于 [`TokenInterceptor.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/interceptor/TokenInterceptor.java)：

```java
@Slf4j
@Component
public class TokenInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {
        // 1. 获取请求 URL
        String url = request.getRequestURI();
        
        // 2. 获取请求头中的 token
        String token = request.getHeader("token");
        
        // 3. 判断 token 是否存在
        if (token == null || token.isEmpty()) {
            log.warn("请求未携带token，拒绝访问: {}", url);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            return false; // 拦截
        }
        
        // 4. 解析 token（验证签名和有效期）
        try {
            JwtUtils.parseJWT(token);
        } catch (Exception e) {
            log.warn("请求携带的token无效，拒绝访问: {}", url);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            return false; // 拦截
        }
        
        // 5. token 有效，放行
        log.info("请求携带的token有效，允许访问: {}", url);
        return true;
    }
}
```

#### 注册拦截器

位于 [`WebMvcConfig.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/config/WebMvcConfig.java)：

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private TokenInterceptor tokenInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tokenInterceptor)       // 注册拦截器
                .addPathPatterns("/**")                  // 拦截所有请求
                .excludePathPatterns(                    // 排除白名单
                    "/login/**",                         // 登录请求
                    "/js/**",                            // 静态资源 JS
                    "/css/**",                           // 静态资源 CSS
                    "/favicon.svg",                      // 网站图标
                    "/index.html",                       // 主页
                    "/login.html"                        // 登录页
                );
    }
}
```

关键配置说明：
- **`addPathPatterns("/**")`**：拦截所有请求路径
- **`excludePathPatterns(...)`**：排除不需要登录即可访问的资源，包括登录接口、静态资源（JS/CSS/HTML）
- **`@Configuration`**：声明为配置类，Spring 容器自动加载
- **`WebMvcConfigurer`**：Spring MVC 的配置接口，重写 `addInterceptors()` 来注册拦截器

---

## 九、使用拦截器实现登录校验（完整流程）

### 9.1 整体流程概述

```
                              ┌─────────────────────────────────┐
                              │        客户端（前端）             │
                              │  - 登录页 login.html              │
                              │  - 主页 index.html                │
                              └──────────┬──────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                     │
                    ▼                    ▼                     ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
            │ 登录请求      │   │ 携带Token请求 │   │ 未携带Token请求   │
            │ POST /login   │   │ header:token │   │ （无token头）     │
            └──────┬───────┘   └──────┬───────┘   └──────┬───────────┘
                   │                  │                   │
                   ▼                  ▼                   ▼
            ┌──────────────────────────────────────────────────────┐
            │             拦截器（TokenInterceptor）               │
            │              preHandle() 执行检查                    │
            │                                                     │
            │  /login/** → 白名单 → 直接放行                       │
            │  其他路径 → 检查请求头是否携带 token                 │
            │            ├─ 无 token → 401 未授权                  │
            │            ├─ token 无效 → 401 未授权                │
            │            └─ token 有效 → 放行                      │
            └──────────────────────────────────────────────────────┘
                                         │
                                         ▼
                              ┌───────────────────────┐
                              │  Controller 处理请求   │
                              └───────────────────────┘
```

### 9.2 步骤详解

#### 第一步：用户登录 → 签发 Token

1. 前端发送登录请求到 `POST /login`，传递用户名和密码。
2. [`LoginController`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/LoginController.java#L29-L38) 接收请求，调用 `empService.login(emp)`。
3. [`EmpServiceImpl.login()`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java#L128-L140)：
   - 查询数据库验证用户名和密码
   - 验证通过后，将用户 `id` 和 `username` 放入 claims
   - 调用 [`JwtUtils.generateJwt()`](../tlias-web-management/src/main/java/com/lcx/util/JwtUtils.java#L39-L45) 生成 JWT
   - 将 JWT 封装在 [`LoginInfo`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/LoginInfo.java) 中返回

```json
// 登录成功响应
{
  "code": 1,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiJ9.xxxxx"
  }
}
```

#### 第二步：前端存储 Token

前端将返回的 Token 存储在 `localStorage` 或 `sessionStorage` 中，并在后续所有请求的请求头中携带：

```javascript
// 登录成功后保存 token
localStorage.setItem('token', response.data.token);

// 后续请求自动携带 token（axios 请求拦截器示例）
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['token'] = token; // 放在请求头中
    }
    return config;
});
```

#### 第三步：拦截器校验 Token

对于每一个被拦截的请求，[`TokenInterceptor.preHandle()`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/interceptor/TokenInterceptor.java#L16-L38) 执行以下逻辑：

| 步骤 | 操作 | 代码 |
|------|------|------|
| ① | 获取请求 URI | `request.getRequestURI()` |
| ② | 从请求头获取 Token | `request.getHeader("token")` |
| ③ | Token 为空 → 返回 401 拦截 | `response.setStatus(401); return false;` |
| ④ | 解析 Token（验证签名 + 有效期） | `JwtUtils.parseJWT(token)` |
| ⑤ | 解析失败 → 返回 401 拦截 | `response.setStatus(401); return false;` |
| ⑥ | 解析成功 → 放行 | `return true;` |

#### 第四步：白名单配置

在 [`WebMvcConfig`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/config/WebMvcConfig.java#L26-L35) 中配置白名单，白名单中的请求不会被拦截：

```java
registry.addInterceptor(tokenInterceptor)
        .addPathPatterns("/**")
        .excludePathPatterns(
            "/login/**",     // 登录接口
            "/js/**",        // JS 静态资源
            "/css/**",       // CSS 静态资源
            "/favicon.svg",  // 图标
            "/index.html",   // 主页
            "/login.html"    // 登录页
        );
```

白名单的设计原则：
- **登录/注册接口**：认证前即可访问
- **静态资源**：HTML、CSS、JS、图片等
- **公开接口**：如验证码获取、密码重置等

### 9.3 登录校验流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                       请求到达                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  请求路径是否在白名单中？                                          │
│  (/login/**, /js/**, /css/**, /index.html, /login.html)            │
└──────┬──────────────────────────────────────────────────────┬───────┘
       │ 是                                                   │ 否
       ▼                                                      ▼
┌──────────────┐    ┌──────────────────────────────────────────────────┐
│  直接放行     │    │  从请求头获取 Token                              │
│              │    │  request.getHeader("token")                     │
└──────────────┘    └──────────┬───────────────────────────────────────┘
                               │
                      ┌────────┴────────┐
                      │ Token 是否为     │
                      │ null 或空字符串?  │
                      └───┬────────┬────┘
                      是  │        │ 否
                          ▼        ▼
                  ┌────────────┐   ┌──────────────────────────────────┐
                  │ 返回 401   │   │  解析 Token（验证签名+有效期）    │
                  │ 拒绝访问    │   │  JwtUtils.parseJWT(token)        │
                  └────────────┘   └──────────┬───────────────────────┘
                                              │
                                     ┌────────┴────────┐
                                     │ 解析是否成功？    │
                                     └───┬────────┬────┘
                                     是   │        │ 否
                                         ▼        ▼
                                 ┌────────────┐  ┌────────────┐
                                 │  放行       │  │ 返回 401   │
                                 │  return true│  │ 拒绝访问    │
                                 └────────────┘  └────────────┘
```

### 9.4 前端配合处理

当前端收到 401 状态码时，应自动跳转到登录页：

```javascript
// axios 响应拦截器
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 401) {
            localStorage.removeItem('token');  // 清除无效 token
            window.location.href = '/login.html'; // 跳转到登录页
        }
        return Promise.reject(error);
    }
);
```

---

## 十、总结

### 10.1 四种技术的核心区别

| 技术 | 存储位置 | 状态 | 安全机制 | 典型应用 |
|------|----------|------|----------|----------|
| **Cookie** | 客户端 | 有状态 | HttpOnly / Secure 属性 | SessionID 传递 |
| **Session** | 服务端 | 有状态 | SessionID 难以猜测 | 传统 Java Web 应用 |
| **Token / JWT** | 客户端 | 无状态 | 数字签名防篡改 | RESTful API、微服务 |
| **Filter** | Servlet 容器 | — | 粗粒度拦截 | 编码、跨域、登录校验 |
| **Interceptor** | Spring MVC | — | 细粒度拦截 | 权限校验、日志、参数检查 |

### 10.2 本项目登录校验的技术栈

```
┌─────────────────────────────────────────────────┐
│                 客户端（前端）                     │
│  localStorage 存储 Token                         │
│  请求头携带 Token                                │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│          WebMvcConfig（拦截器注册）                │
│  TokenInterceptor（拦截器校验 Token）              │
│  白名单：/login/**, /js/**, /css/**...           │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│     LoginController → EmpServiceImpl → JWT      │
│     登录成功 → 签发 JWT → 返回前端              │
└─────────────────────────────────────────────────┘
```

### 10.3 关键文件索引

| 文件 | 作用 |
|------|------|
| [`JwtUtils.java`](../tlias-web-management/src/main/java/com/lcx/util/JwtUtils.java) | JWT 令牌的生成与解析工具类 |
| [`TokenInterceptor.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/interceptor/TokenInterceptor.java) | 拦截器：校验请求头中的 Token |
| [`WebMvcConfig.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/config/WebMvcConfig.java) | 注册拦截器，配置白名单路径 |
| [`LoginController.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/LoginController.java) | 登录接口 |
| [`EmpServiceImpl.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java#L128-L140) | 登录业务逻辑：验证密码并签发 JWT |
| [`LoginInfo.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/LoginInfo.java) | 登录响应对象，封装 JWT 令牌 |

---

> **参考**：[RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519) | [Spring Web MVC 官方文档 - Interceptors](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html)
