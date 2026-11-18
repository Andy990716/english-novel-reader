(function () {
  'use strict';
  const key = 'novel-reader-bookmarks-v1';
  const $ = id => document.getElementById(id);
  let bookmarks = [], lastRoute = '';
  const make = (...args) => window.NovelReader.make(...args);
  function loadBookmarks() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      bookmarks = Array.isArray(saved) ? saved.filter(mark => mark && Number.isInteger(mark.chapter) && Number.isInteger(mark.paragraph) && mark.paragraph >= 0 && typeof mark.label === 'string') : [];
    } catch (_) { bookmarks = []; }
  }
  function write(next) {
    try { localStorage.setItem(key, JSON.stringify(next)); bookmarks = next; return true; }
    catch (_) { window.NovelReader.notice('書籤無法儲存，請確認瀏覽器允許儲存資料。'); return false; }
  }
  function addBookmark(index) {
    const chapter = window.NovelReader.getChapter();
    const paragraphs = Array.from(document.querySelectorAll('#reader .paragraphs p'));
    const paragraph = Number.isInteger(index) ? index : window.NovelReader.position()?.paragraph;
    if (!chapter || !paragraphs[paragraph]) return;
    loadBookmarks();
    const id = chapter + '-' + paragraph;
    if (bookmarks.some(mark => mark.id === id)) { window.NovelReader.notice('這一段已經在書籤裡了。'); return; }
    const label = paragraphs[paragraph].textContent.slice(0, 120);
    if (write(bookmarks.concat({ id, chapter, paragraph, label, createdAt: Date.now() }))) {
      $('bookmarkStatus').textContent = '已儲存第 ' + (paragraph + 1) + ' 段，可從上方「書籤」返回。';
      window.NovelReader.notice('已儲存這一段書籤');
    }
  }
  function renderBookmarks() {
    loadBookmarks();
    const box = $('bookmarkList'); box.replaceChildren();
    $('bookmarkCount').textContent = bookmarks.length + ' 則';
    if (!bookmarks.length) {
      box.append(make('p', 'empty-state', '把喜歡的句子留在這裡。閱讀時點段落旁的「＋」，下次一鍵返回。'));
      return;
    }
    bookmarks.slice().reverse().forEach(mark => {
      const row = make('div', 'bookmark-row');
      const button = make('button', 'bookmark-open');
      button.append(make('span', 'eyebrow', 'CHAPTER ' + mark.chapter + ' · 第 ' + (mark.paragraph + 1) + ' 段'), make('span', 'bookmark-excerpt', mark.label));
      button.onclick = () => window.NovelReader.open(mark.chapter, false, { paragraph: mark.paragraph });
      const remove = make('button', 'navbtn bookmark-remove', '刪除');
      remove.setAttribute('aria-label', '刪除 Chapter ' + mark.chapter + ' 第 ' + (mark.paragraph + 1) + ' 段書籤');
      remove.onclick = () => {
        loadBookmarks();
        if (write(bookmarks.filter(item => item.id !== mark.id))) renderBookmarks();
      };
      row.append(button, remove); box.append(row);
    });
  }
  function renderContents() {
    const list = window.NOVEL_CATALOG;
    const state = window.NovelReader.getState();
    const query = $('chapterSearch').value.trim().toLocaleLowerCase();
    const chapters = list.filter(ch => (ch.id + ' ' + ch.title + ' chapter ' + ch.id + ' 第' + ch.id + '章').toLocaleLowerCase().includes(query));
    $('homeContents').replaceChildren();
    $('chapterCount').textContent = list.length + ' chapters';
    $('searchStatus').textContent = query ? '找到 ' + chapters.length + ' 個章節' : '';
    if (!chapters.length) $('homeContents').append(make('p', 'empty-state', '沒有符合的章節，試試其他標題或編號。'));
    chapters.forEach(chapter => {
      const link = make('a', 'chapter-card'); link.href = '#chapter-' + chapter.id;
      if (chapter.image) {
        const image = make('img', 'chapter-thumbnail'); image.src = chapter.image; image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.width = 1672; image.height = 941;
        link.append(image);
      }
      const body = make('div', 'chapter-card-body');
      const kicker = make('div', 'chapter-card-meta');
      kicker.append(make('span', 'eyebrow', 'CHAPTER ' + String(chapter.id).padStart(2, '0')));
      if (chapter.id === list.at(-1).id) kicker.append(make('span', 'new-label', '最新章'));
      body.append(kicker, make('h3', '', chapter.title));
      const pct = Math.max(0, Math.min(100, Number(state.percentages[chapter.id]) || 0));
      body.append(make('span', 'muted', pct >= 98 ? '已讀完' : pct > 0 ? '已讀 ' + pct + '%' : '開始閱讀 →'));
      const track = make('div', 'card-progress'); const fill = make('span'); fill.style.width = pct + '%'; track.append(fill); body.append(track);
      link.append(body); $('homeContents').append(link);
    });
    const last = list.find(ch => ch.id === Number(state.chapter)) || list[0];
    const hasProgress = Number(state.positions[last.id]) > 0 || state.anchors[last.id];
    $('resumeLabel').textContent = hasProgress ? '上次讀到 Chapter ' + last.id + ' · ' + last.title : '從第一章開始，慢慢走進這個世界。';
    $('continueReading').textContent = hasProgress ? '繼續閱讀 Chapter ' + last.id + ' →' : '開始閱讀 →';
  }
  function route(initial = false) {
    const hash = location.hash || '#home';
    if (!initial && hash === lastRoute && !$('readingView').hidden && hash === '#chapter-' + window.NovelReader.getChapter()) return;
    lastRoute = hash;
    const match = hash.match(/^#chapter-(\d+)$/);
    if (match && window.NOVEL_CATALOG.some(ch => ch.id === Number(match[1]))) {
      window.NovelReader.open(Number(match[1]), initial);
      return;
    }
    window.NovelReader.leave();
    $('libraryHome').hidden = false; $('readingView').hidden = true;
    $('progress').style.width = '0%';
    document.title = '我的遊戲角色有問題！ · English Reader';
    renderContents(); renderBookmarks();
    if (match) { history.replaceState(null, '', '#home'); window.NovelReader.notice('這個章節還沒上線，請從目錄選擇。'); }
    const target = hash === '#contents' ? $('contents') : hash === '#bookmarks' ? $('bookmarks') : $('libraryHome');
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  function init() {
    $('chapterSearch').addEventListener('input', renderContents);
    $('continueReading').onclick = () => window.NovelReader.open(Number(window.NovelReader.getState().chapter) || 1, true);
    $('addBookmark').onclick = () => addBookmark();
    window.addEventListener('hashchange', () => route());
    window.addEventListener('storage', event => { if (event.key === key && !$('libraryHome').hidden) renderBookmarks(); });
    route(true);
  }
  window.NovelLibrary = { init, addBookmark };
})();
