# Bean 详解与第三方 Bean 配置

## 一、什么是 Bean？

**Bean** 是 Spring 框架中最核心的概念——它指代由 Spring IoC（Inversion of Control，控制反转）容器**创建、组装并管理生命周期**的 Java 对象。

传统方式下，程序员通过 `new` 关键字手动创建对象：

```java
DeptService deptService = new DeptServiceImpl();
```

而在 Spring 中，对象的创建权**反转**给了 IoC 容器：

```java
@Service          // 告诉 Spring：这个类由你来创建实例并管理
public class DeptServiceImpl implements DeptService {
    // ...
}
```

Spring 容器负责创建 `DeptServiceImpl` 的实例（即 Bean），并在需要的地方自动注入。

---

## 二、Bean 的管理

### 2.1 IoC 容器

Spring IoC 容器的核心接口是 `ApplicationContext`，启动时它会：

1. **扫描**指定包路径下的所有类
2. **识别**带有 `@Component` 及其派生注解的类
3. **创建**这些类的实例（Bean）
4. **管理** Bean 的整个生命周期（创建 → 初始化 → 使用 → 销毁）

本项目启动入口：

```java
@SpringBootApplication   // 包含 @ComponentScan，默认扫描当前包及其子包
public class TliasWebManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(TliasWebManagementApplication.class, args);
        // ↑ 此时 IoC 容器启动，所有 Bean 被创建
    }
}
```

### 2.2 声明 Bean 的方式

#### 方式一：组件扫描注解（最常见）

Spring 提供了四个注解，用于在不同层次声明 Bean：

| 注解 | 使用位置 | 本项目示例 |
|------|---------|-----------|
| `@Component` | 通用组件 | `TokenInterceptor` |
| `@Service` | Service 层 | `DeptServiceImpl`, `EmpServiceImpl`, `ClazzServiceImpl`, `StudentServiceImpl` |
| `@Controller` / `@RestController` | Controller 层 | `DeptController`, `EmpController`, `LoginController` 等 6 个控制器 |
| `@Repository` | Mapper 层（通常被 MyBatis 的 `@Mapper` 替代） | — |
| `@Configuration` | 配置类 | `WebMvcConfig` |
| `@RestControllerAdvice` | 全局异常处理 | `GlobalExceptionHandler` |
| `@Aspect` + `@Component` | AOP 切面 | `OperationLogAspect` |

> **`@Repository` vs `@Mapper`**：本项目 Mapper 接口使用 MyBatis 的 `@Mapper` 注解，它同样会被 Spring 扫描并创建代理 Bean。`@Repository` 是 Spring 的原生注解，除声明 Bean 外还提供持久化异常转换。

示例——`@Service` 声明业务层 Bean：

```java
@Service                        // → Spring 为 DeptServiceImpl 创建 Bean，默认名称 "deptServiceImpl"
public class DeptServiceImpl implements DeptService {
    @Autowired
    private DeptMapper deptMapper;  // DI：自动注入 Mapper Bean
}
```

#### 方式二：@Bean 注解（适用于第三方类）

见下文第四章「第三方 Bean 的配置」。

### 2.3 依赖注入（DI）

声明 Bean 后，通过 DI 将其注入到需要的地方：

| 注入方式 | 注解 | 说明 |
|---------|------|------|
| 字段注入 | `@Autowired` | Spring 自动按类型匹配注入 |
| 构造器注入 | 构造器参数 + `@Autowired` | **推荐**，保证不可变性和测试便利性 |
| Setter 注入 | Setter 方法 + `@Autowired` | 可选依赖时使用 |

本项目使用字段注入（简洁）：

```java
@RestController
@RequestMapping("/depts")
public class DeptController {
    @Autowired
    private DeptService deptService;  // IoC 容器将 DeptServiceImpl Bean 注入进来
}
```

### 2.4 Bean 的获取

Spring 容器启动后，可以通过 `ApplicationContext` 获取 Bean：

```java
@SpringBootApplication
public class TliasWebManagementApplication {
    public static void main(String[] args) {
        ApplicationContext context = SpringApplication.run(...);
        DeptService bean = context.getBean(DeptService.class);  // 按类型获取
        DeptService bean2 = (DeptService) context.getBean("deptServiceImpl"); // 按名称获取
    }
}
```

---

## 三、Bean 的作用域（Scope）

### 3.1 作用域类型

| 作用域 | 关键字 | 说明 | 适用场景 |
|--------|--------|------|---------|
| **singleton** | `@Scope("singleton")` | **默认值**，整个容器只有一个实例 | 无状态 Bean（Controller、Service、Mapper） |
| **prototype** | `@Scope("prototype")` | 每次获取/注入都创建新实例 | 有状态的 Bean |
| **request** | `@Scope("request")` | 每个 HTTP 请求创建一个实例 | Web 请求上下文数据 |
| **session** | `@Scope("session")` | 每个 HTTP Session 创建一个实例 | 用户会话数据 |
| **application** | `@Scope("application")` | 每个 ServletContext 创建一个实例 | 全局共享数据 |

### 3.2 本项目中的 Bean 作用域

项目中**所有自定义 Bean 均为默认的 singleton 作用域**，原因如下：

- **Controller**：无状态，每个请求通过参数传递数据
- **Service**：无状态，只封装业务方法，不持有请求相关状态
- **Mapper**：MyBatis 代理对象，无状态
- **Interceptor / Aspect**：无状态，逻辑处理不依赖实例变量

```java
@Service
@Scope("singleton")    // 默认值，可省略
public class EmpServiceImpl implements EmpService {
    // 不要在这里定义有状态的成员变量！
}
```

### 3.3 什么时候需要用 prototype？

当 Bean 持有**状态**时，需要设为 prototype。例如：

```java
@Component
@Scope("prototype")
public class ReportGenerator {
    private List<String> errors = new ArrayList<>();  // 状态数据
    
    public void addError(String err) { errors.add(err); }
    public List<String> getErrors() { return errors; }
}
```

每次注入 `ReportGenerator` 都会得到新实例，避免多个调用方共享同一份 `errors` 数据。

### 3.4 singleton 与 prototype 的对比

| 特性 | singleton | prototype |
|------|-----------|-----------|
| 实例数量 | 1 个 | 每次调用新建 |
| 默认值 | 是 | 否 |
| 懒加载 | 默认立即加载（可配置 `@Lazy`） | 懒加载 |
| 生命周期管理 | 全生命周期由容器管理 | 创建后容器不再管理销毁 |
| 性能 | 高（复用） | 低（频繁创建） |
| 线程安全 | 需要确保无状态或同步 | 天然线程安全（每个线程独有实例） |

---

## 四、第三方 Bean 的代码配置和原理

### 4.1 什么是第三方 Bean？

**第三方 Bean** 指那些**不是由我们项目自己编写、而是来自外部 JAR 包**的类。例如数据库连接池 `DataSource`、MyBatis 的 `SqlSessionFactory`、分页插件 `PageHelper` 等。

这些类我们无法修改其源码添加 `@Component`，因此需要用另一种方式声明为 Bean——**`@Bean` 注解**。

### 4.2 使用 @Bean 声明第三方 Bean

在 `@Configuration` 配置类中，通过 `@Bean` 注解将方法的返回值注册为 Bean。

#### 语法模板

```java
@Configuration
public class SomeConfig {
    @Bean
    public SomeThirdPartyClass someBean() {
        return new SomeThirdPartyClass(/* 构造参数 */);
    }
}
```

- 方法名即为 Bean 的名称（默认）
- 返回类型即为 Bean 的类型
- 方法体内可以执行初始化逻辑

### 4.3 本项目中的第三方 Bean

本项目中的第三方组件大多通过 **Spring Boot Starter 自动配置** 完成，自动配置的本质也是在 `@Configuration` 类中使用 `@Bean` 声明。

#### ① DataSource（数据源）

依赖：`spring-boot-starter-jdbc` 和 `mysql-connector-j`

```yaml
# application.yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/tlias
    username: root
    password: "000000"
    driver-class-name: com.mysql.cj.jdbc.Driver
```

Spring Boot 的 `DataSourceAutoConfiguration` 会在底层执行等效代码：

```java
@Configuration
@ConditionalOnClass(DataSource.class)
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
                .build();  // 创建 HikariCP 连接池（Spring Boot 默认）
    }
}
```

#### ② SqlSessionFactory（MyBatis 核心）

依赖：`mybatis-spring-boot-starter`

MyBatis 自动配置类 `MybatisAutoConfiguration` 会创建：

```java
@Bean
@ConditionalOnMissingBean
public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
    SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
    factory.setDataSource(dataSource);
    factory.setMapperLocations(/* 从 yaml 读取 mapper-locations */);
    // ↑ 对应配置：mybatis.mapper-locations=classpath:.../*.xml
    return factory.getObject();
}
```

#### ③ PageHelper 分页插件

依赖：`pagehelper-spring-boot-starter`

PageHelper Starter 自动配置会创建：

```java
@Configuration
public class PageHelperAutoConfiguration {
    @Bean
    public PageInterceptor pageInterceptor(Properties properties) {
        PageInterceptor interceptor = new PageInterceptor();
        interceptor.setProperties(properties);
        return interceptor;
    }
}
```

随后在 MyBatis 配置中通过 `@Bean` 将其注册到 `SqlSessionFactory`。

#### ④ JWT 工具类的使用

本项目使用 `JwtUtils` 处理 JWT，但它是**自定义工具类**而非第三方 Bean。它是通过静态方法直接调用的（非容器管理）：

```java
public class JwtUtils {
    public static Claims parseJWT(String jwt) { ... }
    public static String generateJwt(Map<String, Object> claims) { ... }
}
// 使用：JwtUtils.parseJWT(token);
```

如果需要将其作为 Spring Bean 管理，可以创建一个 `@Configuration` 类：

```java
@Configuration
public class JwtConfig {
    @Bean
    public JwtUtils jwtUtils() {
        return new JwtUtils();  // 让 Spring 管理 JwtUtils 的生命周期
    }
}
```

> **但本例中 JwtUtils 只有静态方法，没有状态，无需声明为 Bean**。只有那些需要容器管理依赖或生命周期的第三方类才适合声明为 Bean。

### 4.4 如果想在本项目中手动配置第三方 Bean

假设要手动配置（而非依赖自动配置），可以这样做：

#### 示例：手动配置 DataSource 和 SqlSessionFactory

```java
@Configuration
public class MyBatisConfig {

    @Bean
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:mysql://localhost:3306/tlias");
        ds.setUsername("root");
        ds.setPassword("000000");
        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        return ds;
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        factory.setMapperLocations(
            new PathMatchingResourcePatternResolver()
                .getResources("classpath:com/lcx/tlias_web_management/mapper/*.xml")
        );
        return factory.getObject();
    }

    @Bean
    public MapperScannerConfigurer mapperScannerConfigurer() {
        MapperScannerConfigurer scanner = new MapperScannerConfigurer();
        scanner.setBasePackage("com.lcx.tlias_web_management.mapper");
        return scanner;
    }
}
```

> 上述代码与 Spring Boot 自动配置的效果等价。实际项目中直接使用 Starter 自动配置更简洁。

### 4.5 @Bean 注解的原理

`@Bean` 的工作原理分为四个步骤：

```
IoC 容器启动
    |
    v
1. 解析 @Configuration 类
    |   \u2514\u2500\u2500 CGLIB 创建配置类的代理子类
    |
    v
2. 调用 @Bean 方法
    |   \u2514\u2500\u2500 当方法被调用时，代理类会先检查容器中是否已有该 Bean
    |
    v
3. 注册到容器
    |   \u2514\u2500\u2500 返回的对象被注册到 Spring 容器（BeanDefinitionRegistry）
    |
    v
4. 依赖注入
    \u2514\u2500\u2500 其他 Bean 通过 @Autowired 注入该 @Bean 返回的实例
```

**关键细节**：

- `@Configuration` 中的 `@Bean` 方法会被 CGLIB 代理，保证每次返回**同一个 singleton 实例**
- 如果 `@Bean` 方法声明了 `@Scope("prototype")`，则代理会**每次创建新实例**
- `@Bean` 方法可以声明参数，Spring 会自动从容器中查找匹配的 Bean 注入

```java
@Bean
public SqlSessionFactory sqlSessionFactory(DataSource dataSource) {
    //          \u2191 DataSource 参数自动注入容器中的 DataSource Bean
    SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
    factory.setDataSource(dataSource);
    return factory.getObject();
}
```

### 4.6 @Component vs @Bean

| 对比维度 | `@Component` | `@Bean` |
|---------|-----------|-------|
| 使用位置 | 类上 | 方法上 |
| 所属类 | 普通 Java 类 | `@Configuration` 类 |
| 控制权 | 全权交给 Spring | 开发者手动 `new`，可执行初始化 |
| 适用范围 | 自己编写的类 | 第三方 JAR 包中的类 |
| 灵活性 | 固定构造逻辑 | 灵活，可传参、可执行复杂初始化 |

```java
// 自己的类 \u2192 @Component
@Service
public class DeptServiceImpl implements DeptService { ... }

// 第三方类 \u2192 @Bean
@Configuration
public class AppConfig {
    @Bean
    public PageInterceptor pageInterceptor() {
        PageInterceptor interceptor = new PageInterceptor();
        interceptor.setProperties(someProps);       // 自定义初始化
        return interceptor;
    }
}
```

---

## 五、总结

### Bean 管理核心要点

1. **Bean = Spring 容器管理的对象**
2. **声明方式**：
   - 自己写的类 \u2192 `@Component` / `@Service` / `@Controller` 等
   - 第三方类 \u2192 `@Configuration` + `@Bean`
3. **作用域**：绝大多数情况用默认的 `singleton`，有状态时用 `prototype`
4. **DI（依赖注入）**：`@Autowired` 按类型注入

### 第三方 Bean 配置核心要点

1. 第三方类无法加 `@Component`，需通过 `@Bean` 在配置类中声明
2. Spring Boot Starter 本质上是预置了一系列 `@Configuration` + `@Bean`
3. `@Bean` 方法名 = Bean 名称，返回值 = Bean 类型，方法体 = 初始化逻辑
4. `@Bean` 可以自动注入容器中的其他 Bean（通过方法参数）

### 本项目 Bean 一览

| Bean | 声明方式 | 作用域 | 说明 |
|------|---------|--------|------|
| DeptController / EmpController 等 | `@RestController` | singleton | Controller 层 |
| DeptServiceImpl / EmpServiceImpl 等 | `@Service` | singleton | Service 层 |
| DeptMapper / EmpMapper 等 | `@Mapper` | singleton | MyBatis Mapper |
| TokenInterceptor | `@Component` | singleton | 拦截器 |
| WebMvcConfig | `@Configuration` | singleton | MVC 配置 |
| OperationLogAspect | `@Component` + `@Aspect` | singleton | AOP 切面 |
| GlobalExceptionHandler | `@RestControllerAdvice` | singleton | 异常处理 |
| DataSource | 自动配置 `@Bean` | singleton | HikariCP 连接池 |
| SqlSessionFactory | 自动配置 `@Bean` | singleton | MyBatis 核心 |
| PageInterceptor | 自动配置 `@Bean` | singleton | 分页插件 |
