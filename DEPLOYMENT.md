# 极简部署指南 · 重庆璀泊科技 豆包工作实战蓝皮书

本项目为 **100% 纯静态现代化知识库（原生轻量 SPA 单页架构）**：
- **完全不依赖任何数据库**（无需 MySQL、Redis、SQLite、MongoDB 等）；
- **完全不依赖任何外部接口或后端服务**；
- **编译打包后即为一套标准的纯静态 Web 产物（HTML + CSS + JS + 资源）**，放上去就能直接运行。

---

## 方式一：一键打包为 zip，传到服务器解压即可（推荐，最省心零门槛）

### 1. 本地执行一键打包
```bash
npm run bundle
```
执行后系统会自动生成并校验站点索引，在项目根目录下输出一个 **`dist.zip`** 压缩包（包含 `dist/` 编译产物）。

### 2. 上传到服务器并解压
无论您的服务器使用的是 **宝塔面板**、**1Panel**、**Nginx**、**Apache** 还是 **Caddy**：
1. 新建一个静态网站站点。
2. 将 `dist.zip` 上传至网站根目录并解压（将 `dist` 文件夹内的文件解压到网站根目录下）。
3. 如果使用 Nginx，推荐在站点配置中增加静态缓存与 SPA 路由支持：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /var/www/cuibo-doubao-guide/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(?:woff2?|ttf|png|jpe?g|svg|mp4)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```
4. 保存配置，立即生效！打开浏览器即可顺畅访问。

---

## 方式二：使用项目内置的高性能 HTTP 静态服务（无需安装 Nginx）

项目中已经内置了一个**纯原生、零外部依赖的高性能 Node.js 生产级静态服务**（位于 `scripts/serve.mjs`），支持自动 Gzip 压缩、SPA 路由 Fallback 与 304 ETag 缓存优化。

如果您的服务器上安装了 Node.js 环境（>= 18）：

```bash
# 1. 编译静态产物到 dist/ 目录
npm run build

# 2. 启动静态服务（默认端口 8080）
npm run serve

# 也可以自定义端口启动，例如 80 端口：
node scripts/serve.mjs 80
```

如果需要后台长期守护运行，推荐使用 **PM2**：
```bash
# 启动常驻服务
pm2 start scripts/serve.mjs --name "cuibo-doubao" -- 8080

# 保存开机自启动状态
pm2 save
pm2 startup
```

---

## 架构特性与企业安全说明

1. **绝对离线与内网可用**：所有字体（Inter 自托管）、品牌样式、渲染脚本、图片与视频素材全部打包在产物内部，完全不依赖外网第三方 CDN。
2. **极高承载能力**：纯静态资源直接由 Web 服务器发送（或通过原生 Gzip 压缩传输），1 核 1G 内存的入门级云服务器即可轻松支撑企业全员与外部客户的高并发访问。
3. **数据隐私合规**：已彻底剥离云端分析接口，全站不采集任何用户设备隐私信息，不向任何第三方上报数据，完全符合企业数据安全合规要求。
