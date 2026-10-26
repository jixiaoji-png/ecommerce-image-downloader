---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 7f04b5e7c98af89451e8d7aaef427a6f_6cbde05cd10e11f18104525400d4ab64
    ReservedCode1: C+TgdSM8xPOm3hbkkEj2PXPvjc36RUGHWdt4qVSilJSt4o3cm+NP+w8SHmYyWGU8o1hZSo88tG/OG6YHKWELEqjulx6T8Hqa6LWC0hxoXlNPlho5ZNkjJbTcK15N/j37IFCKmTPZ6z1N02TPo7IpW3b3fuEF9tOxPq3tXZ63lU1N1nixGW00YpMEfX0=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 7f04b5e7c98af89451e8d7aaef427a6f_6cbde05cd10e11f18104525400d4ab64
    ReservedCode2: C+TgdSM8xPOm3hbkkEj2PXPvjc36RUGHWdt4qVSilJSt4o3cm+NP+w8SHmYyWGU8o1hZSo88tG/OG6YHKWELEqjulx6T8Hqa6LWC0hxoXlNPlho5ZNkjJbTcK15N/j37IFCKmTPZ6z1N02TPo7IpW3b3fuEF9tOxPq3tXZ63lU1N1nixGW00YpMEfX0=
---

# 电商图片下载插件 ImageGrab

一个基于 **Chrome Manifest V3** 的电商图片提取下载插件。在淘宝、天猫、京东、拼多多商家版的商品详情页右下角悬浮「获取图片」按钮，一键提取页面所有商品图片，集中展示、勾选并批量下载为 PNG。

## 功能亮点

- **一键提取**：详情页右下角悬浮按钮，点击即扫描页面全部商品图片。
- **智能过滤**：自动过滤图标、Logo、占位图、1×1 及小于 100×100 的小图，并去重、补全相对路径。
- **全面抓取**：覆盖 `<img>`、`srcset`、`data-src`、`data-lazy-src` 等懒加载属性，以及 `background-image` 背景图。
- **批量下载**：新页面网格化展示，支持全选 / 反选 / 已选计数 / 下载选中。
- **统一转 PNG**：jpg / webp 等格式经 `fetch + createImageBitmap + OffscreenCanvas` 统一转为 PNG，文件名按 `商品图_001.png` 规则编号。
- **多平台支持**：淘宝、天猫、京东、拼多多、拼多多商家版（含移动版）。

## 目录结构

```
ecommerce-image-downloader/
├── manifest.json          # 插件清单（Manifest V3）
├── content.js             # 内容脚本：注入按钮 + 提取图片
├── content.css            # 悬浮按钮样式
├── background.js          # Service Worker：抓图转 PNG + 批量下载
├── gallery.html           # 图片展示/下载页
├── gallery.js             # 展示/下载页逻辑
├── gallery.css            # 展示/下载页样式
├── icons/                 # 插件图标（16/48/128）
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── docs/                  # 插件介绍静态官网
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
├── README.md
└── .gitignore
```

## 安装使用

1. 将本项目文件夹解压/复制到本地任意位置。
2. 打开 Chrome，地址栏输入 `chrome://extensions` 并回车。
3. 打开页面右上角「开发者模式」开关。
4. 点击「加载已解压的扩展程序」，选择本项目文件夹。
5. 打开淘宝 / 天猫 / 京东 / 拼多多任一**商品详情页**，点击右下角「获取图片」。
6. 在新打开的页面中勾选图片，点击「下载选中」，图片将保存到浏览器默认下载目录（文件名 `商品图_001.png` 等）。

## 权限说明

| 权限 | 用途 |
| --- | --- |
| `activeTab` | 访问当前活动标签页 |
| `scripting` | 脚本注入与执行 |
| `downloads` | 保存下载的图片文件 |
| `storage` | 暂存提取到的图片列表（session 级） |
| `host_permissions` | 访问淘宝/天猫/京东/拼多多等目标站点图片资源 |

## 技术说明

- 使用 **Manifest V3** + Service Worker，无远程代码，数据仅在浏览器本地处理。
- 图片转 PNG 若遇跨域问题：`background.js` 通过 `fetch + createImageBitmap + OffscreenCanvas` 处理，`host_permissions` 已覆盖目标平台域名。
- 插件仅面向电商商品详情页自动显示按钮（通过 URL 特征判断），其他页面不注入。

## 免责声明

本插件仅供学习与技术演示使用，请遵守目标平台的服务条款，勿用于商业侵权用途。
*（内容由AI生成，仅供参考）*
