(function () {
  'use strict';
  const book = document.documentElement.dataset.book;
  const key = book ? 'novel-reader-progress-v2-' + book : 'novel-reader-progress-v2';
  const data = new Map(), loads = new Map();
  let list = [], current = null, loaded = false, navigation = 0, gesture = 0;
  let saveTimer = 0, noticeTimer = 0, paragraphs = [];
  const state = { theme: 'light', size: 18, vocab: true, chapter: 1, positions: {}, anchors: {}, percentages: {}, font: 'serif', lineHeight: '1.9', art: true };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    if (saved && typeof saved === 'object') Object.assign(state, saved);
  } catch (_) {}
  for (const field of ['positions', 'anchors', 'percentages']) {
    if (!state[field] || typeof state[field] !== 'object' || Array.isArray(state[field])) state[field] = {};
  }
  state.size = Math.max(15, Math.min(28, Number(state.size) || 18));
  if (!['light', 'dark', 'sepia'].includes(state.theme)) state.theme = 'light';
  if (!['1.7', '1.9', '2.2'].includes(String(state.lineHeight))) state.lineHeight = '1.9';
  if (!['serif', 'sans'].includes(state.font)) state.font = 'serif';
  const $ = id => document.getElementById(id);
  function make(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch (_) {} }
  function notice(text) {
    $('readerNotice').textContent = text;
    $('readerNotice').hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { $('readerNotice').hidden = true; }, 2800);
  }
  function applySettings() {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.dataset.font = state.font;
    document.documentElement.style.setProperty('--size', state.size + 'px');
    document.documentElement.style.setProperty('--leading', state.lineHeight);
    $('reader').classList.toggle('vocab-hidden', !state.vocab);
    $('reader').classList.toggle('art-hidden', !state.art);
    $('vocabToggle').setAttribute('aria-pressed', String(state.vocab));
    $('vocabSymbol').textContent = state.vocab ? 'ON' : 'OFF';
    $('fontSizeLabel').textContent = state.size + ' px';
    $('fontMinus').disabled = state.size <= 15;
    $('fontPlus').disabled = state.size >= 28;
    $('fontFamily').value = state.font;
    $('lineHeight').value = state.lineHeight;
    $('themeSelect').value = state.theme;
    $('artToggle').checked = state.art;
    $('themeBtn').setAttribute('aria-label', state.theme === 'dark' ? '切換暖白模式' : '切換深色模式');
    const meta = document.querySelector('meta[name="theme-color"]');
    meta.content = state.theme === 'dark' ? '#161a1b' : state.theme === 'sepia' ? '#eee3cf' : '#f7f4ed';
  }
  function position() {
    if (!paragraphs.length) return null;
    const edge = innerWidth > 850 ? 100 : 20;
    let low = 0, high = paragraphs.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (paragraphs[mid].getBoundingClientRect().bottom <= edge) low = mid + 1;
      else high = mid;
    }
    const rect = paragraphs[low].getBoundingClientRect();
    return { paragraph: low, fraction: Math.max(0, Math.min(1, (edge - rect.top) / Math.max(rect.height, 1))) };
  }
  function progress() {
    if (!loaded || current === null || $('readingView').hidden) return;
    const box = $('reader').getBoundingClientRect();
    const start = box.top + scrollY;
    const distance = Math.max(box.height - innerHeight, 1);
    const pct = Math.max(0, Math.min(100, Math.round((scrollY - start) / distance * 100)));
    state.positions[current] = scrollY;
    state.anchors[current] = paragraphs.length && paragraphs[0].getBoundingClientRect().top <= (innerWidth > 850 ? 100 : 20) ? position() : null;
    state.percentages[current] = pct;
    $('progress').style.width = pct + '%';
    $('readingPercent').textContent = '本章 ' + pct + '%';
  }
  function paint(chapter) {
    const box = $('reader');
    box.replaceChildren();
    const intro = make('div', 'chapter-intro');
    intro.append(make('div', 'chapter-kicker', 'CHAPTER ' + String(chapter.id).padStart(2, '0')), make('h2', '', chapter.title));
    box.append(intro);
    const item = list.find(item => item.id === chapter.id);
    if (item.image) {
      const image = make('img', 'chapter-illustration');
      image.src = item.image;
      image.alt = 'Chapter ' + chapter.id + ' — ' + chapter.title + ' illustration';
      image.width = 1672; image.height = 941; image.decoding = 'async';
      box.append(image);
    }
    $('partList').replaceChildren();
    let paragraphIndex = 0;
    chapter.parts.forEach((part, index) => {
      const section = make('section', 'part');
      section.id = 'part-' + index;
      section.append(make('h3', '', part.title));
      const jump = make('button', 'part-link', part.title);
      jump.onclick = () => {
        section.scrollIntoView({ behavior: 'instant', block: 'start' });
        progress();
      };
      $('partList').append(jump);
      const body = make('div', 'paragraphs');
      part.paragraphs.forEach(text => {
        const row = make('div', 'paragraph-row');
        const p = make('p', /^[“"‘]/.test(text) ? 'dialogue' : '', text);
        const id = paragraphIndex++;
        p.dataset.paragraph = id;
        const mark = make('button', 'paragraph-mark', '＋');
        mark.type = 'button';
        mark.dataset.paragraph = id;
        mark.setAttribute('aria-label', '第 ' + (id + 1) + ' 段書籤');
        mark.onclick = () => window.NovelLibrary.addBookmark(id, true);
        row.append(p, mark); body.append(row);
      });
      section.append(body);
      if (part.vocab.length) {
        const card = make('div', 'vocab-card'), grid = make('div', 'vocab-grid');
        card.append(make('h4', '', 'KEY VOCABULARY · 重點單字'));
        part.vocab.forEach(text => {
          const match = text.match(/^(.+?)(?:\s+([\u3400-\u9fff].*))$/);
          const item = make('div', 'vocab-item');
          item.append(make('div', 'vocab-en', match ? match[1] : text), make('div', 'vocab-cn', match ? match[2] : ''));
          grid.append(item);
        });
        card.append(grid); section.append(card);
      }
      box.append(section);
    });
    paragraphs = Array.from(box.querySelectorAll('.paragraphs p'));
    window.NovelLibrary.refreshBookmarkButtons();
    const words = chapter.parts.flatMap(p => p.paragraphs).join(' ').trim().split(/\s+/).length;
    $('readingTime').textContent = words.toLocaleString() + ' words · 約 ' + Math.ceil(words / 180) + ' 分鐘';
    $('currentTitle').textContent = 'Chapter ' + chapter.id + ' — ' + chapter.title;
    $('chapterSelect').value = chapter.id;
    $('bookmarkStatus').textContent = '';
    document.querySelectorAll('#chapterList .chapter-link').forEach(link => {
      const active = Number(link.dataset.id) === chapter.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    const index = list.findIndex(item => item.id === chapter.id);
    $('prevBtn').disabled = index === 0;
    $('nextBtn').disabled = index === list.length - 1;
    $('nextBtn').textContent = index === list.length - 1 ? '已讀到最新章' : '下一章 →';
    document.title = 'Chapter ' + chapter.id + ' · ' + chapter.title + ' | English Reader';
    applySettings();
  }
  function load(item) {
    if (data.has(item.id)) return Promise.resolve(data.get(item.id));
    if (loads.has(item.id)) return loads.get(item.id);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = item.file;
      script.onload = () => {
        script.remove(); loads.delete(item.id);
        if (data.has(item.id)) resolve(data.get(item.id)); else reject(new Error('Missing chapter'));
      };
      script.onerror = () => { script.remove(); loads.delete(item.id); reject(new Error('Network error')); };
      document.head.append(script);
    });
    loads.set(item.id, promise);
    return promise;
  }
  async function open(id, resume = false, options = {}) {
    const item = list.find(item => item.id === Number(id));
    if (!item) { notice('找不到這個章節，請從目錄選擇。'); return false; }
    progress(); save();
    const token = ++navigation, startGesture = gesture;
    const savedTop = state.positions[item.id];
    const anchor = state.anchors[item.id] ? { ...state.anchors[item.id] } : null;
    current = item.id; loaded = false; paragraphs = [];
    state.chapter = current; save();
    $('libraryHome').hidden = true; $('readingView').hidden = false;
    if (location.hash !== '#chapter-' + current) history.pushState(null, '', '#chapter-' + current);
    $('reader').textContent = '正在載入章節…';
    $('reader').setAttribute('aria-busy', 'true');
    try {
      const chapter = await load(item);
      if (token !== navigation || $('readingView').hidden) return false;
      paint(chapter);
      $('reader').removeAttribute('aria-busy');
      if (gesture === startGesture) {
        let top;
        const target = Number.isInteger(options.paragraph) ? { paragraph: options.paragraph, fraction: 0 } : resume ? anchor : null;
        if (target && paragraphs[target.paragraph]) {
          const rect = paragraphs[target.paragraph].getBoundingClientRect();
          top = rect.top + scrollY + rect.height * (Number(target.fraction) || 0) - (innerWidth > 850 ? 100 : 20);
        } else if (resume && Number.isFinite(savedTop)) top = savedTop;
        else top = $('readingView').getBoundingClientRect().top + scrollY - (innerWidth > 850 ? 85 : 12);
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
      }
      loaded = true; progress();
      return true;
    } catch (_) {
      if (token !== navigation || $('readingView').hidden) return false;
      $('reader').removeAttribute('aria-busy');
      $('reader').replaceChildren(make('p', '', '章節暫時無法載入，請確認網路後再試一次。'));
      const retry = make('button', 'navbtn', '重新載入');
      retry.onclick = () => open(item.id, resume, options);
      $('reader').append(retry);
      return false;
    }
  }
  function leave() { progress(); save(); navigation++; loaded = false; }
  function next(delta) {
    const index = list.findIndex(item => item.id === current);
    if (list[index + delta]) open(list[index + delta].id);
  }
  function init() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    list = window.NOVEL_CATALOG || [];
    if (!list.some(item => item.id === Number(state.chapter))) state.chapter = list[0]?.id || 1;
    $('countLabel').textContent = list.length + ' chapters';
    list.forEach(chapter => {
      const option = make('option', '', 'Chapter ' + chapter.id); option.value = chapter.id;
      $('chapterSelect').append(option);
      const link = make('a', 'chapter-link'); link.href = '#chapter-' + chapter.id; link.dataset.id = chapter.id;
      link.append(make('span', 'number', String(chapter.id).padStart(2, '0')), make('span', '', chapter.title));
      $('chapterList').append(link);
    });
    $('chapterSelect').onchange = event => open(Number(event.target.value));
    $('prevBtn').onclick = () => next(-1); $('nextBtn').onclick = () => next(1);
    const update = (field, value) => { state[field] = value; applySettings(); save(); };
    $('themeBtn').onclick = () => update('theme', state.theme === 'dark' ? 'light' : 'dark');
    $('fontPlus').onclick = () => update('size', Math.min(28, state.size + 1));
    $('fontMinus').onclick = () => update('size', Math.max(15, state.size - 1));
    $('vocabToggle').onclick = () => update('vocab', !state.vocab);
    $('fontFamily').onchange = event => update('font', event.target.value);
    $('lineHeight').onchange = event => update('lineHeight', event.target.value);
    $('themeSelect').onchange = event => update('theme', event.target.value);
    $('artToggle').onchange = event => update('art', event.target.checked);
    $('settingsBtn').onclick = () => $('settingsDialog').showModal();
    document.querySelector('.skip-link').onclick = event => {
      event.preventDefault();
      const target = $('readingView').hidden ? $('contents') : $('reader');
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    };
    $('jumpTop').onclick = () => window.scrollTo({ top: 0, behavior: 'instant' });
    window.addEventListener('scroll', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { progress(); save(); }, 140);
    }, { passive: true });
    ['touchstart', 'touchmove', 'pointerdown', 'wheel', 'keydown'].forEach(type => window.addEventListener(type, () => { gesture++; }, { passive: true }));
    window.addEventListener('pagehide', () => { progress(); save(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { progress(); save(); } });
    applySettings();
  }
  window.NovelReader = { init, open, leave, position, notice, make, getState: () => state, getChapter: () => current, registerChapter: chapter => data.set(chapter.id, chapter) };
})();
