#!/usr/bin/env node
/**
 * 一键打包压缩脚本：
 * 1. 执行 build 流程编译生成 dist 目录
 * 2. 将 dist 目录打包为 dist.zip 压缩包
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync, execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const zipPath = path.join(root, "dist.zip");

// 1. 构建
execFileSync(process.execPath, [path.join(root, "scripts/build.mjs")], {
  cwd: root,
  stdio: "inherit",
});

// 2. 清理旧压缩包
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 3. 压缩
console.log("\n>>> 正在生成 dist.zip 压缩包...");
try {
  execSync("zip -q -r dist.zip dist", { cwd: root });
  const stat = fs.statSync(zipPath);
  console.log(
    `✔ 打包完成！已生成 dist.zip (${(stat.size / 1024 / 1024).toFixed(2)} MB)`
  );
  console.log(`>>> 可直接上传 dist.zip 到服务器解压部署使用。\n`);
} catch (error) {
  console.error("压缩失败，请确保系统已安装 zip 工具：", error.message);
  process.exit(1);
}
