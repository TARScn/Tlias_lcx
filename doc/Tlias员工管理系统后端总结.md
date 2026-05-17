# Tlias 员工管理系统后端总结

## 目录

- [一、项目概述](#一项目概述)
- [二、项目目录结构](#二项目目录结构)
- [三、后端分层架构](#三后端分层架构)
- [四、数据模型设计](#四数据模型设计)
- [五、业务功能概述](#五业务功能概述)
- [六、业务逻辑实现详解](#六业务逻辑实现详解)
- [七、API 接口文档](#七api-接口文档)
- [八、常用技术栈](#八常用技术栈)
- [九、配置文件说明](#九配置文件说明)
- [十、异常处理机制](#十异常处理机制)
- [十一、事务管理](#十一事务管理)
- [十二、项目亮点与设计模式](#十二项目亮点与设计模式)

---

## 一、项目概述

Tlias 员工管理系统是一套基于 **Spring Boot 3.5 + MyBatis + MySQL** 的企业级员工信息管理后端服务。系统提供部门管理、员工管理、文件上传、数据统计等核心功能，采用标准 **三层架构**（Controller、Service、Mapper）进行分层开发，并通过 RESTful API 与前端交互。

| 项目 | 说明 |
|------|------|
| **项目名** | tlias-web-management |
| **基础包** | `com.lcx.tlias_web_management` |
| **JDK** | 17 |
| **Spring Boot** | 3.5.14 |
| **MyBatis** | 3.0.5（Spring Boot Starter） |
| **数据库** | MySQL（数据库名：`tlias`） |

---

## 二、项目目录结构

```
tlias-web-management/
├── pom.xml                                              # Maven 构建配置文件
├── src/
│   ├── main/
│   │   ├── java/com/lcx/tlias_web_management/
│   │   │   ├── TliasWebManagementApplication.java       # 应用启动入口
│   │   │   ├── config/
│   │   │   │   └── WebMvcConfig.java                    # Web MVC 配置（静态资源映射）
│   │   │   ├── controller/
│   │   │   │   ├── EmpController.java                   # 员工控制器
│   │   │   │   ├── DeptController.java                  # 部门控制器
│   │   │   │   └── UploadController.java                # 文件上传控制器
│   │   │   ├── service/
│   │   │   │   ├── EmpService.java                      # 员工服务接口
│   │   │   │   ├── DeptService.java                     # 部门服务接口
│   │   │   │   └── impl/
│   │   │   │       ├── EmpServiceImpl.java              # 员工服务实现
│   │   │   │       └── DeptServiceImpl.java             # 部门服务实现
│   │   │   ├── mapper/
│   │   │   │   ├── EmpMapper.java                       # 员工 Mapper 接口
│   │   │   │   ├── DeptMapper.java                      # 部门 Mapper 接口
│   │   │   │   └── EmpExprMapper.java                   # 工作经历 Mapper 接口
│   │   │   ├── pojo/
│   │   │   │   ├── Emp.java                             # 员工实体类
│   │   │   │   ├── Dept.java                            # 部门实体类
│   │   │   │   ├── EmpExpr.java                         # 工作经历实体类
│   │   │   │   ├── Result.java                          # 统一响应结果封装
│   │   │   │   ├── PageResult.java                      # 分页结果封装
│   │   │   │   └── JobOption.java                       # 职位统计封装
│   │   │   └── exception/
│   │   │       └── GlobalExceptionHandler.java          # 全局异常处理器
│   │   └── resources/
│   │       ├── application.yaml                         # 应用配置文件
│   │       ├── logback.xml                              # 日志配置
│   │       └── com/lcx/tlias_web_management/mapper/
│   │           ├── EmpMapper.xml                        # 员工 SQL 映射
│   │           ├── DeptMapper.xml                       # 部门 SQL 映射
│   │           └── EmpExprMapper.xml                    # 工作经历 SQL 映射
│   └── test/java/com/lcx/tlias_web_management/
│       └── TliasWebManagementApplicationTests.java      # 单元测试
```

---

## 三、后端分层架构

系统遵循经典 **三层架构**，各层职责明确：

```
┌─────────────────────────────────────────────────────┐
│                  Controller 层                        │
│  接收 HTTP 请求、参数校验、调用 Service、返回响应      │
│  (@RestController / @RequestMapping)                 │
├─────────────────────────────────────────────────────┤
│                  Service 层                           │
│  业务逻辑编排、事务管理、数据校验、默认值填充           │
│  (@Service / @Transactional)                         │
├─────────────────────────────────────────────────────┤
│                  Mapper 层 (DAO)                      │
│  数据库 CRUD 操作、MyBatis XML 映射                   │
│  (@Mapper / XML)                                     │
├─────────────────────────────────────────────────────┤
│                     POJO 层                           │
│  实体类 (Emp / Dept / EmpExpr)                       │
│  响应封装 (Result / PageResult / JobOption)           │
└─────────────────────────────────────────────────────┘
```

### 3.1 Controller 层（控制层）

负责接收前端 HTTP 请求，调用 Service 层处理业务，并将结果封装为 [`Result`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/Result.java) 统一响应格式返回。

- [`EmpController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java) — 员工 CRUD + 分页查询 + 统计接口
- [`DeptController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java) — 部门 CRUD 接口
- [`UploadController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/UploadController.java) — 文件上传接口

### 3.2 Service 层（业务层）

负责具体的业务逻辑实现，包括数据校验、默认值填充、事务管理等。

- [`DeptService`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/DeptService.java) / [`DeptServiceImpl`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/DeptServiceImpl.java) — 部门业务
- [`EmpService`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/EmpService.java) / [`EmpServiceImpl`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java) — 员工业务（含工作经历关联操作）

### 3.3 Mapper 层（数据访问层）

通过 MyBatis 的接口 + XML 映射方式执行数据库操作。

- [`EmpMapper`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/mapper/EmpMapper.java) / [`EmpMapper.xml`](tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml)
- [`DeptMapper`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/mapper/DeptMapper.java) / [`DeptMapper.xml`](tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/DeptMapper.xml)
- [`EmpExprMapper`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/mapper/EmpExprMapper.java) / [`EmpExprMapper.xml`](tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpExprMapper.xml)

---

## 四、数据模型设计

数据库 `tlias` 包含三张核心表：

### 4.1 部门表 `dept`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 主键，自增 |
| `name` | VARCHAR | 部门名称 |
| `create_time` | DATETIME | 创建时间 |
| `update_time` | DATETIME | 修改时间 |

对应实体：[`Dept`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/Dept.java)

### 4.2 员工表 `emp`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 主键，自增 |
| `username` | VARCHAR | 用户名 |
| `password` | VARCHAR | 密码 |
| `name` | VARCHAR | 姓名 |
| `gender` | TINYINT | 性别：1-男，2-女 |
| `phone` | VARCHAR | 手机号 |
| `job` | TINYINT | 职位：1-班主任，2-讲师，3-学工主管，4-教研主管，5-咨询师 |
| `salary` | INT | 薪资 |
| `image` | VARCHAR | 头像路径 |
| `entry_date` | DATE | 入职日期 |
| `dept_id` | INT | 部门 ID（外键关联 `dept.id`） |
| `create_time` | DATETIME | 创建时间 |
| `update_time` | DATETIME | 修改时间 |

对应实体：[`Emp`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/Emp.java)

### 4.3 工作经历表 `emp_expr`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 主键，自增 |
| `emp_id` | INT | 员工 ID（外键关联 `emp.id`） |
| `begin` | DATE | 开始时间 |
| `end` | DATE | 结束时间 |
| `company` | VARCHAR | 公司名称 |
| `job` | VARCHAR | 职位 |

对应实体：[`EmpExpr`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/EmpExpr.java)

### 4.4 实体关系

```
Dept (1) ──── (N) Emp (1) ──── (N) EmpExpr
```

- 一个部门下有多个员工（`dept_id` 外键）
- 一个员工有多条工作经历（`emp_id` 外键）

---

## 五、业务功能概述

### 5.1 部门管理

| 功能 | 方法 | 接口 |
|------|------|------|
| 查询全部部门 | `DeptController.list()` | `GET /depts` |
| 根据 ID 查询部门 | `DeptController.getInfo()` | `GET /depts/{id}` |
| 新增部门 | `DeptController.add()` | `POST /depts` |
| 修改部门 | `DeptController.update()` | `PUT /depts` |
| 删除部门 | `DeptController.delete()` | `DELETE /depts` |

### 5.2 员工管理

| 功能 | 方法 | 接口 |
|------|------|------|
| 分页条件查询 | `EmpController.page()` | `GET /emps` |
| 根据 ID 查询详情（含工作经历） | `EmpController.getById()` | `GET /emps/{id}` |
| 新增员工（含工作经历） | `EmpController.add()` | `POST /emps` |
| 修改员工（含工作经历更新） | `EmpController.update()` | `PUT /emps` |
| 根据 ID 删除员工 | `EmpController.deleteById()` | `DELETE /emps/{id}` |
| 批量删除员工 | `EmpController.deleteByIds()` | `DELETE /emps/batch` |

### 5.3 数据统计

| 功能 | 方法 | 接口 |
|------|------|------|
| 统计员工职位人数 | `EmpController.countEmpJob()` | `GET /emps/countJob` |
| 统计员工性别分布 | `EmpController.countEmpGender()` | `GET /emps/countGender` |

### 5.4 文件上传

| 功能 | 方法 | 接口 |
|------|------|------|
| 上传头像图片 | `UploadController.upload()` | `POST /upload` |

---

## 六、业务逻辑实现详解

### 6.1 员工分页条件查询

在 [`EmpServiceImpl.page()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java:32) 中，使用 **PageHelper 分页插件** 实现分页查询：

```java
public PageResult<Emp> page(Integer pageNum, Integer pageSize,
                            String name, Integer gender,
                            LocalDate begin, LocalDate end) {
    PageHelper.startPage(pageNum, pageSize);
    List<Emp> list = empMapper.list(name, gender, begin, end);
    try (Page<Emp> page = (Page<Emp>) list) {
        return new PageResult<>(page.getTotal(), page.getResult());
    }
}
```

对应的 [`EmpMapper.xml`](tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:7) 中通过动态 SQL 实现多条件筛选：

```xml
<select id="list" resultType="com.lcx.tlias_web_management.pojo.Emp">
    select e.*, d.name as dept_name
    from emp e left join dept d on e.dept_id = d.id
    <where>
        <if test="name != null and name != ''">
            and e.name like concat('%', #{name}, '%')
        </if>
        <if test="gender != null">and e.gender = #{gender}</if>
        <if test="begin != null">and e.entry_date >= #{begin}</if>
        <if test="end != null">and e.entry_date <= #{end}</if>
    </where>
    order by e.update_time desc
</select>
```

**关键点：**
- 使用 `LEFT JOIN` 关联部门表，查询出 `dept_name`
- 姓名使用 `LIKE` 模糊匹配
- 入职日期支持范围查询（`begin` ~ `end`）
- 默认按 `update_time` 降序排列
- PageHelper 自动拦截 SQL 生成分页语句，无需手动拼接 `LIMIT`

### 6.2 新增员工（含工作经历）

在 [`EmpServiceImpl.add()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java:54) 中：

1. **补齐默认值** — 若前端未传用户名，自动使用手机号或生成随机用户名；默认密码为 `123456`
2. **设置时间戳** — 补全 `createTime` 和 `updateTime`
3. **插入员工** — 通过 `<insert useGeneratedKeys="true">` 自动返回自增 ID
4. **插入工作经历** — 利用回填的 `emp.id` 设置 `empId`，批量插入工作经历

```java
@Transactional
public void add(Emp emp) {
    // 补齐默认值
    if (emp.getUsername() == null || emp.getUsername().isEmpty()) {
        emp.setUsername(emp.getPhone() != null ? emp.getPhone() : "user" + System.currentTimeMillis());
    }
    if (emp.getPassword() == null || emp.getPassword().isEmpty()) {
        emp.setPassword("123456");
    }
    emp.setCreateTime(LocalDateTime.now());
    emp.setUpdateTime(LocalDateTime.now());
    empMapper.insert(emp);  // useGeneratedKeys 回填 id

    List<EmpExpr> exprList = emp.getEmpExprList();
    if (exprList != null && !exprList.isEmpty()) {
        exprList.forEach(e -> e.setEmpId(emp.getId()));
        empExprMapper.insertBatch(exprList);
    }
}
```

### 6.3 修改员工（含工作经历更新）

在 [`EmpServiceImpl.update()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java:76) 中，采用 **先删后增** 策略更新工作经历：

```java
@Transactional
public void update(Emp emp) {
    emp.setUpdateTime(LocalDateTime.now());
    List<EmpExpr> exprList = emp.getEmpExprList();
    if (exprList != null) {                       // 前端传 null 表示不更新工作经历
        empExprMapper.deleteByEmpId(emp.getId());  // 先删除原有的
        if (!exprList.isEmpty()) {
            exprList.forEach(e -> e.setEmpId(emp.getId()));
            empExprMapper.insertBatch(exprList);   // 再插入新的
        }
    }
    empMapper.update(emp);                         // 动态 SQL 更新员工信息
}
```

对应的 [`EmpMapper.xml`](tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:46) 更新语句使用 MyBatis 动态 `<set>` 标签，实现**非空字段部分更新**：

```xml
<update id="update">
    update emp
    <set>
        <if test="name != null">name = #{name},</if>
        <if test="gender != null">gender = #{gender},</if>
        <if test="phone != null">phone = #{phone},</if>
        <!-- ... 其他字段类似 -->
        <if test="updateTime != null">update_time = #{updateTime},</if>
    </set>
    where id = #{id}
</update>
```

### 6.4 删除员工（级联删除）

由于 `emp_expr` 表通过 `emp_id` 外键关联 `emp` 表，删除员工时必须**先删除其工作经历**，再删除员工本身。

[`EmpServiceImpl.deleteById()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java:92)：
```java
@Transactional
public void deleteById(Integer id) {
    empExprMapper.deleteByEmpId(id);   // 先删工作经历
    empMapper.deleteById(id);          // 再删员工
}
```

[`EmpServiceImpl.deleteByIds()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java:100) 实现批量删除同理，使用 `foreach` 构建 `IN` 子句：

```xml
<delete id="deleteByIds">
    delete from emp where id in
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</delete>
```

### 6.5 数据统计

#### 职位人数统计

在 [`EmpMapper.xml`](tlias-web-management/src/main/resources/com/lcx/tlias_web_management/mapper/EmpMapper.xml:76) 中使用 `CASE WHEN` 将数字编码转换为中文描述，并按人数降序排列：

```sql
select (case when job = 1 then '班主任'
             when job = 2 then '讲师'
             when job = 3 then '学工主管'
             when job = 4 then '教研主管'
             when job = 5 then '咨询师'
             else '其他' end) as pos,
       count(*) as count
from emp group by job order by count desc
```

Service 层将查询结果转换为 [`JobOption`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/JobOption.java) 对象，分离职位标签和数据值，便于前端 ECharts 图表展示。

#### 性别统计

```sql
select (case when gender = 1 then '男' else '女' end) as gender,
       count(*) as count
from emp group by gender
```

### 6.6 文件上传

在 [`UploadController`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/UploadController.java) 中：

1. 接收前端上传的 `MultipartFile`（参数名 `image`）
2. 使用 `UUID.randomUUID()` 生成唯一文件名，防止覆盖
3. 保存到配置路径（默认 `d:/tlias/`，可通过 `tlias.upload.path` 配置）
4. 返回可访问的 URL 路径 `/images/{filename}`

静态资源访问通过 [`WebMvcConfig`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/config/WebMvcConfig.java) 配置映射：

```java
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry.addResourceHandler("/images/**")
            .addResourceLocations("file:" + uploadPath + "/");
}
```

---

## 七、API 接口文档

### 7.1 统一响应格式

所有接口统一返回 [`Result`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/Result.java) 对象：

```json
// 成功响应
{ "code": 1, "message": "success", "data": {...} }

// 失败响应
{ "code": 0, "message": "服务器发生异常，请稍后再试", "data": null }
```

### 7.2 分页查询接口

**请求：** `GET /emps?pageNum=1&pageSize=10&name=张&gender=1&begin=2020-01-01&end=2024-12-31`

**响应：**
```json
{
  "code": 1,
  "message": "success",
  "data": {
    "total": 51,
    "data": [
      {
        "id": 1,
        "username": "zhangsan",
        "name": "张三",
        "gender": 1,
        "phone": "13800000000",
        "job": 2,
        "salary": 15000,
        "image": "/images/uuid.jpg",
        "entryDate": "2020-01-01",
        "deptId": 1,
        "deptName": "教学部",
        "createTime": "...",
        "updateTime": "..."
      }
    ]
  }
}
```

### 7.3 完整接口清单

| 请求方式 | 接口路径 | 功能描述 | Controller 方法 |
|---------|---------|---------|----------------|
| `GET` | `/depts` | 查询全部部门 | [`DeptController.list()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java:34) |
| `GET` | `/depts/{id}` | 根据 ID 查询部门 | [`DeptController.getInfo()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java:69) |
| `POST` | `/depts` | 新增部门 | [`DeptController.add()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java:57) |
| `PUT` | `/depts` | 修改部门 | [`DeptController.update()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java:81) |
| `DELETE` | `/depts?id=1` | 删除部门 | [`DeptController.delete()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/DeptController.java:45) |
| `GET` | `/emps` | 分页条件查询员工 | [`EmpController.page()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:35) |
| `GET` | `/emps/{id}` | 查询员工详情 | [`EmpController.getById()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:51) |
| `POST` | `/emps` | 新增员工 | [`EmpController.add()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:61) |
| `PUT` | `/emps` | 修改员工 | [`EmpController.update()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:71) |
| `DELETE` | `/emps/{id}` | 删除单个员工 | [`EmpController.deleteById()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:81) |
| `DELETE` | `/emps/batch?ids=1,2,3` | 批量删除员工 | [`EmpController.deleteByIds()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:91) |
| `GET` | `/emps/countJob` | 统计员工职位人数 | [`EmpController.countEmpJob()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:101) |
| `GET` | `/emps/countGender` | 统计员工性别分布 | [`EmpController.countEmpGender()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/EmpController.java:110) |
| `POST` | `/upload` | 上传头像图片 | [`UploadController.upload()`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/controller/UploadController.java:26) |

---

## 八、常用技术栈

### 8.1 核心框架

| 技术 | 用途 | 版本 |
|------|------|------|
| **Spring Boot** | 应用框架 | 3.5.14 |
| **Spring Web** | RESTful API | 内嵌（MVC） |
| **MyBatis** | ORM 持久层框架 | 3.0.5（Spring Boot Starter） |
| **MySQL** | 关系型数据库 | 8.0+（驱动 8.x） |

### 8.2 工具与插件

| 技术 | 用途 | 版本 |
|------|------|------|
| **PageHelper** | 物理分页插件 | 1.4.6 |
| **Lombok** | 代码简化（`@Data` / `@Slf4j`） | 随 Starter |
| **Logback** | 日志框架（SLF4J 实现） | 内嵌 |
| **Spring Actuator** | 应用监控管理 | 内嵌 |

### 8.3 关键技术特性

| 特性 | 说明 |
|------|------|
| **RESTful API** | 基于 HTTP 方法的资源操作风格 |
| **动态 SQL** | MyBatis `<if>` / `<where>` / `<set>` / `<foreach>` 标签 |
| **驼峰映射** | `map-underscore-to-camel-case: true`，`create_time` 自动映射到 `createTime` |
| **声明式事务** | `@Transactional` 注解实现事务管理 |
| **全局异常处理** | `@RestControllerAdvice` + `@ExceptionHandler` |
| **参数校验注解** | `@DateTimeFormat` 处理日期格式，`@RequestParam` 参数绑定 |

---

## 九、配置文件说明

[`application.yaml`](tlias-web-management/src/main/resources/application.yaml) 包含如下配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/tlias        # 数据库连接
    username: root
    password: "000000"
  servlet:
    multipart:
      max-file-size: 10MB                          # 单文件上传限制
      max-request-size: 100MB                      # 总请求大小限制

mybatis:
  mapper-locations: classpath:com/lcx/tlias_web_management/mapper/*.xml
  configuration:
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl   # SQL 日志（SLF4J）
    map-underscore-to-camel-case: true                     # 驼峰命名转换

tlias:
  upload:
    path: d:/tlias                                         # 文件上传保存路径
```

日志配置通过 [`logback.xml`](tlias-web-management/src/main/resources/logback.xml) 实现，按日期和大小滚动归档。

---

## 十、异常处理机制

通过 [`GlobalExceptionHandler`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/exception/GlobalExceptionHandler.java) 实现全局异常的统一拦截与处理：

```java
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 通用异常处理（兜底）
    @ExceptionHandler
    public Result handleException(Exception e) {
        log.error("发生异常: ", e);
        return Result.error("服务器发生异常，请稍后再试");
    }

    // 唯一键冲突异常处理
    @ExceptionHandler
    public Result handleDuplicateKeyException(DuplicateKeyException e) {
        log.error("发生异常: ", e);
        String msg = e.getMessage();
        int i = msg.indexOf("Duplicate entry");
        String errMsg = msg.substring(i);
        String[] arr = errMsg.split(" ");
        return Result.error(arr[2] + "已存在，请勿重复添加");
    }
}
```

**处理策略：**
- **通用异常**：捕获所有 `Exception` 类型，返回固定错误提示，避免敏感信息泄露
- **唯一键冲突**：解析 `DuplicateKeyException` 的错误信息，提取冲突的值，返回友好的中文提示

---

## 十一、事务管理

系统使用 Spring 的声明式事务管理（`@Transactional` 注解），在以下场景确保数据一致性：

| 操作方法 | 事务边界 | 涉及操作 |
|---------|---------|---------|
| `EmpServiceImpl.add()` | 新增员工 + 插入工作经历 | `empMapper.insert()` + `empExprMapper.insertBatch()` |
| `EmpServiceImpl.update()` | 更新员工 + 先删后增工作经历 | `empExprMapper.deleteByEmpId()` + `empExprMapper.insertBatch()` + `empMapper.update()` |
| `EmpServiceImpl.deleteById()` | 删除单个员工（含工作经历） | `empExprMapper.deleteByEmpId()` + `empMapper.deleteById()` |
| `EmpServiceImpl.deleteByIds()` | 批量删除员工（含工作经历） | `empExprMapper.deleteBatch()` + `empMapper.deleteByIds()` |

---

## 十二、项目亮点与设计模式

### 12.1 分层架构设计

遵循标准的 **Controller → Service → Mapper** 三层架构，各层职责单一、解耦清晰：
- Controller 只负责请求接收与响应返回
- Service 负责业务逻辑编排
- Mapper 负责数据持久化

### 12.2 接口与实现分离

Service 层采用 **接口 + 实现类** 模式（[`EmpService`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/EmpService.java) / [`EmpServiceImpl`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/service/impl/EmpServiceImpl.java)），便于扩展和维护，也利于单元测试时进行 mock。

### 12.3 MyBatis 动态 SQL

灵活运用 MyBatis 动态 SQL 标签：
- `<where>` + `<if>` — 多条件动态组合查询
- `<set>` + `<if>` — 非空字段部分更新
- `<foreach>` — 批量操作（IN 查询 / 批量插入）
- `<bind>` — 模糊查询拼接（`concat('%', #{name}, '%')`）

### 12.4 分页插件集成

引入 **PageHelper** 分页插件，一行代码 `PageHelper.startPage(pageNum, pageSize)` 即可实现物理分页，无需手动拼接 `LIMIT` 语句，自动拦截后续第一条 SELECT 语句生成分页 SQL。

### 12.5 统一响应与异常处理

- [`Result`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/Result.java) 统一响应封装，code=1 成功 / code=0 失败
- [`PageResult`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/pojo/PageResult.java) 分页结果泛型封装（`total` + `data`）
- [`GlobalExceptionHandler`](tlias-web-management/src/main/java/com/lcx/tlias_web_management/exception/GlobalExceptionHandler.java) 全局异常拦截，避免异常信息直接暴露给前端

### 12.6 声明式事务

使用 `@Transactional` 注解确保跨表操作的原子性，特别是在员工与工作经历的级联操作中保证数据一致性。

### 12.7 Lombok 简化代码

大量使用 Lombok 注解简化样板代码：
- `@Data` — 自动生成 Getter / Setter / toString / equals / hashCode
- `@Slf4j` — 自动注入 Logger
- `@AllArgsConstructor` / `@NoArgsConstructor` — 自动生成构造器

---

> **文档版本**：v1.0 | **最后更新**：2026-05-17 | **作者**：LCX
