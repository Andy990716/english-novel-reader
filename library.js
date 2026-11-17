(function () {
  'use strict';
  const bookmarkKey = 'novel-reader-bookmarks-v1';
  const progressKey = 'novel-reader-progress-v2';
  let bookmarks = [];
  let pendingBookmark = null;
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }
  function renderBookmarks() {
    const box = document.getElementById('bookmarkList');
    box.replaceChildren();
    if (!bookmarks.length) box.textContent = '還沒有書籤。閱讀時點「加入書籤」即可儲存目前位置。';
    bookmarks.forEach(function (mark) {
      const row = document.createElement('div');
      row.className = 'bookmark-row';
      const link = document.createElement('button');
      link.className = 'chapter-link';
      link.textContent = 'Chapter ' + mark.chapter + ' · ' + mark.label;
      link.onclick = function () {
        pendingBookmark = mark;
        window.NovelReader.open(mark.chapter, false);
        restoreBookmark();
      };
      const remove = document.createElement('button');
      remove.className = 'navbtn';
      remove.textContent = '刪除';
      remove.setAttribute('aria-label', '刪除書籤 ' + mark.label);
      remove.onclick = function () {
        const next = bookmarks.filter(item => item.id !== mark.id);
        try { localStorage.setItem(bookmarkKey, JSON.stringify(next)); bookmarks = next; renderBookmarks(); }
        catch (_) { document.getElementById('bookmarkStatus').textContent = '無法儲存，請確認瀏覽器允許本機儲存。'; }
      };
      row.append(link, remove);
      box.append(row);
    });
  }
  function restoreBookmark() {
    if (!pendingBookmark) return;
    const title = document.querySelector('.chapter-kicker');
    if (!title || Number(title.textContent.replace('CHAPTER ', '')) !== pendingBookmark.chapter) return;
    const mark = pendingBookmark;
    pendingBookmark = null;
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      const paragraph = document.querySelectorAll('#reader .paragraphs p')[mark.paragraph];
      if (paragraph) window.scrollTo(0, Math.max(0, paragraph.getBoundingClientRect().top + window.scrollY - 100));
    })));
  }
  function route() {
    const match = location.hash.match(/^#chapter-(\d+)$/);
    if (match) { window.NovelReader.open(Number(match[1]), false); return; }
    document.getElementById('libraryHome').hidden = false;
    document.getElementById('readingView').hidden = true;
    document.title = '我的遊戲角色有問題！ · English Reader';
    renderBookmarks();
    const target = document.querySelector(location.hash === '#contents' ? '#contents' : location.hash === '#bookmarks' ? '#bookmarks' : '#libraryHome');
    target.scrollIntoView();
  }
  window.NovelLibrary = { init: function () {
    const saved = read(bookmarkKey, []);
    bookmarks = Array.isArray(saved) ? saved : [];
    const contents = document.getElementById('homeContents');
    window.NOVEL_CATALOG.forEach(chapter => {
      const link = document.createElement('a');
      link.className = 'chapter-link';
      link.href = '#chapter-' + chapter.id;
      link.textContent = 'Chapter ' + chapter.id + ' — ' + chapter.title;
      contents.append(link);
    });
    document.getElementById('continueReading').onclick = function () {
      const progress = read(progressKey, {});
      window.NovelReader.open(progress.chapter || 1, true);
    };
    document.getElementById('addBookmark').onclick = function () {
      const chapter = Number(location.hash.replace('#chapter-', ''));
      const paragraphs = Array.from(document.querySelectorAll('#reader .paragraphs p'));
      if (!paragraphs.length || !chapter) return;
      let paragraph = paragraphs.findIndex(node => node.getBoundingClientRect().bottom > 110);
      if (paragraph < 0) paragraph = paragraphs.length - 1;
      const label = paragraphs[paragraph].textContent.slice(0, 90);
      const id = chapter + '-' + paragraph;
      const next = bookmarks.filter(mark => mark.id !== id).concat({ id, chapter, paragraph, label });
      try {
        localStorage.setItem(bookmarkKey, JSON.stringify(next)); bookmarks = next;
        document.getElementById('bookmarkStatus').textContent = '已儲存書籤，可從上方「書籤」返回這段。';
      } catch (_) { document.getElementById('bookmarkStatus').textContent = '無法儲存，請確認瀏覽器允許本機儲存。'; }
    };
    new MutationObserver(restoreBookmark).observe(document.getElementById('reader'), { childList: true });
    window.addEventListener('hashchange', route);
    if (!location.hash.startsWith('#chapter-')) route();
  }};
})();
