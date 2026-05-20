# Spring Boot 起步依赖与自动配置详解

## 一、引言

本项目 	lias-web-management 的 pom.xml 中包含多个 Spring Boot Starter 依赖：

`xml
spring-boot-starter-web          // Web 开发（Tomcat + Spring MVC + Jackson）
mybatis-spring-boot-starter      // MyBatis 集成
spring-boot-starter-aop           // AOP 支持
pagehelper-spring-boot-starter    // 分页插件
spring-boot-starter-actuator      // 健康检查/监控
`

为什么只需要引入一个 spring-boot-starter-web 就能拥有完整的 Web 开发能力？
为什么引入 mybatis-spring-boot-starter 后，DataSource、SqlSessionFactory 等组件就自动可用？

这一切都源于 Spring Boot 的两大核心机制：**起步依赖（Starter）** 与 **自动配置（Auto-Configuration）**。

---

## 二、起步依赖（Starter）原理

### 2.1 传统 Maven 依赖管理的痛点

在没有 Spring Boot 之前，搭建一个 Spring MVC Web 项目需要手动引入大量依赖，且版本必须兼容：

`xml
<!-- 传统 SSM 项目中需要手动维护十几个依赖和版本 -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
    <version>5.3.30</version>      <!-- 需要自己指定版本 -->
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-jdbc</artifactId>
    <version>5.3.30</version>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.2</version>
</dependency>
<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-core</artifactId>
    <version>10.1.19</version>
</dependency>
<!-- 还需引入 spring-web, spring-beans, spring-context, ... 等十多个传递依赖 -->
`

开发人员需要做三件事：
1. 找全所有必需的依赖坐标
2. 确保版本互相兼容
3. 排除冲突的传递依赖

任何一个环节出错，项目都无法启动。

### 2.2 Starter 的解决思路

**Starter 的本质是一个 Maven POM 项目**，它通过 <dependencyManagement> 和 <dependencies> 将一组相互关联的依赖打包在一起。开发人员只需引入 **一个** starter，所有必需的传递依赖会自动被 Maven 拉取。

### 2.3 层次一：spring-boot-starter-parent（版本仲裁）

`xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.14</version>
</parent>
`

spring-boot-starter-parent 的父 POM 是 spring-boot-dependencies，其中通过 <dependencyManagement> 声明了上千个经过**兼容性测试**的依赖版本号：

`xml
<!-- spring-boot-dependencies 中的片段 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-webmvc</artifactId>
            <version>6.2.x</version>  <!-- Spring Boot 3.5.14 对应的版本 -->
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.17.x</version>
        </dependency>
        <!-- 上千个经过测试的依赖版本 -->
    </dependencies>
</dependencyManagement>
`

因此，在子项目中引入依赖时**不需要写 version**，由父 POM 统一管理：

`xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- 无需 version，由 spring-boot-starter-parent 管理 -->
</dependency>
`

### 2.4 层次二：具体的 Starter 包

以 spring-boot-starter-web 为例，它的内部 POM 定义了 Web 开发所需的所有传递依赖：

`xml
<!-- spring-boot-starter-web 的 pom.xml（示意） -->
<dependencies>
    <!-- Spring MVC 核心 -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-webmvc</artifactId>
    </dependency>
    <!-- 内嵌 Tomcat 服务器 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-tomcat</artifactId>
    </dependency>
    <!-- JSON 处理 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-json</artifactId>
    </dependency>
    <!-- 核心 Starter（日志、自动配置等） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <!-- 参数校验 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
</dependencies>
`

引入 spring-boot-starter-web → Maven 递归解析 → 同时引入 spring-webmvc、	omcat-embed-core、jackson-databind、spring-boot-starter 等十几个依赖。

### 2.5 传递依赖树验证

可以在项目目录下执行以下命令查看 starter 的传递依赖：

`ash
mvn dependency:tree
`

部分输出示意（依赖树）：

`
tlias-web-management:jar:0.0.1-SNAPSHOT
├─ org.springframework.boot:spring-boot-starter-web:jar:3.5.14
│  ├─ org.springframework.boot:spring-boot-starter:jar:3.5.14
│  │  ├─ org.springframework.boot:spring-boot:jar:3.5.14
│  │  ├─ org.springframework.boot:spring-boot-autoconfigure:jar:3.5.14
│  │  ├─ org.springframework.boot:spring-boot-starter-logging:jar:3.5.14
│  │  └─ ...
│  ├─ org.springframework.boot:spring-boot-starter-json:jar:3.5.14
│  │  ├─ com.fasterxml.jackson.core:jackson-databind:jar:2.17.x
│  │  └─ ...
│  ├─ org.springframework.boot:spring-boot-starter-tomcat:jar:3.5.14
│  │  ├─ org.apache.tomcat.embed:tomcat-embed-core:jar:10.1.x
│  │  └─ ...
│  └─ org.springframework:spring-webmvc:jar:6.2.x
├─ org.mybatis.spring.boot:mybatis-spring-boot-starter:jar:3.0.5
│  ├─ org.mybatis.spring.boot:mybatis-spring-boot-autoconfigure:jar:3.0.5
│  ├─ org.mybatis:mybatis:jar:3.5.x
│  ├─ org.mybatis:mybatis-spring:jar:3.0.x
│  └─ ...
└─ com.github.pagehelper:pagehelper-spring-boot-starter:jar:1.4.6
   └─ com.github.pagehelper:pagehelper:jar:5.x
`

### 2.6 本项目 Starter 清单

| Starter | 提供的核心功能 |
|---------|--------------|
| spring-boot-starter-web | Spring MVC、内嵌 Tomcat、JSON 序列化、REST 开发 |
| spring-boot-starter-aop | AOP 编程支持（面向切面） |
| spring-boot-starter-actuator | 应用监控与健康检查端点 |
| spring-boot-starter-test | JUnit、Mockito 等测试框架 |
| mybatis-spring-boot-starter | MyBatis 集成（含 DataSource 自动配置） |
| pagehelper-spring-boot-starter | MyBatis 分页插件 |

### 2.7 Starter 命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| **Spring Boot 官方 Starter** | spring-boot-starter-* | spring-boot-starter-web |
| **非官方/自定义 Starter** | *-spring-boot-starter | mybatis-spring-boot-starter, pagehelper-spring-boot-starter |

---

## 三、自动配置的原理和代码实现方案

### 3.1 什么是自动配置？

**自动配置**是指 Spring Boot 根据项目 classpath 中的依赖和环境配置，**自动创建并注册**所需的 Spring Bean。

例如：
- classpath 中有 DataSource 相关类 + pplication.yaml 配置了数据库连接信息 → 自动创建 DataSource、SqlSessionFactory、SqlSessionTemplate 等 Bean
- classpath 中有 spring-webmvc → 自动配置 DispatcherServlet、ViewResolver、MessageConverter 等

### 3.2 自动配置的核心条件

`
自动配置生效条件 = 依赖存在（classpath 检测） + 配置存在（属性绑定） + 用户未自定义（@ConditionalOnMissingBean）
`

### 3.3 代码实现方案：@Conditional 条件注解体系

自动配置类通过 Spring 的 @Conditional 体系实现**有条件的 Bean 注册**：

| 条件注解 | 作用 |
|---------|------|
| @ConditionalOnClass | classpath 中存在指定类时才生效 |
| @ConditionalOnMissingClass | classpath 中不存在指定类时才生效 |
| @ConditionalOnBean | 容器中已存在指定 Bean 时才生效 |
| @ConditionalOnMissingBean | 容器中不存在指定 Bean 时才生效（**用户优先**） |
| @ConditionalOnProperty | 配置文件中存在指定属性时才生效 |
| @ConditionalOnResource | 资源文件存在时才生效 |
| @ConditionalOnWebApplication | 当前是 Web 应用时才生效 |
| @ConditionalOnExpression | SpEL 表达式为 true 时才生效 |

### 3.4 一个具体的自动配置示例

以本项目中的 DataSource 自动配置为例——当引入 mybatis-spring-boot-starter 后：

`java
// 这是 Spring Boot 内部 DataSourceAutoConfiguration 的简化示意

@Configuration
@ConditionalOnClass(DataSource.class)           // 条件①：classpath 中有 DataSource
@EnableConfigurationProperties(DataSourceProperties.class) // 条件②：绑定 yaml 配置
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(DataSource.class)  // 条件③：用户没有自己创建 DataSource Bean
    @ConditionalOnProperty(prefix = "spring.datasource", name = "url") // 条件④：配置了 url
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)     // Spring Boot 默认使用 HikariCP
                .build();
    }
}
`

对应 pplication.yaml 中的配置：

`yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/tlias       # 条件④ 满足
    username: root
    password: "000000"
    driver-class-name: com.mysql.cj.jdbc.Driver
`

四个条件全部满足 → DataSource Bean 被自动创建。

### 3.5 用户覆盖自动配置

如果用户想用自己的 DataSource 覆盖自动配置，只需在 @Configuration 类中手动声明：

`java
@Configuration
public class MyDataSourceConfig {
    @Bean
    public DataSource dataSource() {
        // 用户自定义的数据源
        DruidDataSource ds = new DruidDataSource();
        ds.setUrl("jdbc:mysql://localhost:3306/tlias");
        // ...
        return ds;
    }
}
`

由于 @ConditionalOnMissingBean 的存在，Spring Boot 的自动配置会自动失效，**用户自定义的 Bean 优先级更高**。

### 3.6 自动配置的其他实现形式

除了通过 @ConditionalOnMissingBean 让用户覆盖，还可以通过以下方式干预：

| 方式 | 说明 |
|------|------|
| spring.autoconfigure.exclude | 排除指定的自动配置类 |
| @EnableAutoConfiguration(exclude = {...}) | 在启动类上排除 |
| pplication.yaml 中配置 spring.autoconfigure.exclude | 通过配置文件排除 |

`yaml
# 排除指定的自动配置
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
      - org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration
`

---

## 四、Spring Boot 自动配置的源码实现原理（剥洋葱法）

下面从 @SpringBootApplication 开始，层层剥开，深入 Spring Boot 自动配置的源码机制。

`
洋葱结构示意图：

  第0层（最外层）：@SpringBootApplication
  第1层：@EnableAutoConfiguration
  第2层：@Import(AutoConfigurationImportSelector.class)
  第3层：AutoConfigurationImportSelector.selectImports()
  第4层：SpringFactoriesLoader.loadFactoryNames()
  第5层：META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 文件
  第6层：自动配置类解析与条件评估
`

---

### 第0层：@SpringBootApplication

#### 0.1 源码

`java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration          // ← 自动配置的核心入口
@ComponentScan(excludeFilters = {  // ← 组件扫描
    @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
    @Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {
    // ...
}
`

#### 0.2 作用

@SpringBootApplication 实际上是一个**组合注解**，等效于：

`java
@SpringBootConfiguration   // 等同于 @Configuration，标识当前类是配置类
@EnableAutoConfiguration   // 开启自动配置
@ComponentScan             // 包扫描，默认扫描当前包及其子包
`

一键整合了配置、自动配置、组件扫描三大功能。

---

### 第1层：@EnableAutoConfiguration

#### 1.1 源码

`java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage              // 注册自动配置包的名称
@Import(AutoConfigurationImportSelector.class) // ← 核心：导入选择器
public @interface EnableAutoConfiguration {
    String ENABLED_OVERRIDE_PROPERTY = "spring.boot.enableautoconfiguration";
    Class<?>[] exclude() default {};
    String[] excludeName() default {};
}
`

#### 1.2 核心作用

通过 @Import(AutoConfigurationImportSelector.class) 将 AutoConfigurationImportSelector 导入容器。这个类是自动配置的**总调度器**。

---

### 第2层：@Import(AutoConfigurationImportSelector.class)

@Import 是 Spring 框架提供的注解，用于向容器中导入额外的配置类。Spring 处理 @Import 有三种模式：

| 模式 | 说明 |
|------|------|
| 导入普通配置类 | @Import(MyConfig.class) → 直接注册 |
| 导入 ImportSelector | @Import(MySelector.class) → 调用 selectImports() 获取类名数组 |
| 导入 ImportBeanDefinitionRegistrar | @Import(MyRegistrar.class) → 手动注册 BeanDefinition |

AutoConfigurationImportSelector 实现了 DeferredImportSelector（继承自 ImportSelector），属于第二种模式。

---

### 第3层：AutoConfigurationImportSelector.selectImports()

#### 3.1 核心方法

`java
public class AutoConfigurationImportSelector implements DeferredImportSelector, BeanClassLoaderAware, ... {

    @Override
    public String[] selectImports(AnnotationMetadata annotationMetadata) {
        if (!isEnabled(annotationMetadata)) {  // 检查是否启用
            return NO_IMPORTS;
        }
        // 获取所有自动配置类的全限定名
        AutoConfigurationEntry autoConfigurationEntry = getAutoConfigurationEntry(annotationMetadata);
        return StringUtils.toStringArray(autoConfigurationEntry.getConfigurations());
    }

    protected AutoConfigurationEntry getAutoConfigurationEntry(AnnotationMetadata annotationMetadata) {
        // 1. 获取 @EnableAutoConfiguration 中的 exclude / excludeName
        AnnotationAttributes attributes = getAttributes(annotationMetadata);

        // 2. 从 spring.factories 或 AutoConfiguration.imports 文件中加载
        List<String> configurations = getCandidateConfigurations(annotationMetadata, attributes);

        // 3. 去重
        configurations = removeDuplicates(configurations);

        // 4. 排除用户指定的不需要的自动配置
        Set<String> exclusions = getExclusions(annotationMetadata, attributes);
        configurations.removeAll(exclusions);

        return new AutoConfigurationEntry(configurations, exclusions);
    }
}
`

#### 3.2 关键步骤

| 步骤 | 方法 | 作用 |
|------|------|------|
| 1 | isEnabled() | 检查 spring.boot.enableautoconfiguration 属性（默认 true） |
| 2 | getCandidateConfigurations() | 加载自动配置类的全限定名列表 |
| 3 | emoveDuplicates() | 去重 |
| 4 | getExclusions() | 读取 exclude 和 excludeName 属性 |
| 5 | ilter() | 应用 @Conditional 条件过滤（延时执行） |

---

### 第4层：SpringFactoriesLoader.loadFactoryNames()

#### 4.1 源码

`java
protected List<String> getCandidateConfigurations(AnnotationMetadata metadata, AnnotationAttributes attributes) {
    List<String> configurations = SpringFactoriesLoader.loadFactoryNames(
            getSpringFactoriesLoaderFactoryClass(), // EnableAutoConfiguration.class
            getBeanClassLoader());
    Assert.notEmpty(configurations, ...);
    return configurations;
}
`

#### 4.2 核心机制

SpringFactoriesLoader 会扫描 classpath 下所有 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 文件，读取其中的自动配置类全限定名。

**注意**：在 Spring Boot 2.7+ 开始，spring.factories 已废弃，改为使用 AutoConfiguration.imports 文件。但在 Spring Boot 3.x 中仍保留了对两者的兼容支持。

---

### 第5层：META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

这是关键文件，位于 spring-boot-autoconfigure 包中。以 Spring Boot 3.5.x 为例，该文件中列出了所有内置自动配置类：

`
# 文件路径：spring-boot-autoconfigure-3.5.x.jar!
#   /META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration
org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration
org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration
org.springframework.boot.autoconfigure.aop.AopAutoConfiguration
...（共 100+ 个自动配置类）
`

这些自动配置类默认**全部被加载**，但不会全部生效——每个自动配置类内部通过 @Conditional 注解控制是否真正创建 Bean。

---

### 第6层：自动配置类解析与条件评估

#### 6.1 自动配置类的典型结构

`java
@AutoConfiguration                           // Spring Boot 3.x 引入，等价于 @Configuration
@ConditionalOnClass(DataSource.class)         // 条件①：classpath 中有 javax.sql.DataSource
@EnableConfigurationProperties(DataSourceProperties.class) // 绑定属性
public class DataSourceAutoConfiguration {

    @Configuration
    @Conditional(DataSourceCreationCondition.class) // 内嵌配置类
    static class EmbeddedDatabaseConfiguration {
        @Bean
        @ConditionalOnMissingBean(DataSource.class)
        DataSource dataSource(DataSourceProperties properties) {
            // 创建嵌入式数据源（H2、Derby、HSQL）
        }
    }

    @Configuration
    @ConditionalOnProperty(prefix = "spring.datasource", name = "url") // 配置了 url
    static class PooledDataSourceConfiguration {
        @Bean
        @ConditionalOnMissingBean(DataSource.class)
        DataSource dataSource(DataSourceProperties properties) {
            // 创建连接池数据源（HikariCP）
        }
    }
}
`

#### 6.2 条件评估过程

`
所有的自动配置类被加载到容器
    │
    ▼
Spring 尝试创建每个自动配置类中的 @Bean 方法
    │
    ▼
遇到 @ConditionalOnMissingBean → 检查容器中是否已有该类型的 Bean
    │          │有                          │无
    │          ▼                            ▼
    │        跳过不创建                    正常创建
    │
    ▼
遇到 @ConditionalOnClass → 检查 classpath 中是否有指定类
    │          │有                          │无
    │          ▼                            ▼
    │        正常创建                      跳过不创建
    │
    ▼
遇到 @ConditionalOnProperty → 检查 application.yaml 中是否有指定属性
    │          │有             │无
    │          ▼               ▼
    │        正常创建         跳过不创建
`

#### 6.3 条件评估不通过的处理

条件不通过时，自动配置类不会报错——Spring 内部通过 ConditionEvaluator 优雅跳过，相当于这个 @Bean 方法从未存在过。

---

### 完整自动配置流程图

`
┌─────────────────────────────────────────────────────────┐
│  @SpringBootApplication                                  │
│    ├─ @SpringBootConfiguration  → 声明配置类             │
│    ├─ @EnableAutoConfiguration  → 开启自动配置           │
│    │    └─ @Import(AutoConfigurationImportSelector.class) │
│    │         └─ selectImports()                          │
│    │              └─ getCandidateConfigurations()        │
│    │                   └─ SpringFactoriesLoader          │
│    │                        └─ 扫描 AutoConfiguration.imports │
│    │                             → 获得 100+ 自动配置类名   │
│    ├─ @ComponentScan          → 扫描用户 Bean              │
│    └─ main() → SpringApplication.run()                  │
│         └─ refreshContext() → 刷新容器                   │
│              └─ 逐个解析自动配置类 @Configuration         │
│                   └─ 每个 @Bean 上 @Conditional 评估      │
│                        ├─ 条件满足 → 创建 Bean           │
│                        └─ 条件不满足 → 跳过              │
└─────────────────────────────────────────────────────────┘
`

---

## 五、自定义 Starter 的实现步骤

### 5.1 场景分析

假设我们为本项目创建一个统一的**日志记录 Starter**，自动为所有 controller 方法记录调用日志——这与本项目中 OperationLogAspect 的功能类似，但我们要将其做成一个可复用的 Starter 包。

### 5.2 模块命名

`
tlias-log-spring-boot-starter      # Starter 模块（用户引入）
tlias-log-spring-boot-autoconfigure # 自动配置模块（Starter 内部依赖）
`

> 也可合并在一个模块中。这里采用分离方案，更接近官方做法。

### 5.3 步骤一：创建 Maven 项目结构

`
tlias-log-spring-boot-starter/
├── pom.xml
└── src/main/java/...
`

`xml
<!-- pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.lcx</groupId>
    <artifactId>tlias-log-spring-boot-starter</artifactId>
    <version>1.0.0</version>

    <dependencies>
        <!-- 引入自动配置模块 -->
        <dependency>
            <groupId>com.lcx</groupId>
            <artifactId>tlias-log-spring-boot-autoconfigure</artifactId>
            <version>1.0.0</version>
        </dependency>
    </dependencies>
</project>
`

**Starter 模块本身不含任何业务代码**，它的唯一作用是引入自动配置模块和其他必要的传递依赖。

### 5.4 步骤二：创建自动配置模块

`
tlias-log-spring-boot-autoconfigure/
├── pom.xml
└── src/main/java/com/lcx/log/
    ├── annotation/
    │   └── LogRecord.java
    ├── aspect/
    │   └── LogRecordAspect.java
    ├── properties/
    │   └── LogProperties.java
    └── config/
        └── LogAutoConfiguration.java
`

### 5.5 步骤三：编写自定义注解

`java
// annotation/LogRecord.java
package com.lcx.log.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogRecord {
    String value() default "";  // 日志描述
}
`

### 5.6 步骤四：编写切面实现

`java
// aspect/LogRecordAspect.java
package com.lcx.log.aspect;

import com.lcx.log.annotation.LogRecord;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;

@Slf4j
@Aspect
public class LogRecordAspect {

    @Around("@annotation(logRecord)")
    public Object around(ProceedingJoinPoint joinPoint, LogRecord logRecord) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        log.info("[LogStarter] 开始执行: {}, 描述: {}", methodName, logRecord.value());

        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long cost = System.currentTimeMillis() - start;

        log.info("[LogStarter] 执行完成: {}, 耗时: {}ms", methodName, cost);
        return result;
    }
}
`

### 5.7 步骤五：编写属性绑定类

`java
// properties/LogProperties.java
package com.lcx.log.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tlias.log")  // 绑定 tlias.log.* 配置
public class LogProperties {
    /** 是否启用日志切面 */
    private boolean enabled = true;

    /** 日志级别：INFO / DEBUG / WARN */
    private String level = "INFO";

    // getters & setters
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
}
`

### 5.8 步骤六：编写自动配置类

`java
// config/LogAutoConfiguration.java
package com.lcx.log.config;

import com.lcx.log.aspect.LogRecordAspect;
import com.lcx.log.properties.LogProperties;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration                          // 标识为自动配置类
@EnableConfigurationProperties(LogProperties.class) // 开启属性绑定
@ConditionalOnProperty(prefix = "tlias.log", name = "enabled", havingValue = "true", matchIfMissing = true)
public class LogAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(LogRecordAspect.class) // 用户未自定义时生效
    public LogRecordAspect logRecordAspect() {
        return new LogRecordAspect();
    }
}
`

### 5.9 步骤七：注册自动配置类

在 	lias-log-spring-boot-autoconfigure 模块中创建 SPI 文件。

`
src/main/resources/
└── META-INF/
    └── spring/
        └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
`

文件内容（一行一个自动配置类的全限定名）：

`
com.lcx.log.config.LogAutoConfiguration
`

这是 Spring Boot 3.x 的标准做法。如果是 Spring Boot 2.x，需要创建 META-INF/spring.factories：

`properties
# META-INF/spring.factories（Spring Boot 2.x 方式）
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.lcx.log.config.LogAutoConfiguration
`

### 5.10 步骤八：使用自定义 Starter

在其他 Spring Boot 项目中引入：

`xml
<dependency>
    <groupId>com.lcx</groupId>
    <artifactId>tlias-log-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
`

然后在需要记录日志的方法上使用 @LogRecord 注解：

`java
@RestController
@RequestMapping("/depts")
public class DeptController {
    @LogRecord("查询全部部门")
    @GetMapping
    public Result list() { ... }

    @LogRecord("删除部门")
    @DeleteMapping
    public Result delete(Integer id) { ... }
}
`

可通过 pplication.yaml 控制：

`yaml
tlias:
  log:
    enabled: true       # 是否启用（默认 true）
    level: DEBUG        # 日志级别（预留扩展）
`

### 5.11 自定义 Starter 的完整工程结构

`
tlias-log-spring-boot-starter/                 # Starter 模块（入口）
├── pom.xml                                    # 仅依赖 autoconfigure 模块
│
tlias-log-spring-boot-autoconfigure/           # 自动配置模块（核心逻辑）
├── pom.xml
├── src/main/java/com/lcx/log/
│   ├── annotation/
│   │   └── LogRecord.java                     # 自定义注解
│   ├── aspect/
│   │   └── LogRecordAspect.java               # 切面实现
│   ├── properties/
│   │   └── LogProperties.java                 # 属性绑定
│   └── config/
│       └── LogAutoConfiguration.java          # 自动配置类
└── src/main/resources/
    └── META-INF/
        └── spring/
            └── org.springframework.boot.autoconfigure.AutoConfiguration.imports  # SPI 注册文件
`

### 5.12 Starter 开发最佳实践

| 实践 | 说明 |
|------|------|
| **自动配置类命名** | XxxAutoConfiguration |
| **属性绑定类命名** | XxxProperties |
| **@ConditionalOnMissingBean** | 用户覆盖优先 |
| **spring.factories / AutoConfiguration.imports** | 必须正确注册 |
| **不需要写 @ComponentScan** | 自动配置类被 @Import 导入，不受扫描限制 |
| **配置项前缀** | 推荐使用团队/公司命名空间，如 	lias.* |
| **提供默认值** | 尽量让所有配置项都有 @Value 默认值或 matchIfMissing = true |
| **去除强制依赖** | 用 @ConditionalOnClass 让用户只在引入特定依赖时激活对应功能 |

---

## 六、总结

### 起步依赖（Starter）

`
核心思想：将一组兼容的依赖打包 → 用户只需引入一个坐标
实现方式：Maven 传递依赖 + spring-boot-starter-parent 版本仲裁
`

### 自动配置（Auto-Configuration）

`
核心思想：根据 classpath 和环境配置自动创建 Bean
实现方式：
  ① @EnableAutoConfiguration → @Import(AutoConfigurationImportSelector.class)
  ② → 扫描 META-INF/spring/.../AutoConfiguration.imports 文件
  ③ → 加载所有自动配置类
  ④ → 通过 @Conditional 体系有选择地创建 Bean
`

### 本项目中使用的 Starter 与对应的自动配置

| Starter | 生效的自动配置类 | 核心 Bean |
|---------|----------------|-----------|
| spring-boot-starter-web | WebMvcAutoConfiguration | DispatcherServlet, ViewResolver, MessageConverter |
| spring-boot-starter-web | JacksonAutoConfiguration | ObjectMapper |
| spring-boot-starter-web | DispatcherServletAutoConfiguration | DispatcherServlet |
| spring-boot-starter-web | HttpMessageConvertersAutoConfiguration | 消息转换器 |
| mybatis-spring-boot-starter | DataSourceAutoConfiguration | DataSource (HikariCP) |
| mybatis-spring-boot-starter | MybatisAutoConfiguration | SqlSessionFactory, SqlSessionTemplate |
| mybatis-spring-boot-starter | TransactionAutoConfiguration | PlatformTransactionManager |
| spring-boot-starter-aop | AopAutoConfiguration | AnnotationAwareAspectJAutoProxyCreator |
| pagehelper-spring-boot-starter | PageHelperAutoConfiguration | PageInterceptor |
| spring-boot-starter-actuator | EndpointAutoConfiguration | 健康检查端点 |

这些自动配置类协同工作，使得这个原本需要大量 XML 配置的项目仅靠 pplication.yaml 中的 27 行配置就能完整运行。
