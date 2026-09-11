(() => {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyCAqcgt7wcgc2WyfgZC-8_u9Rd9f5MkJq4",
    authDomain: "game-archieve.firebaseapp.com",
    databaseURL: "https://game-archieve-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "game-archieve",
    storageBucket: "game-archieve.firebasestorage.app",
    messagingSenderId: "226505931314",
    appId: "226505931314:web:61cc741644cce20bd21a2b"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const isEmu = document.body.dataset.page === 'emulators';
  const pageType = isEmu ? 'emulators' : 'games';
  const $ = id => document.getElementById(id);
  const grid = $(isEmu ? 'emulatorGrid' : 'gameGrid');
  const search = $(isEmu ? 'searchEmu' : 'searchInput');
  const clearBtn = $('searchClear');
  const resultLabel = $('resultLabel');
  const platformFilters = $('platformFilters');
  const sortSelect = $('sortSelect');
  const mobileSearch = $('mobileSearchButton');

  const noteModal = $('noteModal');
  const noteTitle = $('noteTitle');
  const detailMeta = $('detailMeta');
  const detailStatus = $('detailStatus');
  const detailImage = $('detailImage');
  const detailImageFallback = $('detailImageFallback');
  const noteContent = $('noteContent');
  const modalDownload = $('modalDownload');
  const closeNoteModal = $('closeNoteModal');

  const updateButton = $('updateCenterButton');
  const updateBadge = $('updateBadge');
  const updateModal = $('updateModal');
  const updateList = $('updateList');
  const closeUpdateModal = $('closeUpdateModal');
  const supportButton = $('supportButton');
  const supportModal = $('supportModal');
  const supportContent = $('supportContent');
  const closeSupportModal = $('closeSupportModal');

  let allItems = [];
  let allUpdates = [];
  let supportData = null;
  let activeFilter = 'all';
  let activePlatform = 'all';
  let currentView = localStorage.getItem(`pokegea:view:${pageType}`) || 'grid';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));

  const norm = value => String(value ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();

  const text = (value, fallback = 'N/A') => {
    const result = String(value ?? '').trim();
    return result || fallback;
  };

  const safeUrl = value => {
    try {
      const raw = String(value ?? '').trim();
      if (!raw) return '#';
      const parsed = new URL(raw, window.location.href);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
    } catch (_) { return '#'; }
  };

  const dateValue = item => {
    const raw = item?.createdAt ?? item?.timestamp ?? item?.date ?? 0;
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const parsed = Date.parse(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const arrayFrom = value => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value && typeof value === 'object') return Object.values(value).filter(Boolean);
    return value ? [value] : [];
  };

  function buildPlatforms() {
    if (!platformFilters) return;
    const map = new Map();
    allItems.forEach(item => {
      const platform = text(item.platform, 'Khác');
      map.set(platform, (map.get(platform) || 0) + 1);
    });
    platformFilters.innerHTML = `<button class="platform-chip ${activePlatform === 'all' ? 'active' : ''}" data-platform="all">Tất cả</button>` +
      [...map.entries()].sort((a, b) => b[1] - a[1]).map(([platform, count]) =>
        `<button class="platform-chip ${activePlatform === platform ? 'active' : ''}" data-platform="${esc(platform)}">${esc(platform)} <span>${count}</span></button>`
      ).join('');
  }

  function statusOf(item) {
    if (isEmu) return 'ready';
    const status = norm(item.status);
    return ['complete', 'completed', 'hoàn thành', 'hoan thanh'].includes(status) ? 'complete' : 'ongoing';
  }

  function statusLabel(item) {
    if (isEmu) return 'Sẵn sàng';
    const state = statusOf(item);
    return state === 'complete' ? 'Hoàn thành' : text(item.status, 'Đang làm');
  }

  function matches(item) {
    const term = norm(search?.value);
    const haystack = [item.name, item.platform, item.language, item.version, item.status, item.note].map(norm).join(' ');
    if (term && !haystack.includes(term)) return false;
    if (activePlatform !== 'all' && text(item.platform, 'Khác') !== activePlatform) return false;
    if (activeFilter === 'complete' && statusOf(item) !== 'complete') return false;
    if (activeFilter === 'ongoing' && statusOf(item) !== 'ongoing') return false;
    if (activeFilter === 'ready' && statusOf(item) !== 'ready') return false;
    return true;
  }

  function sorted(items) {
    const copy = [...items];
    if (sortSelect?.value === 'name-asc') return copy.sort((a, b) => norm(a.name).localeCompare(norm(b.name), 'vi'));
    if (sortSelect?.value === 'name-desc') return copy.sort((a, b) => norm(b.name).localeCompare(norm(a.name), 'vi'));
    return copy;
  }

  function card(item, index) {
    const name = text(item.name, 'Chưa đặt tên');
    const platform = text(item.platform);
    const language = text(item.language);
    const version = text(item.version, '');
    const status = statusLabel(item);
    const state = statusOf(item);
    const image = safeUrl(item.image);
    const download = safeUrl(item.download_url);
    return `<article class="card" style="animation-delay:${Math.min(index * 16, 180)}ms">
      <div class="card-img-wrap">
        ${image !== '#' ? `<img class="card-img${isEmu ? ' emulator-img' : ''}" src="${image}" alt="${esc(name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.card-img-wrap').classList.add('img-error');this.remove()">` : ''}
      </div>
      <div class="card-content">
        <div class="card-title" title="${esc(name)}">${esc(name)}</div>
        <div class="tags-container"><span class="badge platform">${esc(platform)}</span>${!isEmu ? `<span class="badge">${esc(language)}</span>` : ''}</div>
        <div class="meta-info"><span class="status ${state === 'ongoing' ? 'ongoing' : 'complete'}">${esc(status)}</span><span>${esc(version)}</span></div>
        <div class="card-actions">
          <a class="btn-download ${download === '#' ? 'disabled' : ''}" href="${download}" target="_blank" rel="noopener noreferrer" ${download === '#' ? 'aria-disabled="true"' : ''}>Tải xuống</a>
          <button class="btn-note" data-note="${esc(item.id)}" title="Xem thông tin" aria-label="Xem thông tin">!</button>
        </div>
      </div>
    </article>`;
  }

  function render() {
    const filtered = sorted(allItems.filter(matches));
    grid.classList.toggle('compact', currentView === 'compact');
    grid.innerHTML = filtered.length ? filtered.map(card).join('') : `<div class="empty-state"><div class="state-icon">⌕</div><div class="state-title">Không tìm thấy kết quả</div><div class="state-message">Thử từ khóa khác hoặc đặt lại bộ lọc.</div></div>`;
    if (resultLabel) resultLabel.textContent = filtered.length === allItems.length ? `Hiển thị ${filtered.length} ${isEmu ? 'giả lập' : 'tựa game'}` : `${filtered.length} kết quả / ${allItems.length}`;
    if (clearBtn) clearBtn.hidden = !(search?.value || '').trim();
  }

  function detailImageFor(item) {
    const src = safeUrl(item.image);
    if (!detailImage || !detailImageFallback) return;
    detailImage.onload = () => { detailImage.hidden = false; detailImageFallback.hidden = true; };
    detailImage.onerror = () => { detailImage.hidden = true; detailImageFallback.hidden = false; };
    if (src === '#') {
      detailImage.hidden = true;
      detailImageFallback.hidden = false;
      detailImage.removeAttribute('src');
      return;
    }
    detailImage.alt = text(item.name, isEmu ? 'Giả lập' : 'Game');
    detailImage.hidden = false;
    detailImageFallback.hidden = false;
    detailImage.src = src;
  }

  function openNote(id) {
    const item = allItems.find(entry => entry.id === id);
    if (!item || !noteModal) return;
    noteTitle.textContent = text(item.name, isEmu ? 'Giả lập' : 'Game');
    detailMeta.innerHTML = `${item.platform ? `<span class="detail-pill accent">${esc(item.platform)}</span>` : ''}${!isEmu && item.language ? `<span class="detail-pill">${esc(item.language)}</span>` : ''}${item.version ? `<span class="detail-pill">${esc(item.version)}</span>` : ''}`;
    const state = statusOf(item);
    detailStatus.className = `detail-status ${state}`;
    detailStatus.innerHTML = `<span class="detail-status-dot"></span><span>${esc(statusLabel(item))}</span>`;
    detailImageFor(item);
    const note = String(item.note || '').trim();
    noteContent.textContent = note || (isEmu ? 'Chưa có chú thích cho giả lập này.' : 'Chưa có mô tả hoặc ghi chú cho tựa game này.');
    const download = safeUrl(item.download_url);
    modalDownload.href = download;
    modalDownload.classList.toggle('disabled', download === '#');
    modalDownload.setAttribute('aria-disabled', download === '#' ? 'true' : 'false');
    modalDownload.textContent = download === '#' ? 'Chưa có link tải' : 'Tải xuống';
    noteModal.hidden = false;
    document.body.classList.add('modal-open');
    closeNoteModal?.focus();
  }

  function closeNote() {
    if (!noteModal) return;
    noteModal.hidden = true;
    if (![updateModal, supportModal].some(modal => modal && !modal.hidden)) document.body.classList.remove('modal-open');
  }

  function openModal(modal, closeButton) {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    closeButton?.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if ([noteModal, updateModal, supportModal].every(item => !item || item.hidden)) document.body.classList.remove('modal-open');
  }

  function renderUpdates() {
    if (!updateList) return;
    if (!allUpdates.length) {
      updateList.innerHTML = `<div class="feature-empty"><div class="state-icon">✦</div><strong>Chưa có cập nhật</strong><span>Khi admin đăng update mới, nội dung sẽ xuất hiện ở đây.</span></div>`;
      return;
    }
    const sortedUpdates = [...allUpdates].sort((a, b) => {
      const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
      return pin || dateValue(b) - dateValue(a);
    });
    updateList.innerHTML = sortedUpdates.map(update => {
      const image = safeUrl(update.image);
      const date = update.date || (dateValue(update) ? new Date(dateValue(update)).toLocaleDateString('vi-VN') : '');
      const link = safeUrl(update.link);
      return `<article class="update-item ${update.pinned ? 'pinned' : ''}">
        ${image !== '#' ? `<div class="update-thumb"><img src="${image}" alt="" loading="lazy" decoding="async"></div>` : ''}
        <div class="update-body">
          <div class="update-topline">${date ? `<span>${esc(date)}</span>` : ''}${update.version ? `<span class="update-version">${esc(update.version)}</span>` : ''}${update.pinned ? '<span class="update-pin">PINNED</span>' : ''}</div>
          <h3>${esc(text(update.title, 'Cập nhật POKEGEA'))}</h3>
          <p>${esc(text(update.message, ''))}</p>
          ${link !== '#' ? `<a class="update-link" href="${link}" target="_blank" rel="noopener noreferrer">Xem thêm ↗</a>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  function renderSupport() {
    if (!supportContent) return;
    if (!supportData) {
      supportContent.innerHTML = `<div class="feature-empty"><div class="state-icon">♥</div><strong>Chưa có thông tin ủng hộ</strong><span>Admin có thể thiết lập nội dung, ảnh và liên kết trong Firebase.</span></div>`;
      return;
    }
    const images = arrayFrom(supportData.images);
    if (supportData.image) images.unshift(supportData.image);
    const uniqueImages = [...new Set(images.map(safeUrl).filter(url => url !== '#'))];
    const qr = safeUrl(supportData.qrImage);
    const buttonUrl = safeUrl(supportData.buttonUrl);
    supportContent.innerHTML = `<div class="support-hero"><div class="support-heart">♥</div><div><h2>${esc(text(supportData.title, 'Ủng hộ dịch giả'))}</h2><p>${esc(text(supportData.subtitle, 'Mỗi sự ủng hộ là động lực để tiếp tục dịch và cập nhật game.'))}</p></div></div>
      ${uniqueImages.length || qr !== '#' ? `<div class="support-gallery">${uniqueImages.map(src => `<div class="support-image"><img src="${src}" alt="" loading="lazy" decoding="async"></div>`).join('')}${qr !== '#' ? `<div class="support-image support-qr"><img src="${qr}" alt="Mã QR ủng hộ" loading="lazy" decoding="async"></div>` : ''}</div>` : ''}
      ${supportData.description ? `<div class="support-text">${esc(supportData.description)}</div>` : ''}
      ${buttonUrl !== '#' ? `<a class="support-action" href="${buttonUrl}" target="_blank" rel="noopener noreferrer">${esc(text(supportData.buttonText, 'Ủng hộ / Liên hệ'))} ↗</a>` : ''}`;
  }

  function updateBadgeState() {
    if (!updateBadge) return;
    const seen = Number(localStorage.getItem('pokegea:updateSeen') || 0);
    const unread = allUpdates.filter(item => dateValue(item) > seen || (!dateValue(item) && !seen)).length;
    updateBadge.textContent = String(Math.min(unread, 99));
    updateBadge.hidden = unread <= 0;
  }

  function markUpdatesSeen() {
    const latest = allUpdates.reduce((max, item) => Math.max(max, dateValue(item)), 0);
    if (latest) localStorage.setItem('pokegea:updateSeen', String(latest));
    else if (allUpdates.length) localStorage.setItem('pokegea:updateSeen', String(Date.now()));
    updateBadgeState();
  }

  function loadCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(`pokegea:${pageType}`) || 'null');
      if (Array.isArray(cache)) { allItems = cache; buildPlatforms(); render(); }
    } catch (_) {}
  }

  function bind() {
    search?.addEventListener('input', render);
    clearBtn?.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
    sortSelect?.addEventListener('change', render);

    platformFilters?.addEventListener('click', event => {
      const button = event.target.closest('[data-platform]');
      if (!button) return;
      activePlatform = button.dataset.platform;
      buildPlatforms(); render();
    });

    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
      render();
    }));

    document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
      currentView = button.dataset.view;
      localStorage.setItem(`pokegea:view:${pageType}`, currentView);
      document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
      render();
    }));

    grid?.addEventListener('click', event => {
      const note = event.target.closest('[data-note]');
      if (note) openNote(note.dataset.note);
    });

    closeNoteModal?.addEventListener('click', closeNote);
    noteModal?.addEventListener('click', event => { if (event.target === noteModal) closeNote(); });

    mobileSearch?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => search?.focus(), 180);
    });

    updateButton?.addEventListener('click', () => { markUpdatesSeen(); renderUpdates(); openModal(updateModal, closeUpdateModal); });
    closeUpdateModal?.addEventListener('click', () => closeModal(updateModal));
    updateModal?.addEventListener('click', event => { if (event.target === updateModal) closeModal(updateModal); });
    supportButton?.addEventListener('click', () => { renderSupport(); openModal(supportModal, closeSupportModal); });
    closeSupportModal?.addEventListener('click', () => closeModal(supportModal));
    supportModal?.addEventListener('click', event => { if (event.target === supportModal) closeModal(supportModal); });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (noteModal && !noteModal.hidden) closeNote();
        if (updateModal && !updateModal.hidden) closeModal(updateModal);
        if (supportModal && !supportModal.hidden) closeModal(supportModal);
      }
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault(); search?.focus();
      }
    });
  }

  bind();
  loadCache();

  db.ref(pageType).on('value', snapshot => {
    const data = snapshot.val();
    allItems = data ? Object.keys(data).map(key => ({ id: key, ...(data[key] || {}) })).reverse() : [];
    localStorage.setItem(`pokegea:${pageType}`, JSON.stringify(allItems));
    buildPlatforms(); render();
  }, error => {
    console.error(error);
    if (!allItems.length) grid.innerHTML = `<div class="error-state"><div class="state-icon">⚠</div><div class="state-title">Không thể tải dữ liệu</div><div class="state-message">Kiểm tra kết nối mạng rồi tải lại trang.</div></div>`;
    if (resultLabel) resultLabel.textContent = 'Lỗi đồng bộ';
  });

  db.ref('updates').on('value', snapshot => {
    const data = snapshot.val();
    allUpdates = data ? Object.keys(data).map(key => ({ id: key, ...(data[key] || {}) })) : [];
    updateBadgeState();
    if (updateModal && !updateModal.hidden) renderUpdates();
  }, error => console.warn('POKEGEA updates:', error));

  db.ref('support').on('value', snapshot => {
    supportData = snapshot.val() || null;
    if (supportModal && !supportModal.hidden) renderSupport();
  }, error => console.warn('POKEGEA support:', error));
})();
