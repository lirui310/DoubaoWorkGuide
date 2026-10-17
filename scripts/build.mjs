#!/usr/bin/env node
/**
 * 纯静态构建脚本：
 * 1. 自动调用 tools/build-site-index.mjs 更新内容索引
 * 2. 将 site 目录下所有生产静态资源完整拷贝至 dist 目录
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const siteDir = path.join(root, "site");
const distDir = path.join(root, "dist");

console.log(">>> [1/2] 正在生成并验证全书站点索引...");
execFileSync(process.execPath, [path.join(root, "tools/build-site-index.mjs")], {
  cwd: root,
  stdio: "inherit",
});

console.log(">>> [2/2] 正在编译静态资源到 dist/ 目录...");
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursive(siteDir, distDir);

let fileCount = 0;
let totalBytes = 0;
function countDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      countDir(p);
    } else {
      fileCount++;
      totalBytes += fs.statSync(p).size;
    }
  }
}
countDir(distDir);

console.log(
  `\n✔ 构建成功！产物已输出至 dist/ 目录 (共 ${fileCount} 个文件，${(
    totalBytes /
    1024 /
    1024
  ).toFixed(2)} MB)`
);
