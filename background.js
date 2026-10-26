/**
 * 电商图片下载插件 - Service Worker (background.js)
 * 职责：
 *   1. 接收 gallery 页发送的下载请求
 *   2. 逐个抓取图片（fetch + createImageBitmap），统一转 PNG
 *   3. 调用 chrome.downloads.download 保存到浏览器默认下载目录
 *   文件名规则：商品图_001.png（序号补零）
 */
'use strict';

chrome.runtime.onInstalled.addListener(function () {
  console.log('[ImageGrab] 插件已安装，可前往商品详情页点击「获取图片」');
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message && message.type === 'downloadImages') {
    handleDownloadImages(message.urls)
      .then(function (result) { sendResponse(result); })
      .catch(function (err) { sendResponse({ success: false, error: err.message }); });
    return true; // 异步响应
  }
});

/**
 * 将任意图片 URL 转换为 PNG Blob。
 * 使用 OffscreenCanvas（service worker 中无 DOM）完成格式转换。
 */
async function urlToPngBlob(url) {
  const resp = await fetch(url, { credentials: 'include', mode: 'cors' });
  if (!resp.ok) {
    throw new Error('HTTP ' + resp.status);
  }
  const blob = await resp.blob();
  if (blob.type === 'image/png') {
    return blob; // 本来就是 PNG，直接下载
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    return await canvas.convertToBlob({ type: 'image/png' });
  } finally {
    bitmap.close();
  }
}

/** 批量下载：每个 URL 生成 商品图_序号.png */
async function handleDownloadImages(urls) {
  const results = [];
  const total = urls.length;

  for (let i = 0; i < total; i++) {
    const url = urls[i];
    const filename = '商品图_' + String(i + 1).padStart(3, '0') + '.png';
    try {
      const pngBlob = await urlToPngBlob(url);
      const objectUrl = URL.createObjectURL(pngBlob);
      const downloadId = await chrome.downloads.download({
        url: objectUrl,
        filename: filename,
        saveAs: false,
        conflictAction: 'uniquify'
      });
      // 延迟释放 objectURL，确保下载完成
      setTimeout(function () { URL.revokeObjectURL(objectUrl); }, 60 * 1000);
      results.push({ url: url, filename: filename, ok: true, downloadId: downloadId });
    } catch (e) {
      results.push({ url: url, filename: filename, ok: false, error: e.message });
    }
  }

  const okCount = results.filter(function (r) { return r.ok; }).length;
  return {
    success: true,
    total: total,
    okCount: okCount,
    failedCount: total - okCount,
    results: results
  };
}
