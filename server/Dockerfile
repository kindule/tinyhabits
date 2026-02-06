# 微信云托管 Dockerfile

# 第一阶段：获取 Git Commit ID
FROM alpine/git:latest AS git-info
WORKDIR /repo
COPY .git .git
RUN git rev-parse --short HEAD > /commit_id.txt

# 第二阶段：构建应用
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置 npm 镜像源加速（国内构建）
RUN npm config set registry https://registry.npmmirror.com

# 先复制依赖文件，利用 Docker 缓存层
COPY package*.json ./

# 安装生产依赖（不安装 devDependencies）
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY src/ ./src/

# 从第一阶段复制 commit ID
COPY --from=git-info /commit_id.txt ./commit_id.txt

# 微信云托管要求监听 80 端口
ENV PORT=80
ENV NODE_ENV=production

# 暴露端口
EXPOSE 80

# 健康检查（可选，云托管有自己的健康检查机制）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/api/health || exit 1

# 启动应用
CMD ["node", "src/server.js"]
