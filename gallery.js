/**
 * 电商图片下载插件 - 展示/下载页逻辑 (gallery.js)
 * 职责：
 *   1. 从扩展 storage 读取图片列表
 *   2. 网格展示缩略图 + 尺寸 + 复选框
 *   3. 全选 / 反选 / 已选计数
 *   4. 把勾选的图片发给 background 批量下载并展示进度
 */
'use strict';

const STORAGE_KEY = 'imagegrab_images';
let images = [];          // 图片 URL 数组
let selected = new Set(); // 已选下标集合

const galleryEl = document.getElementById('gallery');
const emptyEl = document.getElementById('empty');
const countEl = document.getElementById('selected-count');
const progressEl = document.getElementById('progress');
const progressFillEl = document.getElementById('progress-fill');
const progressTextEl = document.getElementById('progress-text');

// ---------- 读取图片列表 ----------
async function loadImages() {
  let data = null;
  try {
    data = await chrome.storage.session.get(STORAGE_KEY);
  } catch (e) {
    data = await chrome.storage.local.get(STORAGE_KEY);
  }
  images = data[STORAGE_KEY] || [];
  if (images.length === 0) {
    emptyEl.classList.remove('hidden');
    return;
  }
  render();
}

// ---------- 渲染网格 ----------
function render() {
  galleryEl.innerHTML = '';
  images.forEach(function (url, index) {
    const card = document.createElement('div');
    card.className = 'card';

    const label = document.createElement('label');
    label.className = 'card-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.index = String(index);
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) {
        selected.add(index);
      } else {
        selected.delete(index);
      }
      updateCount();
    });

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const img = document.createElement('img');
    img.src = url;
    img.alt = '商品图_' + String(index + 1).padStart(3, '0');
    img.loading = 'lazy';
    img.addEventListener('load', function () {
      const sizeEl = card.querySelector('.size');
      if (sizeEl) {
        sizeEl.textContent = img.naturalWidth + '×' + img.naturalHeight;
      }
      // 加载后仍小于 100x100 的图给个弱化提示（保留展示，由用户决定）
      if (img.naturalWidth > 0 && img.naturalWidth < 100) {
        card.classList.add('small');
      }
    });
    img.addEventListener('error', function () {
      thumb.classList.add('broken');
      img.alt = '加载失败';
    });
    thumb.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const seq = document.createElement('span');
    seq.className = 'seq';
    seq.textContent = '商品图_' + String(index + 1).padStart(3, '0') + '.png';
    const size = document.createElement('span');
    size.className = 'size';
    size.textContent = '加载中…';
    meta.appendChild(seq);
    meta.appendChild(size);

    label.appendChild(checkbox);
    label.appendChild(thumb);
    label.appendChild(meta);
    card.appendChild(label);
    galleryEl.appendChild(card);
  });
  updateCount();
}

// ---------- 计数更新 ----------
function updateCount() {
  countEl.textContent = '已选 ' + selected.size + ' / ' + images.length;
}

// ---------- 全选 / 反选 ----------
function selectAll() {
  selected.clear();
  images.forEach(function (_, i) { selected.add(i); });
  syncCheckboxes();
}

function selectInverse() {
  const next = new Set();
  images.forEach(function (_, i) {
    if (!selected.has(i)) next.add(i);
  });
  selected = next;
  syncCheckboxes();
}

function syncCheckboxes() {
  galleryEl.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    cb.checked = selected.has(Number(cb.dataset.index));
  });
  updateCount();
}

// ---------- 批量下载 ----------
function showProgress(percent, text) {
  progressEl.classList.remove('hidden');
  progressFillEl.style.width = percent + '%';
  progressTextEl.textContent = text;
}

async function downloadSelected() {
  const urls = images.filter(function (_, i) { return selected.has(i); });
  if (urls.length === 0) {
    alert('请先勾选要下载的图片');
    return;
  }
  showProgress(0, '准备下载 ' + urls.length + ' 张图片…');
  let result = null;
  try {
    result = await chrome.runtime.sendMessage({
      type: 'downloadImages',
      urls: urls
    });
  } catch (e) {
    showProgress(0, '下载失败：' + e.message);
    return;
  }
  if (!result || !result.success) {
    showProgress(0, '下载失败：' + (result ? result.error : '未知错误'));
    return;
  }
  const percent = Math.round((result.okCount / result.total) * 100);
  showProgress(percent, '完成：成功 ' + result.okCount + ' 张，失败 ' + result.failedCount + ' 张');
  if (result.failedCount > 0) {
    console.warn('[ImageGrab] 失败明细：', result.results.filter(function (r) { return !r.ok; }));
  }
}

// ---------- 事件绑定 ----------
document.getElementById('select-all').addEventListener('click', selectAll);
document.getElementById('select-inverse').addEventListener('click', selectInverse);
document.getElementById('download-selected').addEventListener('click', downloadSelected);

// ---------- 启动 ----------
loadImages();
