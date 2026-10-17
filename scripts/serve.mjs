#!/usr/bin/env node
/**
 * 零依赖高性能纯原生 Node.js 静态文件服务器
 * - 支持 dist 目录（构建后）和 site 目录（开发时）优先判断
 * - 支持 Gzip 动态压缩
 * - 支持 SPA Hash 与 Clean URL 路由解析
 * - 支持 304 Not Modified 缓存优化
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const siteDir = path.join(root, "site");
const targetDir = fs.existsSync(distDir) ? distDir : siteDir;

const PORT = Number(process.env.PORT || process.argv[2] || 8080);
const HOST = process.env.HOST || "0.0.0.0";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function resolveFilePath(reqUrl) {
  let decodedPath = "";
  try {
    decodedPath = decodeURIComponent(new URL(reqUrl, "http://localhost").pathname);
  } catch {
    return null;
  }

  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  let fullPath = path.join(targetDir, safePath);

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  const indexPath = path.join(fullPath, "index.html");
  if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
    return indexPath;
  }

  const htmlPath = `${fullPath}.html`;
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return htmlPath;
  }

  // SPA fallback
  const fallbackIndex = path.join(targetDir, "index.html");
  if (fs.existsSync(fallbackIndex)) {
    return fallbackIndex;
  }

  return null;
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    return res.end("Method Not Allowed");
  }

  const filePath = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("404 Not Found");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const stat = fs.statSync(filePath);

  const headers = {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };

  // 静态缓存控制
  if (req.url.includes("/fonts/") || req.url.includes("/assets/")) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else {
    headers["Cache-Control"] = "no-cache";
  }

  // 304 缓存优化
  const etag = `"${stat.size}-${stat.mtimeMs.toString(16)}"`;
  headers["ETag"] = etag;

  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }

  if (req.method === "HEAD") {
    headers["Content-Length"] = stat.size;
    res.writeHead(200, headers);
    return res.end();
  }

  // Gzip 压缩文本与代码类资源
  const acceptEncoding = req.headers["accept-encoding"] || "";
  const compressible = /text|javascript|json|xml|svg/i.test(contentType);

  if (compressible && acceptEncoding.includes("gzip")) {
    headers["Content-Encoding"] = "gzip";
    res.writeHead(200, headers);
    const raw = fs.createReadStream(filePath);
    const gzip = zlib.createGzip({ level: 6 });
    raw.pipe(gzip).pipe(res);
  } else {
    headers["Content-Length"] = stat.size;
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(PORT, HOST, () => {
  const dirName = path.relative(root, targetDir) || ".";
  console.log(`\n======================================================`);
  console.log(`🚀 重庆璀泊科技 · 豆包工作实战蓝皮书 本地服务器已启动`);
  console.log(`📂 托管目录: ${dirName}`);
  console.log(`🌐 本地访问: http://localhost:${PORT}`);
  console.log(`🌐 局域网访问: http://${HOST === "0.0.0.0" ? "127.0.0.1" : HOST}:${PORT}`);
  console.log(`======================================================\n`);
});
