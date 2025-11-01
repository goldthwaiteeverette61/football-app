# 使用官方Nginx镜像作为基础镜像
FROM nginx:alpine

# 设置维护者信息
LABEL maintainer="ScoreRED Team"
LABEL version="1.2.0"
LABEL description="ScoreRED Web Application"

# 复制Web应用文件到Nginx默认目录
COPY dist/ /usr/share/nginx/html/

# 复制自定义Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建日志目录
RUN mkdir -p /var/log/nginx

# 暴露端口
EXPOSE 80

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
