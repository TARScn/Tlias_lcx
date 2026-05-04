# DeptController.java 代码错误修复计划

## 错误分析

### 文件路径
[`tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java)

### 发现的错误

| # | 行号 | 问题描述 | 严重程度 |
|---|------|---------|---------|
| 1 | 17 | 使用了 `RequestMethod.GET` 但缺少 `import org.springframework.web.bind.annotation.RequestMethod;` | ❌ 编译错误 |

### 详细说明

**错误 1 - 缺少 RequestMethod 导入**

- **位置**: [`DeptController.java:17`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java:17)
- **代码**: `@RequestMapping(value = "/depts", method = RequestMethod.GET)`
- **原因**: `RequestMethod` 是 `org.springframework.web.bind.annotation.RequestMethod` 包下的枚举，未被导入。
- **后果**: 编译失败，报错 `RequestMethod cannot be resolved to a type`。

### 未发现问题的部分

- `@RestController` 注解 ✅ — 已正确导入
- `@Autowired` 注解 ✅ — 已正确导入
- `@RequestMapping` 注解 ✅ — 已正确导入
- `DeptService` 依赖注入 ✅ — 类型正确
- `Result.success(deptlist)` 调用 ✅ — 方法签名匹配
- `List<Dept>` 类型 ✅ — 通过 `import java.util.*` 导入

## 修复方案

### 方案一：添加 RequestMethod 导入（推荐）

在现有 import 区域添加一行：

```java
import org.springframework.web.bind.annotation.RequestMethod;
```

### 方案二：使用 `@GetMapping` 替代（更简洁）

将第 17 行从：
```java
@RequestMapping(value = "/depts", method = RequestMethod.GET)
```
改为：
```java
@GetMapping("/depts")
```

同时添加导入：
```java
import org.springframework.web.bind.annotation.GetMapping;
```

这样可以消除对 `RequestMethod` 的依赖，代码也更简洁。

## 建议

推荐采用 **方案二**，因为：
1. 代码更简洁、语义更清晰
2. 符合 Spring 官方推荐的组合注解风格
3. 消除了对 `RequestMethod` 的依赖，减少一个 import
