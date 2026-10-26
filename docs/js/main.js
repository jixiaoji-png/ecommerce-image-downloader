/**
 * ImageGrab 官网交互脚本 (docs/js/main.js)
 * 功能：移动端菜单开关、滚动导航高亮、平滑滚动兼容
 */
(function () {
  'use strict';

  // 移动端菜单
  var toggle = document.getElementById('nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
      }
    });
  }

  // 滚动时高亮当前 section 对应的导航项
  var sections = document.querySelectorAll('section[id], header[id]');
  var navLinks = document.querySelectorAll('.nav-menu a');

  function highlightNav() {
    var scrollPos = window.scrollY + 120;
    var currentId = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) {
        currentId = sec.id;
      }
    });
    navLinks.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentId) {
        link.classList.add('active');
      }
    });
  }

  if (sections.length && navLinks.length) {
    window.addEventListener('scroll', highlightNav, { passive: true });
    highlightNav();
  }

  // 给导航高亮补充样式（动态加 class 即可，样式在 css 中维护）
  document.addEventListener('click', function (e) {
    if (e.target.classList && e.target.classList.contains('active')) {
      // 无操作，仅为锚点定位
    }
  });
})();
