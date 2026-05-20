-- ============================================================
-- Tlias 员工管理系统 - 数据库建表脚本
-- 数据库: tlias
-- ============================================================

CREATE DATABASE IF NOT EXISTS tlias DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tlias;

-- 部门表
CREATE TABLE IF NOT EXISTS dept (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '部门ID',
    name        VARCHAR(50) NOT NULL COMMENT '部门名称',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间'
) COMMENT '部门表';

-- 员工表
CREATE TABLE IF NOT EXISTS emp (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '员工ID',
    username    VARCHAR(32) NOT NULL COMMENT '用户名',
    password    VARCHAR(32) DEFAULT '123456' COMMENT '密码',
    name        VARCHAR(32) COMMENT '姓名',
    gender      TINYINT COMMENT '性别, 1:男, 2:女',
    phone       VARCHAR(11) COMMENT '手机号',
    job         TINYINT COMMENT '职位, 1:班主任, 2:讲师, 3:学工主管, 4:教研主管, 5:咨询师',
    salary      INT COMMENT '薪资',
    image       VARCHAR(255) COMMENT '头像',
    entry_date  DATE COMMENT '入职日期',
    dept_id     INT COMMENT '部门ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    FOREIGN KEY (dept_id) REFERENCES dept(id)
) COMMENT '员工表';

-- 工作经历表
CREATE TABLE IF NOT EXISTS emp_expr (
    id      INT PRIMARY KEY AUTO_INCREMENT COMMENT '经历ID',
    emp_id  INT COMMENT '员工ID',
    begin   DATE COMMENT '开始时间',
    end     DATE COMMENT '结束时间',
    company VARCHAR(100) COMMENT '公司名称',
    job     VARCHAR(50) COMMENT '职位',
    FOREIGN KEY (emp_id) REFERENCES emp(id)
) COMMENT '工作经历表';

-- 班级表
CREATE TABLE IF NOT EXISTS clazz (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '班级ID',
    name        VARCHAR(100) NOT NULL COMMENT '班级名称',
    room        VARCHAR(50) COMMENT '教室',
    begin_date  DATE COMMENT '开课时间',
    end_date    DATE COMMENT '结课时间',
    master_id   INT COMMENT '班主任ID',
    subject     TINYINT COMMENT '学科',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    FOREIGN KEY (master_id) REFERENCES emp(id)
) COMMENT '班级表';

-- 学员表
CREATE TABLE IF NOT EXISTS student (
    id               INT PRIMARY KEY AUTO_INCREMENT COMMENT '学员ID',
    name             VARCHAR(32) NOT NULL COMMENT '姓名',
    no               VARCHAR(32) COMMENT '序号',
    gender           TINYINT COMMENT '性别, 1:男, 2:女',
    phone            VARCHAR(11) COMMENT '手机号',
    id_card          VARCHAR(18) COMMENT '身份证号',
    is_college       TINYINT COMMENT '是否来自院校, 1:是, 0:否',
    address          VARCHAR(255) COMMENT '联系地址',
    degree           TINYINT COMMENT '最高学历, 1:初中, 2:高中, 3:大专, 4:本科, 5:硕士, 6:博士',
    graduation_date  DATE COMMENT '毕业时间',
    clazz_id         INT COMMENT '班级ID',
    violation_count  TINYINT DEFAULT 0 COMMENT '违纪次数',
    violation_score  TINYINT DEFAULT 0 COMMENT '违纪扣分',
    create_time      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    FOREIGN KEY (clazz_id) REFERENCES clazz(id)
) COMMENT '学员表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operate_log (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    operate_emp_id  INT COMMENT '操作人ID',
    operate_time    DATETIME COMMENT '操作时间',
    class_name      VARCHAR(255) COMMENT '操作类名',
    method_name     VARCHAR(255) COMMENT '操作方法名',
    method_params   VARCHAR(4000) COMMENT '方法参数',
    return_value    VARCHAR(4000) COMMENT '返回值',
    cost_time       BIGINT COMMENT '耗时(ms)'
) COMMENT '操作日志表';
