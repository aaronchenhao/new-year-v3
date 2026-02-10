# 部署架构与通信配置说明

## 1. 1Panel部署架构

### 1.1 部署方式
- **管理端前端**：部署为1Panel的「静态网站」
- **管理端后端**：部署为1Panel的「Node.js应用」
- **用户服务端**：部署为1Panel的「Node.js应用」
- **Redis**：部署为1Panel的「Redis应用」

### 1.2 容器化情况
- **1Panel 3.0+**：使用Docker容器化部署各个应用
- **每个应用**：独立的Docker容器，有自己的网络空间
- **网络通信**：通过Docker网络或主机网络通信

## 2. 前端与后端通信配置

### 2.1 管理端前端配置（推荐方案）
- **当前配置**：使用相对路径 `/admin` 作为API基础URL
- **配置文件**：`admin/client/js/api.js`
  ```javascript
  const API_BASE_URL = '/admin';
  ```

### 2.2 为什么不需要配置IP和端口？
- **相对路径优势**：不需要硬编码IP或域名
- **Nginx反向代理**：通过前端网站的Nginx配置实现路径转发
- **统一域名**：前端和后端通过同一个域名访问，通过路径区分

## 3. Nginx反向代理配置

### 3.1 管理端前端网站配置
在1Panel中，编辑管理端前端网站的Nginx配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /www/wwwroot/horse-universe-admin-frontend;
    index index.html;
    
    # 静态文件配置
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 反向代理到管理端后端
    location /admin {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.2 用户端前端网站配置
同理，编辑用户端前端网站的Nginx配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /www/wwwroot/horse-universe-frontend;
    index index.html;
    
    # 静态文件配置
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 反向代理到用户服务端
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. 用户端前端API配置修改

### 4.1 当前问题
用户端前端 `App.tsx` 中使用了硬编码的API地址：
```javascript
const response = await fetch(`http://172.18.0.2:3001/api/messages/${myHorse.id}`);
```

### 4.2 解决方案
修改为相对路径：
```javascript
const response = await fetch(`/api/messages/${myHorse.id}`);
```

### 4.3 需要修改的位置
- `App.tsx:349`：获取消息的API调用
- `App.tsx:386`：获取统计的API调用
- `App.tsx:518`：提交消息的API调用

## 5. 部署验证

### 5.1 网络通信测试
1. **前端访问**：`http://your-domain.com`
2. **API访问**：`http://your-domain.com/api/stats`
3. **管理端访问**：`http://your-domain.com/admin/health`

### 5.2 容器间通信（Docker网络）
- **容器名称**：1Panel会为每个应用分配容器名称
- **网络配置**：默认使用1Panel创建的Docker网络
- **本地访问**：容器内可以通过 `localhost` 访问主机上的服务

## 6. 常见问题解决

### 6.1 404错误
- **检查**：Nginx配置是否正确
- **验证**：API路径是否正确
- **测试**：直接访问后端服务端口

### 6.2 502错误
- **检查**：后端服务是否运行
- **验证**：后端服务端口是否开放
- **测试**：容器间网络通信是否正常

### 6.3 CORS错误
- **检查**：后端服务是否配置了CORS
- **验证**：Nginx是否正确转发请求头
- **测试**：使用Postman测试API

## 7. 最佳实践

1. **使用相对路径**：避免硬编码IP和域名
2. **配置Nginx反向代理**：统一入口，简化配置
3. **启用HTTPS**：确保数据传输安全
4. **使用环境变量**：管理敏感配置
5. **定期备份**：防止数据丢失

## 8. 部署流程图

```
┌─────────────────────┐
│  浏览器访问          │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Nginx反向代理       │
└──────────┬──────────┘
           ↓
┌─────────────────────┐     ┌─────────────────────┐
│  静态网站（前端）     │────>│  Node.js应用（后端）  │
└─────────────────────┘     └──────────┬──────────┘
                                        ↓
                               ┌─────────────────────┐
                               │  Redis数据库        │
                               └─────────────────────┘
```

## 9. 总结

- **管理端前端**：使用相对路径 `/admin`，通过Nginx反向代理到管理端后端
- **用户端前端**：修改为相对路径 `/api`，通过Nginx反向代理到用户服务端
- **部署优势**：不需要配置IP和端口，部署灵活，易于维护
- **扩展性**：支持多环境部署，便于水平扩展

通过这种配置方式，您可以轻松将项目部署到腾讯云1Panel，无需担心IP和端口配置问题。