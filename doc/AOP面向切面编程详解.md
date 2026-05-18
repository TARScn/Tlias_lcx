# AOP（面向切面编程）详解 —— 结合 Tlias 员工管理系统

## 目录

1. [AOP 概述](#1-aop-概述)
2. [AOP 核心概念](#2-aop-核心概念)
3. [AOP 通知类型](#3-aop-通知类型)
4. [通知执行顺序](#4-通知执行顺序)
5. [切入点表达式](#5-切入点表达式)
6. [本项目 AOP 案例：操作日志记录](#6-本项目-aop-案例操作日志记录)
7. [项目中的其他 AOP 相关应用](#7-项目中的其他-aop-相关应用)
8. [总结](#8-总结)

---

## 1. AOP 概述

### 1.1 什么是 AOP？

**AOP**（Aspect-Oriented Programming，面向切面编程）是一种编程范式，它通过**预编译方式**和**运行期动态代理**实现程序功能的统一维护。AOP 是 OOP（面向对象编程）的补充，用于将那些**与业务无关**、但**多个模块都需要的逻辑**（如日志记录、权限校验、性能统计、事务管理等）封装起来，减少系统中的重复代码，降低模块间的耦合度。

### 1.2 为什么需要 AOP？

在传统的 OOP 中，日志、权限、事务等**横切关注点**（Cross-cutting Concerns）的代码会分散在各个业务方法中，造成 **代码分散** 和 **代码混乱**：

```
// 传统写法：每个业务方法都要写一遍日志
public Result add(@RequestBody Dept dept) {
    log.info("添加部门数据:{}", dept);  // 日志代码散落各处
    deptService.add(dept);
    log.info("添加部门成功");           // 日志代码散落各处
    return Result.success();
}
```

AOP 将这些横切关注点抽取到**切面**中，实现 **关注点分离**，让业务类只关注核心业务逻辑：

```
// AOP 写法：业务方法只需关注业务
@LogOperation
public Result add(@RequestBody Dept dept) {
    deptService.add(dept);
    return Result.success();
}
```

### 1.3 AOP 与拦截器的区别

| 特性 | AOP | 拦截器（Interceptor） |
|------|-----|---------------------|
| 作用范围 | 可以拦截**任何 Spring Bean** 的方法 | 仅拦截 **Web 请求**（Controller 层） |
| 粒度 | 方法级别，可精确到特定注解/包/类 | 请求路径级别（URL 匹配） |
| 实现原理 | 动态代理（JDK Proxy / CGLib） | Servlet Filter 链 |
| 典型用途 | 事务、日志、性能监控、缓存 | 登录校验、权限控制、请求头处理 |

本项目结合使用了二者：
- **[`TokenInterceptor`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/interceptor/TokenInterceptor.java:17)** — 拦截器，负责 Token 登录校验
- **[`OperationLogAspect`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/aop/OperationLogAspect.java:20)** — AOP 切面，负责操作日志记录

---

## 2. AOP 核心概念

### 2.1 核心术语对照表

| 术语 | 英文 | 说明 | 类比（现实世界） |
|------|------|------|----------------|
| **目标对象** | Target | 被增强的业务对象（如 Controller 中的方法） | 被拍摄的演员 |
| **切面** | Aspect | 封装横切关注点的模块（通知 + 切入点） | 导演的"开拍/停拍"指令单元 |
| **连接点** | JoinPoint | 程序执行中可被拦截的点（方法调用、异常等） | 电影中的每个镜头 |
| **切入点** | Pointcut | 对连接点的**筛选条件**，匹配哪些连接点需要被增强 | 导演说"这条要重拍"的规则 |
| **通知** | Advice | 切入到目标方法的具体逻辑代码 | 导演喊的"Action！"或"Cut！" |
| **织入** | Weaving | 将切面应用到目标对象并创建代理对象的过程 | 导演把指令融入拍摄过程 |
| **引入** | Introduction | 为目标对象添加新的方法或属性 | 给演员临时加戏 |

### 2.2 概念关系图

```
                        ┌──────────────────────────┐
                        │       切面 (Aspect)        │
                        │  ┌──────────────────┐     │
                        │  │  通知 (Advice)     │     │
                        │  │  (要执行的逻辑)    │     │
                        │  └──────────────────┘     │
                        │  ┌──────────────────┐     │
                        │  │  切入点 (Pointcut) │     │
                        │  │  (匹配条件)       │     │
                        │  └──────────────────┘     │
                        └──────────┬───────────────┘
                                   │ 织入 (Weaving)
                                   ▼
     ┌───────────┐    ┌──────────────────────┐    ┌───────────┐
     │ 目标对象   │───→│    动态代理对象       │───→│ 连接点     │
     │ (Target)  │    │  (Proxy = Target +   │    │(JoinPoint)│
     │           │    │   Aspect)            │    │           │
     └───────────┘    └──────────────────────┘    └───────────┘
```

### 2.3 Spring AOP 底层原理

Spring AOP 基于 **动态代理** 实现：

- **JDK 动态代理**：目标类实现了接口时使用
- **CGLib 动态代理**：目标类未实现接口时使用（通过继承生成子类代理）

在 [`pom.xml`](tlias-web-management/pom.xml:49) 中引入 `spring-boot-starter-aop` 后，Spring Boot 会自动配置 AOP 功能：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

---

## 3. AOP 通知类型

Spring AOP 提供了 **5 种通知类型**，对应不同的拦截时机：

| 通知类型 | 注解 | 执行时机 | 能否控制目标方法执行 |
|----------|------|----------|-------------------|
| **前置通知** | [`@Before`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/Before.html) | 目标方法**执行之前** | ❌ 不能 |
| **后置通知** | [`@After`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/After.html) | 目标方法**执行之后**（无论是否异常） | ❌ 不能 |
| **返回通知** | [`@AfterReturning`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/AfterReturning.html) | 目标方法**正常返回之后** | ❌ 不能 |
| **异常通知** | [`@AfterThrowing`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/AfterThrowing.html) | 目标方法**抛出异常之后** | ❌ 不能 |
| **环绕通知** | [`@Around`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/Around.html) | **环绕**目标方法执行 | ✅ 可以（通过 `proceed()`） |

### 3.1 各通知类型示例

```java
@Aspect
@Component
public class DemoAspect {

    @Before("execution(* com.lcx..*.*(..))")
    public void before(JoinPoint jp) {
        // 在目标方法执行前运行
    }

    @After("execution(* com.lcx..*.*(..))")
    public void after(JoinPoint jp) {
        // 在目标方法执行后运行（finally 块）
    }

    @AfterReturning(value = "execution(* com.lcx..*.*(..))", returning = "result")
    public void afterReturning(JoinPoint jp, Object result) {
        // 目标方法正常返回后运行，可获取返回值
    }

    @AfterThrowing(value = "execution(* com.lcx..*.*(..))", throwing = "e")
    public void afterThrowing(JoinPoint jp, Throwable e) {
        // 目标方法抛出异常后运行，可获取异常对象
    }

    @Around("execution(* com.lcx..*.*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        // 前置逻辑
        Object result = pjp.proceed(); // 调用目标方法
        // 后置逻辑
        return result;
    }
}
```

### 3.2 `@Around` 环绕通知详解

环绕通知是功能最强大的通知类型，**本项目中的操作日志切面就使用了 `@Around`**。它的核心特点：

- 必须通过 [`ProceedingJoinPoint.proceed()`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/aspectj/lang/ProceedingJoinPoint.html) 手动调用目标方法
- 可以在调用前后分别执行自定义逻辑
- 可以修改目标方法的参数
- 可以修改目标方法的返回值
- 可以捕获异常并处理
- 可以阻止目标方法执行

### 3.3 `JoinPoint` / `ProceedingJoinPoint` 常用 API

```java
// 获取方法签名信息
joinPoint.getSignature().getName();        // 方法名
joinPoint.getSignature().getDeclaringTypeName(); // 类全名
joinPoint.getTarget().getClass().getName(); // 目标类名

// 获取方法参数
joinPoint.getArgs();                       // 参数数组

// ProceedingJoinPoint 特有
pjp.proceed();                             // 执行目标方法
pjp.proceed(Object[] args);                // 用新参数执行目标方法
```

---

## 4. 通知执行顺序

### 4.1 正常执行顺序

当一个切面有多个通知类型时，执行顺序为：

```
┌─────────────────────────────────────────────────────────┐
│            @Around (环绕通知 - 前半部分)                  │
│    ┌─────────────────────────────────────────────────┐  │
│    │             @Before (前置通知)                    │  │
│    │    ┌─────────────────────────────────────────┐  │  │
│    │    │         目标方法 (Target Method)          │  │  │
│    │    └─────────────────────────────────────────┘  │  │
│    │             @AfterReturning (返回通知)           │  │
│    └─────────────────────────────────────────────────┘  │
│            @After (后置通知)                             │
│            @Around (环绕通知 - 后半部分)                  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 异常执行顺序

当目标方法抛出异常时：

```
┌─────────────────────────────────────────────────────────┐
│            @Around (环绕通知 - 前半部分)                  │
│    ┌─────────────────────────────────────────────────┐  │
│    │             @Before (前置通知)                    │  │
│    │    ┌─────────────────────────────────────────┐  │  │
│    │    │   目标方法抛出异常 ✗                      │  │  │
│    │    └─────────────────────────────────────────┘  │  │
│    │             @AfterThrowing (异常通知)            │  │
│    └─────────────────────────────────────────────────┘  │
│            @After (后置通知)                             │
└─────────────────────────────────────────────────────────┘
```

> **注意**：如果 `@Around` 通知中捕获了异常而没有继续抛出，则 `@AfterThrowing` 不会执行，`@AfterReturning` 会执行。

### 4.3 多切面执行顺序

当存在**多个切面**作用于同一连接点时，可以通过 [`@Order`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html) 注解控制执行顺序，数值越小优先级越高：

```java
@Aspect
@Component
@Order(1)  // 优先级高
public class FirstAspect { ... }

@Aspect
@Component
@Order(2)  // 优先级低
public class SecondAspect { ... }
```

执行顺序为 **层层嵌套**：

```
┌─ FirstAspect @Around 前半 ──────────────────────────┐
│  ┌─ SecondAspect @Around 前半 ────────────────────┐  │
│  │  ┌─ @Before (First) ── @Before (Second) ──┐   │  │
│  │  │           目标方法执行                    │   │  │
│  │  └─ @After (Second) ── @After (First) ───┘   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 5. 切入点表达式

切入点表达式用于定义**哪些方法需要被增强**。Spring AOP 主要支持 **AspectJ 切入点指示符**。

### 5.1 常用切入点指示符

| 指示符 | 说明 | 示例 |
|--------|------|------|
| [`execution`](https://www.eclipse.org/aspectj/doc/next/progguide/semantics-pointcuts.html) | 匹配**方法执行**（最常用） | `execution(* com.lcx..*.*(..))` |
| [`@annotation`](https://www.eclipse.org/aspectj/doc/next/progguide/semantics-pointcuts.html) | 匹配**拥有指定注解**的方法 | `@annotation(com.lcx..LogOperation)` |
| [`within`](https://www.eclipse.org/aspectj/doc/next/progguide/semantics-pointcuts.html) | 匹配**指定类型**内的所有方法 | `within(com.lcx..controller..*)` |
| [`@within`](https://www.eclipse.org/aspectj/doc/next/progguide/semantics-pointcuts.html) | 匹配**拥有指定注解的类**内的方法 | `@within(org.springframework.web.bind.annotation.RestController)` |
| [`args`](https://www.eclipse.org/aspectj/doc/next/progguide/semantics-pointcuts.html) | 匹配**参数类型** | `args(Integer, String)` |
| [`bean`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/ AspectJPointcutAdvisor.html) | 匹配**Spring Bean 名称** | `bean(*ServiceImpl)` |

### 5.2 `execution` 表达式详解

`execution` 是最灵活、最常用的指示符，语法格式：

```
execution(修饰符? 返回值类型 包名.类名.方法名(参数类型) throws 异常?)
```

| 通配符 | 含义 | 示例 |
|--------|------|------|
| `*` | 匹配任意内容（返回值、包、类、方法名） | `execution(* *.*(..))` — 匹配任意方法 |
| `..` | 匹配任意参数（0个或多个） | `execution(* com.lcx..*(..))` — 匹配 com.lcx 包及子包 |
| `+` | 匹配类及其子类 | `within(com.lcx..BaseService+)` |

**常见表达式示例**：

```java
// 匹配 com.lcx 包及其子包下所有类的所有方法
"execution(* com.lcx..*.*(..))"

// 匹配 Controller 层所有方法
"execution(* com.lcx..controller.*.*(..))"

// 匹配 Service 层中所有以 add 开头的方法
"execution(* com.lcx..service.*.add*(..))"

// 匹配返回值类型为 Result 的所有方法
"execution(com.lcx..pojo.Result com.lcx..*(..))"
```

### 5.3 `@annotation` 表达式详解

`@annotation` 用于匹配**标有指定注解的方法**，本项目中的操作日志切面就使用了这种方式：

```java
// 匹配所有标注了 @LogOperation 注解的方法
@Around("@annotation(log)")
public Object logOperation(ProceedingJoinPoint joinPoint, LogOperation log) throws Throwable {
    // ...
}
```

这里的 `log` 参数不仅用于匹配，还会被注入为实际的注解对象，可以在通知体中**读取注解属性**（如果注解有定义属性的话）。

### 5.4 切入点复用

可以使用 [`@Pointcut`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/Pointcut.html) 将切入点表达式定义为**可复用的方法**：

```java
@Aspect
@Component
public class LogAspect {

    // 定义可复用的切入点
    @Pointcut("@annotation(com.lcx.tlias_web_management.aop.LogOperation)")
    public void logPointcut() {}

    @Before("logPointcut()")
    public void beforeLog() {
        // 使用复用切入点
    }

    @Around("logPointcut()")
    public Object aroundLog(ProceedingJoinPoint pjp) throws Throwable {
        // 使用复用切入点
        return pjp.proceed();
    }
}
```

> **提示**：在本项目中，`OperationLogAspect` 直接使用了 `@Around("@annotation(log)")` 内联写法，没有定义 `@Pointcut`，因为只有一处通知需要该切入点。

---

## 6. 本项目 AOP 案例：操作日志记录

### 6.1 功能需求

在员工管理系统中，需要**自动记录**用户对数据的增、删、改操作，包括：
- 谁操作的（操作人 ID）
- 什么时间操作的
- 操作了哪个类的哪个方法
- 传入的参数是什么
- 返回的结果是什么
- 执行耗时多少

### 6.2 实现架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         Controller 层                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ DeptController│  │ EmpController│  │ClazzController│  ...     │
│  │ @LogOperation │  │ @LogOperation│  │ @LogOperation│          │
│  └───────┬──────┘  └──────┬───────┘  └──────┬───────┘           │
│          │                 │                 │                    │
│          └──────────┬──────┴─────────┬───────┘                    │
│                     │   被 AOP 拦截    │                           │
│                     ▼                 ▼                           │
│          ┌─────────────────────────────────────┐                 │
│          │      OperationLogAspect (切面)       │                 │
│          │  @Around("@annotation(log)")        │                 │
│          │  1. 记录开始时间                      │                 │
│          │  2. pjp.proceed() 执行目标方法        │                 │
│          │  3. 计算耗时、构建 OperateLog 对象     │                 │
│          │  4. operateLogMapper.insert() 入库   │                 │
│          └──────────────┬──────────────────────┘                 │
│                         ▼                                        │
│          ┌──────────────────────────┐                            │
│          │   operate_log 数据表      │                            │
│          │   (MySQL 持久化)          │                            │
│          └──────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 详细代码逐行解析

#### ① 自定义注解 [`LogOperation`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/aop/LogOperation.java)

```java
package com.lcx.tlias_web_management.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 自定义注解，用于标识需要记录操作日志的方法
 */
@Target(ElementType.METHOD)   // ⚡ 注解只能作用于方法上
@Retention(RetentionPolicy.RUNTIME) // ⚡ 运行时保留（反射可读取）
public @interface LogOperation {

}
```

**关键点**：
- `@Target(ElementType.METHOD)` — 限定该注解只能标注在**方法**上
- `@Retention(RetentionPolicy.RUNTIME)` — 注解在**运行时**依然存活，AOP 切面才能通过反射读取到
- 该注解**没有定义任何属性**，仅作为一个"标记"，标识哪些方法需要记录操作日志

> **扩展思考**：如果将来需要区分操作类型（如"新增"、"删除"、"修改"），可以在注解中添加属性，如 `String value()` default ""，然后在切面中通过 `log.value()` 读取。

#### ② 切面类 [`OperationLogAspect`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/aop/OperationLogAspect.java)

```java
package com.lcx.tlias_web_management.aop;

import com.lcx.tlias_web_management.mapper.OperateLogMapper;
import com.lcx.tlias_web_management.pojo.OperateLog;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.lcx.util.CurrentHolder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.stream.Collectors;

@Aspect          // ⚡ 声明这是一个切面类
@Component       // ⚡ 将切面交给 Spring 容器管理
public class OperationLogAspect {

    /** 返回值/参数最大记录长度，防止日志表字段溢出 */
    private static final int MAX_STRING_LENGTH = 2000;

    @Autowired
    private OperateLogMapper operateLogMapper;  // ⚡ 注入 Mapper 用于持久化日志
```

**逐行解析**：

| 代码 | 说明 |
|------|------|
| `@Aspect` | 声明当前类为切面类，Spring 会扫描并为其创建代理 |
| `@Component` | 将切面注册为 Spring Bean |
| `@Autowired OperateLogMapper` | 注入操作日志 Mapper，用于将日志写入数据库 |
| `MAX_STRING_LENGTH = 2000` | 防止超长参数/返回值撑爆数据库字段 |

##### 核心通知方法

```java
    // 环绕通知：@Around 结合 @annotation 切入点表达式
    @Around("@annotation(log)")
    public Object logOperation(ProceedingJoinPoint joinPoint, LogOperation log) throws Throwable {
        // ① 记录开始时间
        long startTime = System.currentTimeMillis();

        // ② 执行目标方法（让业务逻辑正常运行）
        Object result = joinPoint.proceed();

        // ③ 记录结束时间并计算耗时
        long endTime = System.currentTimeMillis();
        long costTime = endTime - startTime;

        // ④ 构建日志对象
        OperateLog operateLog = new OperateLog();
        operateLog.setOperateEmpId(getCurrentUserId());  // 从 ThreadLocal 获取当前用户
        operateLog.setOperateTime(LocalDateTime.now());   // 当前时间
        operateLog.setClassName(joinPoint.getTarget().getClass().getName());  // 目标类全名
        operateLog.setMethodName(joinPoint.getSignature().getName());         // 目标方法名
        operateLog.setMethodParams(formatParams(joinPoint.getArgs()));        // 方法参数（格式化）
        // 处理 void 方法返回 null 的情况
        operateLog.setReturnValue(result != null ? truncate(result.toString()) : "void");
        operateLog.setCostTime(costTime);

        // ⑤ 插入日志到数据库
        operateLogMapper.insert(operateLog);

        // ⑥ 返回结果（不修改返回值，仅记录）
        return result;
    }
```

**执行流程详解**：

```
时间线 ────────────────────────────────────────────────────────►

┌─── ① startTime ───┐   ┌─── ③ endTime ───┐
│                    │   │                 │
▼                    ▼   ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│ ② joinPoint.proceed() — 执行目标方法                       │
│ 例如：DeptController.delete(Integer id)                     │
│       → DeptService.deleteById(id)                          │
│       → DeptMapper.deleteById(id)                           │
│       → SQL: DELETE FROM dept WHERE id = ?                  │
└─────────────────────────────────────────────────────────────┘

④ 构建 OperateLog  ←─── ⑤ operateLogMapper.insert(operateLog)
                                    │
                                    ▼
                         operate_log 表 (MySQL)
```

##### 辅助工具方法

```java
    /**
     * 格式化方法参数：过滤掉 MultipartFile 等不可序列化类型
     */
    private String formatParams(Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        String params = Arrays.stream(args)
                .map(arg -> {
                    if (arg instanceof MultipartFile) {
                        // ⚡ 对文件上传参数特殊处理：只记录文件名，不记录文件内容
                        MultipartFile file = (MultipartFile) arg;
                        return "{MultipartFile: " + file.getOriginalFilename() + "}";
                    }
                    return String.valueOf(arg);
                })
                .collect(Collectors.joining(", ", "[", "]"));
        return truncate(params);
    }

    /**
     * 截断过长的字符串，防止日志表字段溢出
     */
    private String truncate(String str) {
        if (str != null && str.length() > MAX_STRING_LENGTH) {
            return str.substring(0, MAX_STRING_LENGTH) + "... [truncated, total=" + str.length() + " chars]";
        }
        return str;
    }

    /**
     * 从 ThreadLocal 获取当前操作人 ID
     * 数据来源：TokenInterceptor.preHandle() 中解析 Token 后存入
     */
    private int getCurrentUserId() {
        Integer id = CurrentHolder.getCurrentId();
        return id != null ? id : 0; // 防御性处理
    }
}
```

**`formatParams` 方法的设计亮点**：

1. **空安全**：`args == null || args.length == 0` 时返回 `"[]"`
2. **特殊类型处理**：`MultipartFile` 文件对象如果直接 `toString()` 会打印文件二进制内容，这里只记录文件名
3. **防溢出**：最终通过 `truncate()` 截断超长字符串

**`getCurrentUserId` 的协作流程**：

```
请求到达
    │
    ▼
TokenInterceptor.preHandle()          ←── 拦截器阶段
    │ 解析 JWT Token → 提取 empId
    │ CurrentHolder.setCurrentId(empId)  ←── 存入 ThreadLocal
    ▼
Controller 方法执行                    ←── AOP 拦截阶段
    │
    ▼
OperationLogAspect.logOperation()
    │ getCurrentUserId()                ←── 从 ThreadLocal 读取
    │ CurrentHolder.getCurrentId()
    ▼
写入 operate_log.operate_emp_id
    │
    ▼
TokenInterceptor.afterCompletion()
    │ CurrentHolder.remove()            ←── 请求结束，清除 ThreadLocal
```

#### ③ 实体类 [`OperateLog`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/OperateLog.java)

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OperateLog {
    private Integer id;             // 主键 ID
    private Integer operateEmpId;   // 操作人 ID（关联 emp 表）
    private LocalDateTime operateTime; // 操作时间
    private String className;       // 操作类名（如 com.lcx...DeptController）
    private String methodName;      // 操作方法名（如 delete）
    private String methodParams;    // 方法参数（JSON 格式字符串）
    private String returnValue;     // 返回值（字符串形式）
    private Long costTime;          // 方法执行耗时（毫秒）
}
```

#### ④ Mapper 接口 [`OperateLogMapper`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/mapper/OperateLogMapper.java)

```java
@Mapper
public interface OperateLogMapper {
    @Insert("insert into operate_log " +
            "(operate_emp_id, operate_time, class_name, method_name, " +
            "method_params, return_value, cost_time) " +
            "values (#{operateEmpId}, #{operateTime}, #{className}, " +
            "#{methodName}, #{methodParams}, #{returnValue}, #{costTime});")
    public void insert(OperateLog log);
}
```

### 6.4 使用方式

在 Controller 的增、删、改方法上添加 `@LogOperation` 注解即可：

```java
// DeptController.java
@LogOperation
@DeleteMapping
public Result delete(Integer id) { ... }

@LogOperation
@PostMapping
public Result add(@RequestBody Dept dept) { ... }

// EmpController.java
@LogOperation
@PostMapping
public Result add(@RequestBody Emp emp) { ... }

@LogOperation
@DeleteMapping("/{id}")
public Result deleteById(@PathVariable Integer id) { ... }

// ClazzController.java
@LogOperation
@PostMapping
public Result add(@RequestBody Clazz clazz) { ... }

// StudentController.java
@LogOperation
@PutMapping("/violation")
public Result updateViolation(@RequestBody Map<String, Object> params) { ... }
```

**覆盖范围统计**：

| Controller | 使用 `@LogOperation` 的方法 |
|------------|--------------------------|
| [`DeptController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java) | `delete`, `add`, `update` |
| [`EmpController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java) | `add`, `update`, `deleteById`, `deleteByIds` |
| [`ClazzController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/ClazzController.java) | `add`, `update`, `deleteById` |
| [`StudentController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/StudentController.java) | `add`, `update`, `deleteById`, `deleteByIds`, `updateViolation` |

> **设计原则**：查询操作（`@GetMapping`）不需要记录日志，只对**写操作**（增、删、改）进行记录，避免产生过多无意义的日志数据。

### 6.5 数据库表结构

```sql
CREATE TABLE operate_log (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    operate_emp_id  INT          NOT NULL COMMENT '操作人ID',
    operate_time    DATETIME     NOT NULL COMMENT '操作时间',
    class_name      VARCHAR(200) NOT NULL COMMENT '操作类名',
    method_name     VARCHAR(100) NOT NULL COMMENT '操作方法名',
    method_params   VARCHAR(5000)COMMENT '方法参数',
    return_value    VARCHAR(5000)COMMENT '返回值',
    cost_time       BIGINT       NOT NULL COMMENT '耗时(ms)'
) COMMENT '操作日志表';
```

---

## 7. 项目中的其他 AOP 相关应用

### 7.1 全局异常处理 [`GlobalExceptionHandler`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/exception/GlobalExceptionHandler.java)

`@RestControllerAdvice` 本质上也是 AOP 思想的一种体现：

```java
@Slf4j
@RestControllerAdvice  // ⚡ AOP 思想：统一处理 Controller 层异常
public class GlobalExceptionHandler {

    @ExceptionHandler
    public Result handleException(Exception e) {
        log.error("发生异常: ", e);
        return Result.error("服务器发生异常，请稍后再试");
    }

    @ExceptionHandler
    public Result handleDuplicateKeyException(DuplicateKeyException e) {
        // 处理数据库唯一键冲突
        String msg = e.getMessage();
        int i = msg.indexOf("Duplicate entry");
        String errMsg = msg.substring(i);
        String[] arr = errMsg.split(" ");
        return Result.error(arr[2] + "已存在，请勿重复添加");
    }

    @ExceptionHandler
    public Result handleBusinessException(BusinessException e) {
        log.error("业务异常: {}", e.getMessage());
        return Result.error(e.getMessage());
    }
}
```

**与 AOP 的关联**：
- `@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`
- Spring 底层通过 AOP 机制为所有 Controller 织入异常处理逻辑
- 将 **异常处理** 这个横切关注点从 Controller 中剥离出来

### 7.2 拦截器 [`TokenInterceptor`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/interceptor/TokenInterceptor.java)

拦截器虽然不属于 Spring AOP 的范畴（它基于 Servlet Filter 机制），但同样体现了 AOP 的"横切关注点分离"思想：

```java
@Component
public class TokenInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request,
                            HttpServletResponse response,
                            Object handler) throws Exception {
        // 登录校验逻辑（横切关注点）
        String token = request.getHeader("token");
        if (token == null || token.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        // 解析 Token，获取用户 ID 存入 ThreadLocal
        Claims claims = JwtUtils.parseJWT(token);
        Integer empId = (Integer) claims.get("id");
        CurrentHolder.setCurrentId(empId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                               HttpServletResponse response,
                               Object handler, Exception ex) {
        // 清理 ThreadLocal，防止内存泄漏
        CurrentHolder.remove();
    }
}
```

**AOP 思想体现**：
- **登录校验** 是横切关注点，从业务 Controller 中分离到了拦截器
- `preHandle` 相当于 `@Before` 通知
- `afterCompletion` 相当于 `@After` 通知

### 7.3 ThreadLocal [`CurrentHolder`](tlias-web-management/src/main/java/com/lcx/util/CurrentHolder.java)

```java
public class CurrentHolder {
    private static final ThreadLocal<Integer> CURRENT_LOCAL = new ThreadLocal<>();

    public static void setCurrentId(Integer employeeId) {
        CURRENT_LOCAL.set(employeeId);
    }

    public static Integer getCurrentId() {
        return CURRENT_LOCAL.get();
    }

    public static void remove() {
        CURRENT_LOCAL.remove();
    }
}
```

**作用**：在同一请求线程中传递用户 ID（`TokenInterceptor` → `OperationLogAspect`），避免频繁查询数据库。

---

## 8. 总结

### 8.1 本项目 AOP 架构全景

```
                          ┌─────────────────────────────┐
                          │    HTTP 请求                 │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │  TokenInterceptor (拦截器)   │
                          │  - 登录校验 (preHandle)      │
                          │  - 将用户ID存入 ThreadLocal  │
                          │  - 清除 ThreadLocal (after)  │
                          └─────────────┬───────────────┘
                                        │ 放行
                          ┌─────────────▼───────────────┐
                          │  @Around (OperationLogAspect)│
                          │  - 记录开始时间               │
                          │  - 执行目标方法               │
                          │  - 计算耗时、记录参数/返回值   │
                          │  - 写入 operate_log 表        │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │  Controller 业务方法          │
                          │  (如 DeptController.add)     │
                          └─────────────┬───────────────┘
                                        │
                          ┌─────────────▼───────────────┐
                          │  @RestControllerAdvice       │
                          │  (GlobalExceptionHandler)    │
                          │  - 统一异常处理               │
                          └─────────────────────────────┘
```

### 8.2 AOP 的优缺点

| 优点 | 缺点 |
|------|------|
| ✅ 减少重复代码，提高复用性 | ❌ 增加调试复杂度（执行流程不直观） |
| ✅ 关注点分离，业务逻辑更纯粹 | ❌ 不当使用可能导致意外拦截（切入点表达式过于宽泛） |
| ✅ 提高可维护性（修改日志只需改一处） | ❌ 对性能有轻微影响（动态代理开销） |
| ✅ 灵活配置（通过注解控制哪些方法需要增强） | ❌ 学习曲线较陡（需理解代理机制、切入点语法） |

### 8.3 学习建议

1. **从 `@Around` 入手**：最强大、最灵活的通知类型，掌握它就能应对大部分场景
2. **善用注解式切入点**：如 `@annotation(MyAnnotation)`，比 `execution` 更易维护
3. **注意 ThreadLocal 内存泄漏**：务必在请求结束时调用 `remove()`
4. **理解 AOP 的局限性**：AOP 只能增强 Spring 容器管理的 Bean，私有方法无法被拦截

---

> **相关文档**：[三层架构讲解](doc/三层架构讲解.md) | [增删改查逻辑与原理](doc/增删改查逻辑与原理.md) | [Cookie-Session-Token与登录校验详解](doc/Cookie-Session-Token与登录校验详解.md) | [MySQL分页查询与分页插件详解](doc/MySQL分页查询与分页插件详解.md) | [Tlias员工管理系统后端总结](doc/Tlias员工管理系统后端总结.md)
