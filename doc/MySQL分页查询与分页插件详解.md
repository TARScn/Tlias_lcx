# MySQL 分页查询原理与 MyBatis 分页插件详解

## 一、MySQL 分页查询原理

### 1.1 基础语法：LIMIT + OFFSET

MySQL 使用 `LIMIT` 子句实现分页查询，语法如下：

```sql
SELECT * FROM emp ORDER BY update_time DESC LIMIT offset, count;
```

| 参数 | 含义 | 示例 |
|------|------|------|
| `offset` | 跳过的记录数（从0开始） | 第1页 offset=0，第2页 offset=10 |
| `count` | 每页返回的记录数 | 通常为 pageSize |

**手动计算偏移量**：
```
offset = (pageNum - 1) × pageSize
```

**示例**：
```sql
-- 查询第1页，每页10条：跳过0条，取10条
SELECT * FROM emp ORDER BY update_time DESC LIMIT 0, 10;

-- 查询第2页，每页10条：跳过10条，取10条
SELECT * FROM emp ORDER BY update_time DESC LIMIT 10, 10;

-- 查询第3页，每页10条：跳过20条，取10条
SELECT * FROM emp ORDER BY update_time DESC LIMIT 20, 10;
```

### 1.2 分页必须搭配排序

分页查询**必须指定 `ORDER BY`**，否则每次查询返回的顺序可能不一致，导致：

- 第1页和第2页出现同一条数据（重复）
- 某些数据永远不会出现在任何一页中（遗漏）

本项目统一使用 `update_time DESC`（最后修改时间降序）作为默认排序规则。

### 1.3 分页需要知道总记录数

完整的分页查询需要执行**两次 SQL**：

```
SQL 1（COUNT 查询）：SELECT count(0) FROM emp WHERE ...  → 得到 totalCount
SQL 2（数据查询）：SELECT * FROM emp WHERE ... LIMIT offset, count  → 得到当前页数据
```

有了 `totalCount` 才能计算：
- 总页数 `totalPages = ceil(totalCount / pageSize)`
- 是否有上一页/下一页

---

## 二、PageHelper 分页插件原理与使用

### 2.1 为什么使用 PageHelper？

手动编写分页 SQL 有以下痛点：

1. **需要写两条 SQL**：查询总数 + 查询数据
2. **SQL 容易出错**：`LIMIT` 参数需要手动计算
3. **代码冗余**：每个分页查询都要重复写类似逻辑
4. **侵入性强**：分页参数与业务参数混在一起

PageHelper 通过 **MyBatis 拦截器机制**，自动在业务 SQL 外层包装分页逻辑，开发者只需调用 `PageHelper.startPage()` 即可。

### 2.2 依赖配置

[`pom.xml`](../tlias-web-management/pom.xml:48) 中引入：

```xml
<!-- 引入PageHelper分页插件 -->
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>1.4.6</version>
</dependency>
```

Spring Boot 自动配置，无需额外编写配置类。PageHelper 会通过 `mybatis-spring-boot-starter` 自动注册分页拦截器。

### 2.3 核心 API：PageHelper.startPage()

**方法签名**：
```java
PageHelper.startPage(int pageNum, int pageSize);
```

- `pageNum`：当前页码（从1开始）
- `pageSize`：每页记录数

### 2.4 工作原理 —— 拦截器机制

PageHelper 基于 MyBatis 的 **拦截器（Interceptor）** 实现，完整执行流程如下：

```
┌────────────────────────────────────────────────────────────────┐
│  Service 层调用流程                                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ① PageHelper.startPage(pageNum, pageSize)                     │
│     │  将分页参数存入 ThreadLocal（线程安全）                    │
│     │                                                           │
│     ▼                                                           │
│  ② empMapper.list(name, gender, begin, end)                    │
│     │  执行原始 SQL：                                           │
│     │  SELECT e.*, d.name FROM emp e LEFT JOIN dept d ...       │
│     │                                                           │
│     ▼                                                           │
│  ③ PageHelper 拦截器拦截该次查询                                 │
│     │                                                           │
│     ├── 在原始 SQL 前执行 COUNT 查询：                           │
│     │   SELECT count(0) FROM (原始SQL) tmp_count                │
│     │   → 得到 total（总记录数）                                 │
│     │                                                           │
│     ├── 在原始 SQL 后追加 LIMIT 子句：                           │
│     │   原始SQL ... LIMIT offset, pageSize                      │
│     │   → 得到当前页数据                                        │
│     │                                                           │
│     └── 将结果封装为 Page<E> 对象（继承 ArrayList）              │
│                                                                 │
│  ④ 清除 ThreadLocal 中的分页参数                                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 2.5 项目中的实际使用

**文件**：[`EmpServiceImpl.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java:24)

```java
@Override
public PageResult<Emp> page(Integer pageNum, Integer pageSize,
                            String name, Integer gender,
                            LocalDate begin, LocalDate end) {
    // ① 设置分页参数（存入 ThreadLocal）
    PageHelper.startPage(pageNum, pageSize);

    // ② 执行查询——PageHelper 拦截器自动包装
    List<Emp> list = empMapper.list(name, gender, begin, end);

    // ③ 强制转型为 Page 对象，获取 total 和当前页数据
    Page<Emp> page = (Page<Emp>) list;

    // ④ 封装为统一的分页结果对象
    return new PageResult<>(page.getTotal(), page.getResult());
}
```

**关键点**：

| 步骤 | 说明 |
|------|------|
| `PageHelper.startPage(pageNum, pageSize)` | 必须在查询方法调用**之前**执行，紧挨着 Mapper 查询 |
| `empMapper.list(...)` | 调用 Mapper 方法，PageHelper 拦截器自动在 SQL 前后加上 COUNT 和 LIMIT |
| `(Page<Emp>) list` | 返回的 `List` 实际上是 `Page` 子类，强转后获取 `getTotal()`（总记录数） |
| `PageResult` | 项目自定义的分页结果类，包含 `long total` 和 `List<T> data` |

### 2.6 PageResult 类

**文件**：[`PageResult.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/PageResult.java:12)

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageResult<T> {
    private long total;      // 总记录数
    private List<T> data;    // 当前页数据列表
}
```

前端收到的 JSON 响应格式：
```json
{
    "code": 1,
    "message": "success",
    "data": {
        "total": 25,
        "data": [
            { "id": 1, "name": "李忠", ... },
            { "id": 2, "name": "李俊", ... }
        ]
    }
}
```

### 2.7 PageHelper 关键规则

| 规则 | 说明 |
|------|------|
| **紧邻原则** | `PageHelper.startPage()` 只对紧随其后**第一次** Mapper 查询生效 |
| **线程隔离** | 分页参数存于 `ThreadLocal`，多线程互不干扰 |
| **自动清理** | 查询完成后自动清除 ThreadLocal 中的参数 |
| **安全分页** | PageHelper 对 COUNT 查询做了优化（去除不必要的排序和列名） |
| **不支持嵌套** | 如果后续有多个 Mapper 调用，只有第一个会被分页 |

---

## 三、MyBatis XML 映射文件详解

### 3.1 为什么使用 XML 而非注解？

MyBatis 支持两种 SQL 定义方式：

| 方式 | 适用场景 | 本项目使用 |
|------|---------|-----------|
| **注解**（`@Select`、`@Insert` 等） | 简单静态 SQL | 早期 DeptMapper（已迁移至 XML） |
| **XML 映射文件** | 复杂动态 SQL、参数多、需要 `<if>` `<foreach>` 等标签 | **当前全部使用** |

XML 方式的优势：
- SQL 与 Java 代码分离，便于 **DBA 审查和优化**
- 支持 **动态 SQL 标签**（`<if>`、`<where>`、`<set>`、`<foreach>`）
- 复杂 SQL 可读性更好，不需要在注解中拼接长字符串
- 修改 SQL 不需要重新编译 Java 代码

### 3.2 配置文件路径

**文件**：[`application.yaml`](../tlias-web-management/src/main/resources/application.yaml:13)

```yaml
mybatis:
  mapper-locations: classpath:com/lcx/tlias_web_management/mapper/*.xml
```

`mapper-locations` 告诉 MyBatis 去哪里扫描 XML 映射文件。本项目 XML 文件放在：
```
src/main/resources/com/lcx/tlias_web_management/mapper/
├── DeptMapper.xml    ← 与 DeptMapper.java 包路径对应
└── EmpMapper.xml     ← 与 EmpMapper.java 包路径对应
```

### 3.3 XML 文件基本结构

以 [`EmpMapper.xml`](../tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:1) 为例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<!-- namespace = 接口的全限定名（必须精确匹配） -->
<mapper namespace="com.lcx.tlias_web_management.mapper.EmpMapper">

    <!-- id = 接口方法名（必须精确匹配） -->
    <!-- resultType = 返回值类型的全限定名 -->
    <select id="getById" resultType="com.lcx.tlias_web_management.pojo.Emp">
        select e.*, d.name as dept_name
        from emp e
        left join dept d on e.dept_id = d.id
        where e.id = #{id}
    </select>

</mapper>
```

### 3.4 绑定规则：namespace + id

MyBatis 通过 `namespace` + `id` 将 XML 中的 SQL 与 Java 接口方法绑定：

```
┌─────────────────────────────────────────┐
│  DeptMapper.java（Java 接口）           │
│  package com.lcx...mapper;              │
│                                         │
│  @Mapper                                │
│  public interface DeptMapper {          │
│      List<Dept> findAll();              │  ←── id="findAll"
│      void deleteById(Integer id);       │  ←── id="deleteById"
│  }                                      │
└──────────────┬──────────────────────────┘
               │  namespace 精确匹配
               ▼
┌─────────────────────────────────────────┐
│  DeptMapper.xml（XML 映射文件）          │
│                                         │
│  <mapper namespace="com.lcx...DeptMapper">  ←── namespace
│      <select id="findAll">              │  ←── id 匹配 findAll()
│          select * from dept             │
│      </select>                          │
│      <delete id="deleteById">           │  ←── id 匹配 deleteById()
│          delete from dept where id=#{id}│
│      </delete>                          │
│  </mapper>                              │
└─────────────────────────────────────────┘
```

### 3.5 XML 中的 SQL 标签

| 标签 | 对应操作 | Java 接口方法示例 |
|------|---------|------------------|
| `<select>` | 查询（SELECT） | `Emp getById(Integer id)` |
| `<insert>` | 插入（INSERT） | `void insert(Emp emp)` |
| `<update>` | 更新（UPDATE） | `void update(Emp emp)` |
| `<delete>` | 删除（DELETE） | `void deleteById(Integer id)` |

### 3.6 主键回填（useGeneratedKeys）

**文件**：[`EmpMapper.xml`](../tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:37)

```xml
<insert id="insert" parameterType="com.lcx.tlias_web_management.pojo.Emp"
        useGeneratedKeys="true" keyProperty="id">
    insert into emp (username, password, name, gender, phone, job,
                     salary, image, entry_date, dept_id, create_time, update_time)
    values (#{username}, #{password}, #{name}, #{gender}, #{phone}, #{job},
            #{salary}, #{image}, #{entryDate}, #{deptId}, #{createTime}, #{updateTime})
</insert>
```

| 属性 | 含义 |
|------|------|
| `useGeneratedKeys="true"` | 使用 JDBC 的 `getGeneratedKeys()` 获取数据库自增主键 |
| `keyProperty="id"` | 将获取到的自增主键回填到 `Emp` 对象的 `id` 属性 |

**效果**：调用 `void insert(Emp emp)` 后，`emp.getId()` 就能拿到数据库生成的主键值。

### 3.7 参数传递：#{参数名}

MyBatis 使用 `#{}` 作为参数占位符（底层是 **PreparedStatement**，防 SQL 注入）：

```xml
<delete id="deleteById">
    delete from emp where id = #{id}
</delete>
```

**参数来源**：
| 场景 | 参数名确定方式 | 示例 |
|------|--------------|------|
| 单参数（无 `@Param`） | 参数名随意 | `#{id}`、`#{userId}` 都行 |
| 多参数（无 `@Param`） | 按位置：`#{arg0}`、`#{param1}` 等 | **不推荐，易混淆** |
| 多参数（有 `@Param`） | 按注解值 | `@Param("name")` → `#{name}` |
| POJO 对象 | 按属性名 | `Emp.name` → `#{name}` |

**本项目 EmpMapper 的参数示例**：
```java
// 接口方法：（多参数，使用 @Param 明确命名）
List<Emp> list(@Param("name") String name,
               @Param("gender") Integer gender,
               @Param("begin") LocalDate begin,
               @Param("end") LocalDate end);
```

```xml
<!-- XML 中直接使用 @Param 指定的名称 -->
<if test="name != null and name != ''">
    and e.name like concat('%', #{name}, '%')
</if>
```

### 3.8 动态 SQL

MyBatis XML 支持动态 SQL 标签，根据传入参数是否为空来动态拼接 SQL 条件。

#### 3.8.1 `<if>` / `<where>` —— 条件查询

**文件**：[`EmpMapper.xml`](../tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:6)

```xml
<select id="list" resultType="com.lcx.tlias_web_management.pojo.Emp">
    select e.*, d.name as dept_name
    from emp e
    left join dept d on e.dept_id = d.id
    <where>
        <if test="name != null and name != ''">
            and e.name like concat('%', #{name}, '%')
        </if>
        <if test="gender != null">
            and e.gender = #{gender}
        </if>
        <if test="begin != null">
            and e.entry_date <![CDATA[>=]]> #{begin}
        </if>
        <if test="end != null">
            and e.entry_date <![CDATA[<=]]> #{end}
        </if>
    </where>
    order by e.update_time desc
</select>
```

**实际执行效果**：

| 场景 | 前端传入参数 | 生成的实际 SQL（WHERE 部分） |
|------|-------------|--------------------------|
| 无筛选 | `name=""`, `gender=""` | `SELECT ... (无WHERE)` → 查询全部 |
| 只按姓名 | `name="李"` | `WHERE e.name like '%李%'` |
| 姓名+性别 | `name="李"`, `gender="1"` | `WHERE e.name like '%李%' AND e.gender=1` |
| 完整条件 | 全部有值 | `WHERE e.name like ... AND e.gender=... AND e.entry_date >= ... AND e.entry_date <= ...` |

**`<where>` 标签的智能特性**：
- 只有当内部至少有一个条件成立时才输出 `WHERE` 关键字
- 自动去除条件开头的 `AND` / `OR`

**`<![CDATA[]]>` 的作用**：
- XML 中 `>=` 和 `<=` 会被误认为XML标签
- 用 `<![CDATA[]]>` 包裹后，内容不再被 XML 解析器解析

#### 3.8.2 `<set>` —— 动态更新

**文件**：[`EmpMapper.xml`](../tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:46)

```xml
<update id="update" parameterType="com.lcx.tlias_web_management.pojo.Emp">
    update emp
    <set>
        <if test="name != null">name = #{name},</if>
        <if test="gender != null">gender = #{gender},</if>
        <if test="phone != null">phone = #{phone},</if>
        <if test="job != null">job = #{job},</if>
        <if test="salary != null">salary = #{salary},</if>
        <if test="image != null">image = #{image},</if>
        <if test="entryDate != null">entry_date = #{entryDate},</if>
        <if test="deptId != null">dept_id = #{deptId},</if>
        <if test="updateTime != null">update_time = #{updateTime},</if>
    </set>
    where id = #{id}
</update>
```

**`<set>` 标签的智能特性**：
- 自动添加 `SET` 关键字
- 自动去除末尾多余的逗号
- 只更新传入的非 null 字段，避免误将字段覆盖为 null

#### 3.8.3 `<foreach>` —— 批量操作

**文件**：[`EmpMapper.xml`](../tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:68)

```xml
<delete id="deleteByIds">
    delete from emp where id in
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</delete>
```

| 属性 | 含义 |
|------|------|
| `collection="ids"` | 要遍历的集合（对应 `@Param("ids")`） |
| `item="id"` | 每次遍历的元素名 |
| `open="("` | 循环开始前拼接的字符 |
| `separator=","` | 元素之间的分隔符 |
| `close=")"` | 循环结束后拼接的字符 |

**生成效果**：传入 `ids = [1, 2, 3]` → SQL 为 `delete from emp where id in (1, 2, 3)`

### 3.9 驼峰命名自动映射

[`application.yaml`](../tlias-web-management/src/main/resources/application.yaml:17) 中配置了：

```yaml
mybatis:
  configuration:
    map-underscore-to-camel-case: true
```

**作用**：数据库下划线列名自动映射为 Java 驼峰属性名。

| 数据库列名 | Java 属性名 | 映射方式 |
|-----------|------------|---------|
| `dept_name` | `deptName` | `d.name as dept_name` → Emp.deptName |
| `entry_date` | `entryDate` | 自动映射 |
| `create_time` | `createTime` | 自动映射 |
| `update_time` | `updateTime` | 自动映射 |

> 注意：JOIN 查询中 `d.name as dept_name` 的别名必须写成 `dept_name`（下划线形式），MyBatis 会自动转换为 `deptName`。如果写成 `deptName` 则无法匹配。

---

## 四、完整分页查询调用链路

以 **员工搜索 + 分页查询** 为例：

```
前端请求：GET /emps?pageNum=1&pageSize=10&name=李&gender=1&begin=2020-01-01&end=2025-12-31

     │
     ▼
┌──────────────────────────────────────────────────────────┐
│  EmpController.java:32  page() 方法                      │
│  - @RequestParam 绑定参数                                │
│  - 调用 empService.page(1, 10, "李", 1, 2020-01-01, ...) │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  EmpServiceImpl.java:24  page() 方法                     │
│  ① PageHelper.startPage(1, 10)  ← 设置分页               │
│  ② empMapper.list("李", 1, 2020-01-01, 2025-12-31)       │
│  ③ 强转为 Page<Emp>，取 total + data                     │
│  ④ 返回 PageResult(total=25, data=[...10条数据])         │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  EmpMapper.java:11  list() 接口方法                       │
│  （无 SQL 注解，由 XML 绑定）                             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼  PageHelper 拦截器介入
┌──────────────────────────────────────────────────────────┐
│  PageHelper MyBatis Interceptor                           │
│  - SQL 1: SELECT count(0) FROM (                             │
│             SELECT e.*, d.name as dept_name               │
│             FROM emp e LEFT JOIN dept d ...               │
│             WHERE e.name like '%李%' AND e.gender=1       │
│               AND e.entry_date >= '2020-01-01'            │
│               AND e.entry_date <= '2025-12-31'            │
│           ) tmp_count                                     │
│           → 得到 total = 25                               │
│                                                           │
│  - SQL 2: 原始SQL + LIMIT 0, 10                           │
│           → 得到第1页的10条数据                            │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  EmpMapper.xml:7  <select id="list">                      │
│  - 动态 SQL 根据参数拼接 WHERE 条件                        │
│  - LEFT JOIN dept 获取部门名称                             │
│  - ORDER BY update_time DESC                              │
└──────────────────────────────────────────────────────────┘
```

---

## 五、对比：注解方式 vs XML 方式

本项目中部门管理和员工管理都从注解方式迁移到了 XML 方式：

| 对比维度 | 注解方式（旧） | XML 方式（新） |
|---------|--------------|---------------|
| 定义位置 | Java 接口方法上的 `@Select` 等注解 | `resources/com/.../mapper/*.xml` 文件 |
| 简单 SQL | 直观方便 | 稍显繁琐 |
| 动态 SQL | 需要用 `@SelectProvider` 写 Java 代码拼接 | `<if>` `<where>` `<set>` `<foreach>` 标签，直观 |
| 多条件搜索 | 难以实现 | `<where>` + `<if>` 完美支持 |
| SQL 可读性 | 长字符串拼接，难以阅读 | 格式化良好，支持注释 |
| 修改成本 | 改注解 → 重新编译 | 改 XML → 重启即可 |
| DBA 审查 | 不友好 | 友好（纯 SQL 文件） |
| 本项目使用 | DeptMapper 早期版本 | **当前全部 Mapper** |

### DeptMapper 迁移示例

**旧版（注解）**：
```java
@Select("select id,name,create_time,update_time from dept order by update_time desc")
List<Dept> findAll();
```

**新版（XML）**：[`DeptMapper.xml`](../tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/DeptMapper.xml:6)
```xml
<select id="findAll" resultType="com.lcx.tlias_web_management.pojo.Dept">
    select id, name, create_time, update_time
    from dept
    order by update_time desc
</select>
```

**新版（接口）**：[`DeptMapper.java`](../tlias-web-management/src/main/java/com/lcx/tlias_web_management/mapper/DeptMapper.java:15)
```java
// 不再需要 @Select 注解，MyBatis 从 XML 中查找
List<Dept> findAll();
```

---

## 六、总结

| 主题 | 核心要点 |
|------|---------|
| **MySQL 分页** | `LIMIT offset, count`，offset = (pageNum-1) × pageSize，必须搭配 ORDER BY |
| **PageHelper** | `PageHelper.startPage(pageNum, pageSize)` 在 Mapper 调用前设置，通过 MyBatis 拦截器自动包装 COUNT + LIMIT |
| **PageHelper 原理** | ThreadLocal 存储分页参数 → 拦截 Mapper 查询 → 自动改写 SQL → 封装 Page 对象 |
| **XML 绑定** | `namespace = 接口全限定名`，`id = 方法名`，MyBatis 启动时自动关联 |
| **主键回填** | `useGeneratedKeys="true" keyProperty="id"` |
| **动态 SQL** | `<where>` + `<if>` 条件查询，`<set>` + `<if>` 动态更新，`<foreach>` 批量操作 |
| **驼峰映射** | `map-underscore-to-camel-case: true` 自动转换 `dept_name` → `deptName` |
| **CDATA** | `<![CDATA[]]>` 包裹含 `>=` `<=` 的 SQL 片段，避免 XML 解析错误 |
