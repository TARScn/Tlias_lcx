# Docker 部署指南

## 一、Docker 简介

### 1.1 什么是 Docker

Docker 是一个开源的**容器化平台**，用于开发、交付和运行应用程序。它通过**容器**技术将应用程序及其依赖环境打包在一起，实现"一次构建，到处运行"。

### 1.2 容器 vs 虚拟机

| 特性 | Docker 容器 | 虚拟机 |
|------|-----------|--------|
| 启动速度 | 毫秒级 | 分钟级 |
| 体积 | MB 级 | GB 级 |
| 内核 | 共享宿主机内核 | 独立内核 |
| 资源占用 | 低 | 高 |
| 隔离性 | 进程级隔离 | 完全隔离 |

### 1.3 核心概念

| 概念 | 说明 |
|------|------|
| **镜像（Image）** | 一个只读的模板，包含运行环境和应用程序代码 |
| **容器（Container）** | 镜像的运行实例，可以启动、停止、删除 |
| **Dockerfile** | 构建镜像的脚本文件，描述如何组装镜像 |
| **仓库（Repository）** | 存放镜像的地方，如 Docker Hub、阿里云 ACR |
| **数据卷（Volume）** | 持久化存储，容器删除后数据不丢失 |

---

## 二、项目 Docker 文件说明

### 2.1 Dockerfile

位于项目根目录 `Dockerfile`，采用多阶段构建：

```
第一阶段（builder）：JDK 17 + Maven Wrapper → 编译打包
第二阶段（runner）：JRE 17 → 运行 JAR
```

核心步骤：
1. 复制 `mvnw` 和 `pom.xml`，下载依赖（利用缓存加速）
2. 复制源码，执行 `mvnw clean package -DskipTests` 编译
3. 将产物 `app.jar` 复制到轻量 JRE 镜像中
4. 设置启动入口 `java -jar app.jar`

### 2.2 docker-compose.yml

定义了两个服务：

- **mysql**：MySQL 8.0 数据库，端口映射 `3307:3306`（宿主机 3306 被占用时改为 3307）
- **app**：Spring Boot 应用，端口映射 `8080:8080`

### 2.3 .dockerignore

排除不需要的文件（`target/`、`.git`、日志等），减少构建上下文大小。

---

## 三、本地构建镜像

```bash
# 在项目根目录执行

# 构建镜像
docker build -t tlias-web-management:latest .

# 查看镜像
docker images | findstr tlias
```

构建输出末尾应看到：

```
Successfully built xxxxxx
Successfully tagged tlias-web-management:latest
```

---

## 四、验证镜像

```bash
# 检查 /app/ 目录下是否有 app.jar
docker run --rm --entrypoint ls tlias-web-management:latest -la /app/
```

如果看到 `app.jar`，说明构建成功。

---

## 五、导出并上传到服务器

### 方式一：tar 包直传（推荐，单台服务器）

```bash
# 1. 本地导出镜像为 tar 文件
docker save tlias-web-management:latest -o tlias-web-management.tar

# 2. 上传到服务器（替换为你的服务器 IP）
scp tlias-web-management.tar root@你的服务器IP:/opt/tlias/

# 3. 同时上传部署配置文件
scp docker-compose.yml root@你的服务器IP:/opt/tlias/
scp doc/init.sql root@你的服务器IP:/opt/tlias/
```

### 方式二：镜像仓库（多台服务器 / CI/CD）

```bash
# 1. 打标签
docker tag tlias-web-management:latest registry.cn-hangzhou.aliyuncs.com/你的命名空间/tlias-web-management:latest

# 2. 登录并推送
docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com
docker push registry.cn-hangzhou.aliyuncs.com/你的命名空间/tlias-web-management:latest
```

---

## 六、服务器上部署

### 6.1 登录服务器

```bash
ssh root@你的服务器IP
```

### 6.2 导入镜像

```bash
# tar 方式
cd /opt/tlias
docker load -i tlias-web-management.tar

# 或仓库方式
docker pull registry.cn-hangzhou.aliyuncs.com/你的命名空间/tlias-web-management:latest
```

### 6.3 启动服务

```bash
# 首次部署（需要初始化数据库）
docker compose down -v    # 清理旧容器和数据卷
docker compose up -d      # 启动所有服务，自动执行 init.sql

# 后续更新（保留数据）
docker compose down       # 仅停止容器
docker compose up -d      # 重建容器
```

### 6.4 验证部署

```bash
# 查看容器状态
docker ps

# 查看应用日志
docker logs tlias-app --tail 50

# 测试登录 API
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

---

## 七、常用命令速查

### 7.1 Docker 基础命令

| 命令 | 用途 |
|------|------|
| `docker build -t <name>:<tag> .` | 构建镜像 |
| `docker images` | 查看镜像列表 |
| `docker rmi <image-id>` | 删除镜像 |
| `docker save <name>:<tag> -o <file>.tar` | 导出镜像为 tar |
| `docker load -i <file>.tar` | 导入 tar 为镜像 |
| `docker ps` | 查看运行中的容器 |
| `docker ps -a` | 查看所有容器（含已停止） |
| `docker logs <container>` | 查看容器日志 |
| `docker logs -f <container>` | 实时跟踪日志 |
| `docker exec -it <container> <cmd>` | 在容器内执行命令 |
| `docker restart <container>` | 重启容器 |
| `docker stop <container>` | 停止容器 |
| `docker rm <container>` | 删除容器 |
| `docker cp <src> <container>:<dst>` | 复制文件到容器 |

### 7.2 Docker Compose 命令

| 命令 | 用途 |
|------|------|
| `docker compose up -d` | 后台启动所有服务 |
| `docker compose down` | 停止并删除容器、网络 |
| `docker compose down -v` | 同上，额外删除数据卷（数据全清） |
| `docker compose logs -f` | 查看所有服务实时日志 |
| `docker compose ps` | 查看服务状态 |
| `docker compose restart` | 重启所有服务 |

### 7.3 MySQL 容器操作

```bash
# 测试 MySQL 连接
docker exec tlias-mysql mysqladmin ping -uroot -p000000

# 查询数据
docker exec tlias-mysql mysql -uroot -p000000 -e "USE tlias; SELECT * FROM emp;"

# 进入交互式命令行
docker exec -it tlias-mysql mysql -uroot -p000000
```

---

## 八、常见问题排查

### 8.1 容器一直 Restarting

```bash
docker logs tlias-app
```

常见原因：JAR 不存在、MySQL 连接失败、端口被占用。

### 8.2 浏览器能打开页面但无法登录

检查浏览器 DevTools（F12）→ Network 标签，看 `/login` 请求的目标地址。

如果请求发往 `http://localhost:8080/login`，说明 `config.js` 中的 `BASE_URL` 还是 `'http://localhost:8080'`，需要改为 `''`。

### 8.3 数据库需要重新初始化

```bash
docker compose down -v
docker compose up -d
```

`-v` 会删除 MySQL 数据卷，下次启动自动执行 `init.sql`。

### 8.4 端口被占用

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8081:8080"   # 宿主机 8081 → 容器 8080
```

### 8.5 防火墙阻止外部访问

```bash
# 开放端口
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload
```

云服务器还需在控制台安全组添加入站规则。

---

## 九、完整部署流程（精简版）

```bash
# ===== 本地 =====
cd E:\aaaWS\vscode_ws\java_ws\Tlias_lcx
docker build -t tlias-web-management:latest .
docker save tlias-web-management:latest -o tlias-web-management.tar
scp tlias-web-management.tar root@服务器IP:/opt/tlias/
scp docker-compose.yml root@服务器IP:/opt/tlias/
scp doc/init.sql root@服务器IP:/opt/tlias/

# ===== 服务器 =====
ssh root@服务器IP
cd /opt/tlias
docker load -i tlias-web-management.tar
docker compose down -v
docker compose up -d
docker ps
docker logs tlias-app --tail 20
```

浏览器访问 `http://服务器IP:8080`，用 `admin` / `123456` 登录。
