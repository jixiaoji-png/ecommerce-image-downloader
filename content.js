/**
 * 电商图片下载插件 - 内容脚本 (content.js)
 * 职责：
 *   1. 仅在目标电商商品详情页右下角注入悬浮「获取图片」按钮
 *   2. 点击后扫描页面所有商品图片（img/srcset/data-src/懒加载/背景图）
 *   3. 过滤图标、logo、占位图、1x1、小于100x100 的图片，去重并补全 URL
 *   4. 将图片列表写入扩展 storage，并打开 gallery 展示/下载页
 */
(function () {
  'use strict';

  // ---------- 详情页 URL 特征（仅商品详情页显示按钮） ----------
  const DETAIL_PATTERNS = [
    /\.taobao\.com\/item\//i,                // 淘宝 PC 详情页
    /\.tmall\.com\/item\//i,                 // 天猫详情页
    /\.jd\.com\/item\//i,                    // 京东详情页
    /detail\.pinduoduo\.com\//i,             // 拼多多商家版详情页
    /\.pinduoduo\.com\/goods/i,
    /mobile\.yangkeduo\.com\//i              // 拼多多移动版
  ];

  function isDetailPage() {
    return DETAIL_PATTERNS.some(function (re) { return re.test(location.href); });
  }

  // ---------- 悬浮按钮 ----------
  let button = null;

  function createButton() {
    if (button) return button;
    button = document.createElement('button');
    button.id = 'imagegrab-btn';
    button.type = 'button';
    button.textContent = '获取图片';
    button.addEventListener('click', onFetchClick);
    document.body.appendChild(button);
    return button;
  }

  // ---------- 工具函数 ----------

  // 把相对路径/协议相对路径补全为绝对 URL
  function resolveUrl(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s || s.startsWith('data:')) return null;
    try {
      return new URL(s, location.href).href;
    } catch (e) {
      return null;
    }
  }

  // 过滤明显非商品图的关键词
  function shouldFilter(url) {
    if (!url) return true;
    const low = url.toLowerCase();
    if (/(icon|logo|avatar|placeholder|sprite|qrcode|favicon|emoji|banner|badge|\.svg$)/.test(low)) {
      return true;
    }
    return false;
  }

  // 解析 srcset="url 1x, url 2x" 提取所有 url
  function parseSrcset(srcset) {
    const urls = [];
    if (!srcset) return urls;
    String(srcset).split(',').forEach(function (part) {
      const trimmed = part.trim();
      if (!trimmed) return;
      const first = trimmed.split(/\s+/)[0];
      if (first) urls.push(first);
    });
    return urls;
  }

  // ---------- 核心：提取图片 ----------
  function collectImages() {
    const urls = new Set();

    // 1) img 标签：src / currentSrc / srcset / 常见懒加载属性
    document.querySelectorAll('img').forEach(function (img) {
      const candidates = [];

      if (img.currentSrc) candidates.push(img.currentSrc);
      if (img.src && img.src.indexOf('data:') !== 0) candidates.push(img.src);
      const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
      if (srcset) candidates.push.apply(candidates, parseSrcset(srcset));

      ['data-src', 'data-lazy-src', 'data-original', 'data-actualsrc',
       'data-ks-lazyload', 'data-lazyload', 'data-srcset'].forEach(function (attr) {
        const v = img.getAttribute(attr);
        if (v) {
          if (attr === 'data-srcset') {
            candidates.push.apply(candidates, parseSrcset(v));
          } else {
            candidates.push(v);
          }
        }
      });

      // 自然尺寸已知时过滤小图（<100x100）；未知则交给 URL 关键词过滤
      const w = img.naturalWidth || parseInt(img.getAttribute('data-width') || '0', 10);
      const h = img.naturalHeight || parseInt(img.getAttribute('data-height') || '0', 10);
      const tooSmall = w > 0 && h > 0 && (w < 100 || h < 100);

      candidates.forEach(function (raw) {
        const url = resolveUrl(raw);
        if (!url) return;
        if (tooSmall) return;
        if (shouldFilter(url)) return;
        urls.add(url);
      });
    });

    // 2) 背景图 background-image（含多背景）
    document.querySelectorAll('*').forEach(function (el) {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return;
      const re = /url\(\s*["']?(.*?)["']?\s*\)/g;
      let m = null;
      while ((m = re.exec(bg)) !== null) {
        const url = resolveUrl(m[1]);
        if (!url || shouldFilter(url)) continue;
        urls.add(url);
      }
    });

    // 3) 懒加载占位容器（div 上带 data-src / data-original 的典型电商场景）
    document.querySelectorAll('[data-src],[data-original],[data-lazy-src]').forEach(function (el) {
      if (el.tagName === 'IMG') return; // img 已在上面处理
      ['data-src', 'data-original', 'data-lazy-src'].forEach(function (attr) {
        const v = el.getAttribute(attr);
        if (!v) return;
        const url = resolveUrl(v);
        if (!url || shouldFilter(url)) return;
        urls.add(url);
      });
    });

    return Array.from(urls);
  }

  // ---------- 点击按钮：保存图片列表并打开 gallery ----------
  async function onFetchClick() {
    const images = collectImages();
    if (images.length === 0) {
      alert('未提取到商品图片，请确认当前页面是商品详情页');
      return;
    }
    try {
      // session 存储：关闭浏览器自动清空
      await chrome.storage.session.set({ imagegrab_images: images });
    } catch (e) {
      await chrome.storage.local.set({ imagegrab_images: images });
    }
    const galleryUrl = chrome.runtime.getURL('gallery.html');
    window.open(galleryUrl, '_blank');
  }

  // ---------- 启动 ----------
  if (isDetailPage()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createButton);
    } else {
      createButton();
    }
  }
})();
