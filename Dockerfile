# ============================================================
# Dockerfile - 天狼星（Tlias）学员管理系统多阶段构建镜像
# ============================================================

# -------------------- 第一阶段：构建 --------------------
# 使用带 JDK 的 Alpine 镜像（Maven 通过项目自带的 mvnw 下载）
FROM eclipse-temurin:17-jdk-alpine AS builder

# 安装 curl（mvnw 需要 curl 来下载 Maven）
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /app

# 先复制 Maven Wrapper（mvnw、mvnw.cmd、.mvn 目录）
# 单独复制以便利用 Docker 缓存层
COPY tlias-web-management/mvnw .
COPY tlias-web-management/mvnw.cmd .
COPY tlias-web-management/.mvn ./.mvn

# 确保 mvnw 有执行权限（Windows 下 Git 保存的文件缺少 +x）
RUN chmod +x mvnw

# 复制 pom.xml（单独复制，pom.xml 不变则缓存命中）
COPY tlias-web-management/pom.xml .

# 下载项目依赖并缓存到本地仓库
RUN ./mvnw dependency:go-offline -B

# 复制项目源码
COPY tlias-web-management/src ./src

# 执行 Maven 打包，跳过测试以加速构建
RUN ./mvnw clean package -DskipTests -U


# -------------------- 第二阶段：运行 --------------------
# 使用轻量级 JRE 运行镜像，大幅减小最终镜像体积
FROM eclipse-temurin:17-jre-alpine

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物（可执行 fat JAR）
COPY --from=builder /app/target/*.jar app.jar

# 创建文件上传目录（与 application.yaml 中 UPLOAD_PATH 默认值保持一致）
RUN mkdir -p /data/uploads

# 声明容器运行时监听的端口
EXPOSE 8080

# 容器启动入口
ENTRYPOINT ["java", "-jar", "app.jar"]
