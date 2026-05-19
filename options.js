document.addEventListener('DOMContentLoaded', () => {
  // --- Element Selectors ---
  const addUrlForm = document.getElementById('add-url-form');
  const nameInput = document.getElementById('name');
  const urlInput = document.getElementById('url');
  const urlList = document.getElementById('url-list');
  const urlEmpty = document.getElementById('url-empty');
  const updateBtn = document.getElementById('update-btn');
  let editingUrlId = null;

  const urlParams = new URLSearchParams(window.location.search);
  const prefillName = urlParams.get('prefillName');
  const prefillUrl = urlParams.get('prefillUrl');
  if (prefillName) nameInput.value = prefillName;
  if (prefillUrl) urlInput.value = prefillUrl;

  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  const addVariableForm = document.getElementById('add-variable-form');
  const variableNameInput = document.getElementById('variable-name');
  const variableDefaultValueInput = document.getElementById('variable-default-value');
  const variableList = document.getElementById('variable-list');
  const variableEmpty = document.getElementById('variable-empty');
  const updateVariableBtn = document.getElementById('update-variable-btn');
  let editingVariable = null;

  const trashList = document.getElementById('trash-list');
  const trashEmpty = document.getElementById('trash-empty');
  const emptyTrashBtn = document.getElementById('empty-trash-btn');

  // --- Settings ---
  const settingTrashDays = document.getElementById('setting-trash-days');
  const settingTabPosition = document.getElementById('setting-tab-position');
  const settingDefaultCategory = document.getElementById('setting-default-category');
  const DEFAULT_SETTINGS = { trashDays: 15, tabPosition: 'next', defaultCategory: '', contextMenuOrder: ['favorites', 'presets', 'urls', 'categories'], presetMenuLayout: 'flat' };
  let currentSettings = { ...DEFAULT_SETTINGS };

  const addCategoryForm = document.getElementById('add-category-form');
  const categoryNameInput = document.getElementById('category-name');
  const categoryList = document.getElementById('category-list');
  const categoryEmpty = document.getElementById('category-empty');
  const updateCategoryBtn = document.getElementById('update-category-btn');
  const urlCategorySelect = document.getElementById('url-category');
  const categoryEmojiBtn = document.getElementById('category-emoji-btn');
  const categoryEmojiGrid = document.getElementById('category-emoji-grid');
  const categoryEmojiInput = document.getElementById('category-emoji');
  let editingCategoryId = null;

  const CATEGORY_EMOJIS = [
    '📁','📂','🔧','💼','🌐','🔍','📊','🛠️',
    '💻','🖥️','📱','🎯','⭐','🚀','📝','📋',
    '🔒','🔑','🏢','🏠','🎨','📦','⚡','🔔',
    '📌','🗂️','💡','🧪','🐛','📈','🎮','🤖',
    '☁️','🔥','💬','📎','🏷️','✅','❤️','🟢'
  ];

  // Initialize emoji picker
  CATEGORY_EMOJIS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emoji;
    btn.addEventListener('click', () => {
      categoryEmojiInput.value = emoji;
      categoryEmojiBtn.textContent = emoji;
      categoryEmojiGrid.classList.add('hidden');
    });
    categoryEmojiGrid.appendChild(btn);
  });

  categoryEmojiBtn.addEventListener('click', () => {
    categoryEmojiGrid.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.emoji-picker-wrapper')) {
      categoryEmojiGrid.classList.add('hidden');
    }
  });

  const addEnvForm = document.getElementById('add-env-form');
  const envNameInput = document.getElementById('env-name');
  const envList = document.getElementById('env-list');
  const envEmpty = document.getElementById('env-empty');

  const toastEl = document.getElementById('toast');
  const urlSearchInput = document.getElementById('url-search');
  const urlNoResults = document.getElementById('url-no-results');

  // --- Bulk Action Selectors ---
  const bulkSelectToggle = document.getElementById('bulk-select-toggle');
  const bulkBar = document.getElementById('bulk-bar');
  const bulkCount = document.getElementById('bulk-count');
  const bulkSelectAll = document.getElementById('bulk-select-all');
  const bulkMoveCategory = document.getElementById('bulk-move-category');
  const bulkExportBtn = document.getElementById('bulk-export-btn');
  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  const bulkCancelBtn = document.getElementById('bulk-cancel-btn');
  let bulkMode = false;
  let bulkSelectedIds = new Set();

  const ICON_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0d9488'];
  const DRAG_HANDLE_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>';

  // --- Utility ---
  function getIconColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
  }

  function getInitials(name) {
    return name.split(/[\s_-]+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  let toastTimer = null;
  function showToast(message, onUndo) {
    clearTimeout(toastTimer);
    if (onUndo) {
      toastEl.innerHTML = `<span class="toast-message">${message}</span><button class="toast-undo">Undo</button>`;
      toastEl.querySelector('.toast-undo').addEventListener('click', () => {
        toastEl.classList.remove('show');
        clearTimeout(toastTimer);
        onUndo();
      });
    } else {
      toastEl.innerHTML = `<span class="toast-message">${message}</span>`;
    }
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), onUndo ? 5000 : 2500);
  }

  function updateBadgeCounts() {
    chrome.storage.sync.get({ urls: [], variables: [], environments: [], categories: [], trash: [] }, (data) => {
      document.getElementById('url-count').textContent = data.urls.length;
      document.getElementById('variable-count').textContent = data.variables.length;
      document.getElementById('env-count').textContent = data.environments.length;
      document.getElementById('category-count').textContent = data.categories.length;
      document.getElementById('trash-count').textContent = data.trash.length;
      const presetUrls = new Set(PRESET_CATALOG.map(p => p.url));
      const addedPresetCount = data.urls.filter(u => u.source === 'preset' || presetUrls.has(u.url)).length;
      document.getElementById('preset-count').textContent = addedPresetCount;
    });
  }

  // --- Generic Drag and Drop ---
  function enableDragReorder(container, itemSelector, getIdFromEl, storageKey, idField, onReordered) {
    let draggedEl = null;
    let handleClicked = false;

    container.addEventListener('mousedown', (e) => {
      handleClicked = !!e.target.closest('.drag-handle');
    });

    container.addEventListener('dragstart', (e) => {
      const item = e.target.closest(itemSelector);
      if (!item || !handleClicked) { e.preventDefault(); return; }
      draggedEl = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    container.addEventListener('dragend', () => {
      if (draggedEl) draggedEl.classList.remove('dragging');
      container.querySelectorAll(itemSelector).forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      draggedEl = null;
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const item = e.target.closest(itemSelector);
      if (!item || item === draggedEl) return;
      container.querySelectorAll(itemSelector).forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      item.classList.add(e.clientY < midY ? 'drag-over-top' : 'drag-over-bottom');
    });

    container.addEventListener('dragleave', (e) => {
      const item = e.target.closest(itemSelector);
      if (item) item.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetItem = e.target.closest(itemSelector);
      if (!targetItem || !draggedEl || targetItem === draggedEl) return;

      const draggedId = getIdFromEl(draggedEl);
      const targetId = getIdFromEl(targetItem);
      const rect = targetItem.getBoundingClientRect();
      const insertAfter = e.clientY >= rect.top + rect.height / 2;

      chrome.storage.sync.get({ [storageKey]: [] }, (data) => {
        const items = data[storageKey];
        const draggedIdx = items.findIndex(i => i[idField] === draggedId);
        if (draggedIdx === -1) return;
        const [moved] = items.splice(draggedIdx, 1);
        let targetIdx = items.findIndex(i => i[idField] === targetId);
        if (insertAfter) targetIdx++;
        items.splice(targetIdx, 0, moved);
        chrome.storage.sync.set({ [storageKey]: items }, () => {
          onReordered();
          showToast('Order updated');
        });
      });
    });
  }

  // --- Tab Navigation ---
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // --- URL Management ---
  function populateCategorySelect(categories, selectedId, defaultCategoryId) {
    urlCategorySelect.innerHTML = '<option value="">None</option>';
    const activeSelection = selectedId || defaultCategoryId || '';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (cat.id === activeSelection) opt.selected = true;
      urlCategorySelect.appendChild(opt);
    });
  }

  function loadUrls(filter) {
    chrome.storage.sync.get({ urls: [], categories: [], favorites: [] }, (data) => {
      urlList.innerHTML = '';
      if (bulkMode) urlList.classList.add('bulk-mode'); else urlList.classList.remove('bulk-mode');
      const searchTerm = (filter !== undefined ? filter : (urlSearchInput.value || '')).trim().toLowerCase();
      const favSet = new Set(data.favorites || []);

      populateCategorySelect(data.categories, undefined, currentSettings.defaultCategory);

      if (data.urls.length === 0) {
        urlEmpty.classList.remove('hidden');
        urlNoResults.classList.add('hidden');
      } else {
        urlEmpty.classList.add('hidden');
        const filtered = searchTerm
            ? data.urls.filter(u => u.name.toLowerCase().includes(searchTerm) || u.url.toLowerCase().includes(searchTerm))
            : data.urls;

        if (filtered.length === 0) {
          urlNoResults.classList.remove('hidden');
        } else {
          urlNoResults.classList.add('hidden');
          const categoryMap = {};
          data.categories.forEach(c => { categoryMap[c.id] = c.name; });

          filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'list-item' + (bulkSelectedIds.has(item.id) ? ' bulk-selected' : '');
            div.draggable = !bulkMode;
            div.dataset.id = item.id;
            const color = getIconColor(item.name);
            const isFav = favSet.has(item.id);
            const catName = item.category && categoryMap[item.category]
                ? categoryMap[item.category]
                : '';
            const catBadge = catName
                ? `<span class="category-badge">${catName}</span>`
                : '';
            const isChecked = bulkSelectedIds.has(item.id);
            div.innerHTML = `
              <div class="bulk-checkbox${isChecked ? ' checked' : ''}" data-id="${item.id}"></div>
              <div class="drag-handle" title="Drag to reorder">${DRAG_HANDLE_SVG}</div>
              <div class="list-item-icon" style="background:${color}">${getInitials(item.name)}</div>
              <div class="list-item-content">
                <div class="list-item-name">${item.name}</div>
                <div class="list-item-detail" title="${item.url}">${item.url}</div>
              </div>
              ${catBadge}
              <div class="list-item-actions">
                <button class="btn btn-ghost btn-fav-url${isFav ? ' btn-fav-active' : ''}" data-id="${item.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                  <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </button>
                <button class="btn btn-ghost btn-edit-url" data-id="${item.id}" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="btn btn-ghost btn-duplicate-url" data-id="${item.id}" title="Duplicate">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                </button>
                <button class="btn btn-danger btn-remove-url" data-id="${item.id}" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            `;
            urlList.appendChild(div);
          });
        }
      }
      updateBadgeCounts();
      if (bulkMode) updateBulkUI();
    });
  }

  urlSearchInput.addEventListener('input', () => {
    loadUrls(urlSearchInput.value);
  });

  addUrlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingUrlId) return;
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const category = urlCategorySelect.value || undefined;
    if (name && url) {
      chrome.storage.sync.get({ urls: [] }, (data) => {
        const newItem = { id: `custom-search-${Date.now()}`, name, url };
        if (category) newItem.category = category;
        const newUrls = [...data.urls, newItem];
        chrome.storage.sync.set({ urls: newUrls }, () => {
          nameInput.value = '';
          urlInput.value = '';
          urlCategorySelect.value = '';
          loadUrls();
          showToast('URL added successfully');
        });
      });
    }
  });

  urlList.addEventListener('click', (e) => {
    // --- Bulk mode: row click toggles selection ---
    if (bulkMode) {
      const listItem = e.target.closest('.list-item');
      if (!listItem) return;
      const itemId = listItem.dataset.id;
      if (bulkSelectedIds.has(itemId)) {
        bulkSelectedIds.delete(itemId);
      } else {
        bulkSelectedIds.add(itemId);
      }
      loadUrls();
      return;
    }

    const btn = e.target.closest('button');
    if (!btn) return;
    const urlId = btn.dataset.id;

    if (btn.classList.contains('btn-fav-url')) {
      chrome.storage.sync.get({ favorites: [] }, (data) => {
        const favs = data.favorites;
        const idx = favs.indexOf(urlId);
        if (idx === -1) {
          favs.push(urlId);
          showToast('Added to favorites');
        } else {
          favs.splice(idx, 1);
          showToast('Removed from favorites');
        }
        chrome.storage.sync.set({ favorites: favs }, () => loadUrls());
      });
    }
    if (btn.classList.contains('btn-edit-url')) {
      chrome.storage.sync.get({ urls: [], categories: [] }, (data) => {
        const urlItem = data.urls.find(item => item.id === urlId);
        if (urlItem) {
          nameInput.value = urlItem.name;
          urlInput.value = urlItem.url;
          populateCategorySelect(data.categories, urlItem.category);
          editingUrlId = urlId;
          addUrlForm.querySelector('.btn-primary').classList.add('hidden');
          updateBtn.classList.remove('hidden');
          nameInput.focus();
        }
      });
    }
    if (btn.classList.contains('btn-duplicate-url')) {
      chrome.storage.sync.get({ urls: [], categories: [] }, (data) => {
        const urlItem = data.urls.find(item => item.id === urlId);
        if (urlItem) {
          nameInput.value = urlItem.name + ' (Copy)';
          urlInput.value = urlItem.url;
          populateCategorySelect(data.categories, urlItem.category);
          editingUrlId = null;
          addUrlForm.querySelector('.btn-primary').classList.remove('hidden');
          updateBtn.classList.add('hidden');
          nameInput.focus();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
    if (btn.classList.contains('btn-remove-url')) {
      chrome.storage.sync.get({ urls: [], trash: [], favorites: [] }, (data) => {
        const urlItem = data.urls.find(item => item.id === urlId);
        if (!urlItem) return;
        const trashItem = { ...urlItem, deletedAt: Date.now() };
        const filteredUrls = data.urls.filter(item => item.id !== urlId);
        const newTrash = [trashItem, ...data.trash];
        const newFavs = data.favorites.filter(id => id !== urlId);
        chrome.storage.sync.set({ urls: filteredUrls, trash: newTrash, favorites: newFavs }, () => {
          loadUrls();
          loadTrash();
          loadPresets();
          showToast('Moved to trash', () => {
            chrome.storage.sync.set({ urls: data.urls, trash: data.trash, favorites: data.favorites }, () => {
              loadUrls();
              loadTrash();
              loadPresets();
              showToast('Deletion undone');
            });
          });
        });
      });
    }
  });

  updateBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    const category = urlCategorySelect.value || undefined;
    if (name && url && editingUrlId) {
      chrome.storage.sync.get({ urls: [] }, (data) => {
        const newUrls = data.urls.map(item => {
          if (item.id === editingUrlId) {
            const updated = { ...item, name, url };
            if (category) { updated.category = category; } else { delete updated.category; }
            return updated;
          }
          return item;
        });
        chrome.storage.sync.set({ urls: newUrls }, () => {
          nameInput.value = '';
          urlInput.value = '';
          urlCategorySelect.value = '';
          editingUrlId = null;
          addUrlForm.querySelector('.btn-primary').classList.remove('hidden');
          updateBtn.classList.add('hidden');
          loadUrls();
          showToast('URL updated');
        });
      });
    }
  });

  // --- Bulk Actions ---
  function enterBulkMode() {
    bulkMode = true;
    bulkSelectedIds.clear();
    bulkSelectToggle.classList.add('active');
    bulkSelectToggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> Selecting';
    bulkBar.classList.add('active');
    populateBulkMoveSelect();
    loadUrls();
  }

  function exitBulkMode() {
    bulkMode = false;
    bulkSelectedIds.clear();
    bulkSelectToggle.classList.remove('active');
    bulkSelectToggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> Select';
    bulkBar.classList.remove('active');
    loadUrls();
  }

  function updateBulkUI() {
    const count = bulkSelectedIds.size;
    bulkCount.textContent = count + ' selected';
    const allItems = urlList.querySelectorAll('.list-item');
    const totalVisible = allItems.length;

    bulkSelectAll.classList.remove('checked', 'partial');
    if (count > 0 && count === totalVisible) {
      bulkSelectAll.classList.add('checked');
    } else if (count > 0) {
      bulkSelectAll.classList.add('partial');
    }

    const hasSelection = count > 0;
    bulkDeleteBtn.disabled = !hasSelection;
    bulkExportBtn.disabled = !hasSelection;
    bulkMoveCategory.disabled = !hasSelection;
    bulkDeleteBtn.style.opacity = hasSelection ? '1' : '0.5';
    bulkExportBtn.style.opacity = hasSelection ? '1' : '0.5';
    bulkMoveCategory.style.opacity = hasSelection ? '1' : '0.5';
  }

  function populateBulkMoveSelect() {
    chrome.storage.sync.get({ categories: [] }, (data) => {
      bulkMoveCategory.innerHTML = '<option value="" disabled selected>Move to...</option><option value="__none__">No category</option>';
      data.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = (cat.icon || '📁') + ' ' + cat.name;
        bulkMoveCategory.appendChild(opt);
      });
    });
  }

  bulkSelectToggle.addEventListener('click', () => {
    if (bulkMode) exitBulkMode(); else enterBulkMode();
  });

  bulkCancelBtn.addEventListener('click', exitBulkMode);

  bulkSelectAll.addEventListener('click', () => {
    const allItems = urlList.querySelectorAll('.list-item');
    const allIds = Array.from(allItems).map(el => el.dataset.id);
    if (bulkSelectedIds.size === allIds.length) {
      bulkSelectedIds.clear();
    } else {
      allIds.forEach(id => bulkSelectedIds.add(id));
    }
    loadUrls();
  });

  bulkDeleteBtn.addEventListener('click', () => {
    const count = bulkSelectedIds.size;
    if (count === 0) return;
    if (!confirm(`Delete ${count} shortcut${count !== 1 ? 's' : ''}? They will be moved to trash.`)) return;

    chrome.storage.sync.get({ urls: [], trash: [], favorites: [] }, (data) => {
      const idsToDelete = new Set(bulkSelectedIds);
      const deletedItems = data.urls.filter(u => idsToDelete.has(u.id)).map(u => ({ ...u, deletedAt: Date.now() }));
      const remainingUrls = data.urls.filter(u => !idsToDelete.has(u.id));
      const newTrash = [...deletedItems, ...data.trash];
      const newFavs = data.favorites.filter(id => !idsToDelete.has(id));

      chrome.storage.sync.set({ urls: remainingUrls, trash: newTrash, favorites: newFavs }, () => {
        const prevUrls = data.urls;
        const prevTrash = data.trash;
        const prevFavs = data.favorites;
        exitBulkMode();
        loadTrash();
        loadPresets();
        showToast(`${count} shortcut${count !== 1 ? 's' : ''} moved to trash`, () => {
          chrome.storage.sync.set({ urls: prevUrls, trash: prevTrash, favorites: prevFavs }, () => {
            loadUrls();
            loadTrash();
            loadPresets();
            showToast('Deletion undone');
          });
        });
      });
    });
  });

  bulkExportBtn.addEventListener('click', () => {
    const count = bulkSelectedIds.size;
    if (count === 0) return;
    chrome.storage.sync.get({ urls: [] }, (data) => {
      const selected = data.urls.filter(u => bulkSelectedIds.has(u.id));
      const exportData = { urls: selected, variables: [], environments: [], categories: [] };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custom_shortcuts_selected_${count}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`${count} shortcut${count !== 1 ? 's' : ''} exported`);
    });
  });

  bulkMoveCategory.addEventListener('change', () => {
    const count = bulkSelectedIds.size;
    if (count === 0) { bulkMoveCategory.value = ''; return; }
    const targetCategory = bulkMoveCategory.value;

    chrome.storage.sync.get({ urls: [] }, (data) => {
      const idsToMove = new Set(bulkSelectedIds);
      const newUrls = data.urls.map(u => {
        if (!idsToMove.has(u.id)) return u;
        const updated = { ...u };
        if (targetCategory === '__none__') { delete updated.category; } else { updated.category = targetCategory; }
        return updated;
      });
      chrome.storage.sync.set({ urls: newUrls }, () => {
        const label = targetCategory === '__none__' ? 'No category' : bulkMoveCategory.options[bulkMoveCategory.selectedIndex].textContent;
        exitBulkMode();
        showToast(`${count} shortcut${count !== 1 ? 's' : ''} moved to ${label}`);
      });
    });
  });

  // --- Variable Management ---
  function loadVariables() {
    chrome.storage.sync.get({ variables: [] }, (data) => {
      variableList.innerHTML = '';
      if (data.variables.length === 0) {
        variableEmpty.classList.remove('hidden');
      } else {
        variableEmpty.classList.add('hidden');
        data.variables.forEach(variable => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.draggable = true;
          div.dataset.variableName = variable.name;
          div.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">${DRAG_HANDLE_SVG}</div>
            <div class="list-item-icon" style="background:#7c3aed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </div>
            <div class="list-item-content">
              <div class="list-item-name" style="font-family:'SF Mono','Fira Code',monospace;font-size:12px;">{{${variable.name}}}</div>
              <div class="list-item-detail">Default: ${variable.defaultValue}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-ghost btn-edit-var" data-variable-name="${variable.name}" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="btn btn-danger btn-remove-var" data-variable-name="${variable.name}" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          `;
          variableList.appendChild(div);
        });
      }
      updateBadgeCounts();
    });
  }

  addVariableForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingVariable) return;
    const name = variableNameInput.value.trim().toUpperCase();
    const defaultValue = variableDefaultValueInput.value.trim();
    if (name && defaultValue) {
      chrome.storage.sync.get({ variables: [] }, (data) => {
        if (data.variables.some(v => v.name === name)) {
          return showToast('Variable with this name already exists');
        }
        const newVariables = [...data.variables, { name, defaultValue }];
        chrome.storage.sync.set({ variables: newVariables }, () => {
          variableNameInput.value = '';
          variableDefaultValueInput.value = '';
          loadVariables();
          loadEnvs();
          showToast('Variable added');
        });
      });
    }
  });

  variableList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const variableName = btn.dataset.variableName;

    if (btn.classList.contains('btn-edit-var')) {
      chrome.storage.sync.get({ variables: [] }, (data) => {
        const variable = data.variables.find(v => v.name === variableName);
        if (variable) {
          variableNameInput.value = variable.name;
          variableDefaultValueInput.value = variable.defaultValue;
          editingVariable = variable.name;
          addVariableForm.querySelector('.btn-primary').classList.add('hidden');
          updateVariableBtn.classList.remove('hidden');
          variableNameInput.focus();
        }
      });
    }
    if (btn.classList.contains('btn-remove-var')) {
      chrome.storage.sync.get({ variables: [], environments: [] }, (data) => {
        const filteredVariables = data.variables.filter(v => v.name !== variableName);
        const updatedEnvs = data.environments.map(env => {
          env.values = env.values.filter(v => v.key !== variableName);
          return env;
        });
        chrome.storage.sync.set({ variables: filteredVariables, environments: updatedEnvs }, () => {
          loadVariables();
          loadEnvs();
          showToast('Variable removed');
        });
      });
    }
  });

  updateVariableBtn.addEventListener('click', () => {
    const name = variableNameInput.value.trim().toUpperCase();
    const defaultValue = variableDefaultValueInput.value.trim();
    if (name && defaultValue && editingVariable) {
      chrome.storage.sync.get({ variables: [], environments: [] }, (data) => {
        if (data.variables.some(v => v.name === name && v.name !== editingVariable)) {
          return showToast('Another variable with this name already exists');
        }
        const newVariables = data.variables.map(v =>
            v.name === editingVariable ? { ...v, name, defaultValue } : v
        );
        const updatedEnvs = data.environments.map(env => {
          env.values = env.values.map(val => val.key === editingVariable ? { ...val, key: name } : val);
          return env;
        });
        chrome.storage.sync.set({ variables: newVariables, environments: updatedEnvs }, () => {
          variableNameInput.value = '';
          variableDefaultValueInput.value = '';
          editingVariable = null;
          addVariableForm.querySelector('.btn-primary').classList.remove('hidden');
          updateVariableBtn.classList.add('hidden');
          loadVariables();
          loadEnvs();
          showToast('Variable updated');
        });
      });
    }
  });

  // --- Environment Management ---
  function loadEnvs() {
    chrome.storage.sync.get({ environments: [], variables: [] }, (data) => {
      envList.innerHTML = '';
      if (data.environments.length === 0) {
        envEmpty.classList.remove('hidden');
      } else {
        envEmpty.classList.add('hidden');
        data.environments.forEach(env => {
          const section = document.createElement('div');
          section.className = 'env-section';
          section.dataset.envId = env.id;

          const varCount = data.variables.length;
          const varsHtml = data.variables.map(variable => {
            const savedValue = env.values.find(v => v.key === variable.name);
            const value = savedValue ? savedValue.value : '';
            const displayValue = value
                ? `<span class="env-var-value">${value}</span>`
                : `<span class="env-var-value env-var-default">default: ${variable.defaultValue}</span>`;
            return `
              <div class="env-var-row" data-env-id="${env.id}" data-variable-name="${variable.name}">
                <span class="env-var-key">${variable.name}</span>
                ${displayValue}
                <div class="env-var-actions">
                  <button class="btn btn-ghost btn-edit-env-var" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                </div>
              </div>
            `;
          }).join('');

          section.draggable = true;

          section.innerHTML = `
            <div class="env-header">
              <div class="env-header-left">
                <div class="drag-handle" title="Drag to reorder">${DRAG_HANDLE_SVG}</div>
                <svg class="env-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                <span class="env-name">${env.name}</span>
                <span class="env-var-count">${varCount} var${varCount !== 1 ? 's' : ''}</span>
              </div>
              <div class="env-header-actions">
                <button class="btn btn-ghost btn-edit-env" title="Rename">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="btn btn-danger btn-remove-env" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <div class="env-body">${varsHtml || '<div style="padding:12px 0;color:var(--text-muted);font-size:13px;">No variables defined. Add variables in the Variables tab first.</div>'}</div>
          `;
          envList.appendChild(section);
        });

        // Attach event listeners
        envList.querySelectorAll('.env-header').forEach(header => {
          header.addEventListener('click', (event) => {
            if (!event.target.closest('button')) {
              header.closest('.env-section').classList.toggle('collapsed');
            }
          });
        });

        envList.querySelectorAll('.btn-edit-env-var').forEach(button => {
          button.addEventListener('click', handleEditEnvVar);
        });

        envList.querySelectorAll('.btn-edit-env').forEach(button => {
          button.addEventListener('click', handleEditEnvName);
        });

        envList.querySelectorAll('.btn-remove-env').forEach(button => {
          button.addEventListener('click', handleRemoveEnv);
        });
      }
      updateBadgeCounts();
    });
  }

  addEnvForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = envNameInput.value.trim().toUpperCase();
    if (name) {
      chrome.storage.sync.get({ environments: [] }, (data) => {
        if (data.environments.some(e => e.name === name)) {
          return showToast('Environment with this name already exists');
        }
        const newEnvs = [...data.environments, { id: `env-${Date.now()}`, name, values: [] }];
        chrome.storage.sync.set({ environments: newEnvs }, () => {
          envNameInput.value = '';
          loadEnvs();
          showToast('Environment added');
        });
      });
    }
  });

  function handleRemoveEnv(e) {
    const envId = e.target.closest('.env-section').dataset.envId;
    if (confirm('Are you sure you want to remove this environment?')) {
      chrome.storage.sync.get({ environments: [] }, (data) => {
        const filteredEnvs = data.environments.filter(env => env.id !== envId);
        chrome.storage.sync.set({ environments: filteredEnvs }, () => {
          loadEnvs();
          showToast('Environment removed');
        });
      });
    }
  }

  function handleEditEnvName(e) {
    const section = e.target.closest('.env-section');
    const envId = section.dataset.envId;
    const nameSpan = section.querySelector('.env-name');
    const originalName = nameSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalName;
    input.style.cssText = 'padding:4px 8px;border:1px solid var(--primary);border-radius:6px;font-size:13px;font-weight:600;outline:none;text-transform:uppercase;';
    nameSpan.replaceWith(input);
    input.focus();

    const actionsDiv = section.querySelector('.env-header-actions');
    const originalActions = actionsDiv.innerHTML;
    actionsDiv.innerHTML = `
      <button class="btn btn-primary" style="padding:4px 12px;font-size:12px;">Save</button>
      <button class="btn btn-ghost" style="padding:4px 12px;font-size:12px;">Cancel</button>
    `;
    actionsDiv.style.opacity = '1';

    actionsDiv.querySelector('.btn-primary').addEventListener('click', (ev) => {
      ev.stopPropagation();
      const newName = input.value.trim().toUpperCase();
      if (!newName || newName === originalName) return loadEnvs();
      chrome.storage.sync.get({ environments: [] }, (data) => {
        if (data.environments.some(env => env.name === newName && env.id !== envId)) {
          return showToast('Another environment with this name already exists');
        }
        const newEnvironments = data.environments.map(env =>
            env.id === envId ? { ...env, name: newName } : env
        );
        chrome.storage.sync.set({ environments: newEnvironments }, () => {
          loadEnvs();
          showToast('Environment renamed');
        });
      });
    });

    actionsDiv.querySelector('.btn-ghost').addEventListener('click', (ev) => {
      ev.stopPropagation();
      loadEnvs();
    });
  }

  function handleEditEnvVar(e) {
    const row = e.target.closest('.env-var-row');
    const valueEl = row.querySelector('.env-var-value');
    const actionsDiv = row.querySelector('.env-var-actions');
    const originalValue = valueEl.classList.contains('env-var-default') ? '' : valueEl.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.style.cssText = 'flex:1;padding:4px 8px;border:1px solid var(--primary);border-radius:6px;font-size:13px;outline:none;';
    valueEl.replaceWith(input);
    input.focus();

    actionsDiv.innerHTML = `
      <button class="btn btn-primary" style="padding:4px 12px;font-size:12px;">Save</button>
      <button class="btn btn-ghost" style="padding:4px 12px;font-size:12px;">Cancel</button>
    `;
    actionsDiv.style.opacity = '1';

    actionsDiv.querySelector('.btn-primary').addEventListener('click', () => handleSaveEnvVar(row, input));
    actionsDiv.querySelector('.btn-ghost').addEventListener('click', () => loadEnvs());
  }

  function handleSaveEnvVar(row, input) {
    const envId = row.dataset.envId;
    const variableName = row.dataset.variableName;
    const newValue = input.value.trim();

    chrome.storage.sync.get({ environments: [] }, (data) => {
      const newEnvironments = data.environments.map(env => {
        if (env.id === envId) {
          let variableFound = false;
          env.values = env.values.map(v => {
            if (v.key === variableName) {
              variableFound = true;
              return { ...v, value: newValue };
            }
            return v;
          });
          if (!variableFound) {
            env.values.push({ key: variableName, value: newValue });
          }
        }
        return env;
      });

      chrome.storage.sync.set({ environments: newEnvironments }, () => {
        loadEnvs();
        showToast('Variable value saved');
      });
    });
  }

  // --- Category Management ---
  function loadCategories() {
    chrome.storage.sync.get({ categories: [], urls: [] }, (data) => {
      categoryList.innerHTML = '';
      if (data.categories.length === 0) {
        categoryEmpty.classList.remove('hidden');
      } else {
        categoryEmpty.classList.add('hidden');
        data.categories.forEach(cat => {
          const urlCount = data.urls.filter(u => u.category === cat.id).length;
          const div = document.createElement('div');
          div.className = 'list-item';
          div.draggable = true;
          div.dataset.id = cat.id;
          const icon = cat.icon || '📁';
          div.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">${DRAG_HANDLE_SVG}</div>
            <div class="list-item-icon" style="background:transparent;font-size:20px">${icon}</div>
            <div class="list-item-content">
              <div class="list-item-name">${cat.name}</div>
              <div class="list-item-detail">${urlCount} shortcut${urlCount !== 1 ? 's' : ''}</div>
            </div>
            <div class="list-item-actions">
              <button class="btn btn-ghost btn-edit-cat" data-id="${cat.id}" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="btn btn-danger btn-remove-cat" data-id="${cat.id}" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          `;
          categoryList.appendChild(div);
        });
      }
      updateBadgeCounts();
    });
  }

  addCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingCategoryId) return;
    const name = categoryNameInput.value.trim();
    if (name) {
      chrome.storage.sync.get({ categories: [] }, (data) => {
        if (data.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
          return showToast('Category with this name already exists');
        }
        const icon = categoryEmojiInput.value || '📁';
        const newCategories = [...data.categories, { id: `cat-${Date.now()}`, name, icon }];
        chrome.storage.sync.set({ categories: newCategories }, () => {
          categoryNameInput.value = '';
          categoryEmojiInput.value = '📁';
          categoryEmojiBtn.textContent = '📁';
          loadCategories();
          loadUrls();
          showToast('Category added');
        });
      });
    }
  });

  categoryList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const catId = btn.dataset.id;

    if (btn.classList.contains('btn-edit-cat')) {
      chrome.storage.sync.get({ categories: [] }, (data) => {
        const cat = data.categories.find(c => c.id === catId);
        if (cat) {
          categoryNameInput.value = cat.name;
          categoryEmojiInput.value = cat.icon || '📁';
          categoryEmojiBtn.textContent = cat.icon || '📁';
          editingCategoryId = catId;
          addCategoryForm.querySelector('.btn-primary').classList.add('hidden');
          updateCategoryBtn.classList.remove('hidden');
          categoryNameInput.focus();
        }
      });
    }
    if (btn.classList.contains('btn-remove-cat')) {
      if (confirm('Are you sure? URLs in this category will become uncategorized.')) {
        chrome.storage.sync.get({ categories: [], urls: [] }, (data) => {
          const filteredCats = data.categories.filter(c => c.id !== catId);
          const updatedUrls = data.urls.map(u => {
            if (u.category === catId) { const copy = { ...u }; delete copy.category; return copy; }
            return u;
          });
          chrome.storage.sync.set({ categories: filteredCats, urls: updatedUrls }, () => {
            loadCategories();
            loadUrls();
            showToast('Category removed');
          });
        });
      }
    }
  });

  updateCategoryBtn.addEventListener('click', () => {
    const name = categoryNameInput.value.trim();
    if (name && editingCategoryId) {
      chrome.storage.sync.get({ categories: [] }, (data) => {
        if (data.categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCategoryId)) {
          return showToast('Another category with this name already exists');
        }
        const icon = categoryEmojiInput.value || '📁';
        const newCategories = data.categories.map(c =>
            c.id === editingCategoryId ? { ...c, name, icon } : c
        );
        chrome.storage.sync.set({ categories: newCategories }, () => {
          categoryNameInput.value = '';
          categoryEmojiInput.value = '📁';
          categoryEmojiBtn.textContent = '📁';
          editingCategoryId = null;
          addCategoryForm.querySelector('.btn-primary').classList.remove('hidden');
          updateCategoryBtn.classList.add('hidden');
          loadCategories();
          loadUrls();
          showToast('Category updated');
        });
      });
    }
  });

  // --- Trash Management ---
  function purgeExpiredTrash(trashItems) {
    const days = currentSettings.trashDays || 15;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return trashItems.filter(item => item.deletedAt > cutoff);
  }

  function getDaysRemaining(deletedAt) {
    const days = currentSettings.trashDays || 15;
    const elapsed = Date.now() - deletedAt;
    const remaining = days - Math.floor(elapsed / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  }

  function formatDeletedDate(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function loadTrash() {
    chrome.storage.sync.get({ trash: [], categories: [] }, (data) => {
      const purged = purgeExpiredTrash(data.trash);
      if (purged.length !== data.trash.length) {
        chrome.storage.sync.set({ trash: purged });
      }
      trashList.innerHTML = '';
      if (purged.length === 0) {
        trashEmpty.classList.remove('hidden');
        emptyTrashBtn.style.display = 'none';
      } else {
        trashEmpty.classList.add('hidden');
        emptyTrashBtn.style.display = '';
        const categoryMap = {};
        data.categories.forEach(c => { categoryMap[c.id] = c.name; });

        purged.forEach(item => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.dataset.id = item.id;
          const color = getIconColor(item.name);
          const daysLeft = getDaysRemaining(item.deletedAt);
          const urgency = daysLeft <= 2 ? 'urgent' : daysLeft <= 5 ? 'expiring' : 'fresh';
          const catName = item.category && categoryMap[item.category] ? categoryMap[item.category] : '';
          const catBadge = catName ? `<span class="category-badge">${catName}</span>` : '';
          div.innerHTML = `
            <div class="list-item-icon" style="background:${color};opacity:0.6">${getInitials(item.name)}</div>
            <div class="list-item-content">
              <div class="list-item-name">${item.name}</div>
              <div class="list-item-detail" title="${item.url}">${item.url}</div>
              <div class="trash-deleted-info">Deleted ${formatDeletedDate(item.deletedAt)}</div>
            </div>
            ${catBadge}
            <span class="trash-days-left ${urgency}">${daysLeft}d left</span>
            <div class="list-item-actions" style="opacity:1">
              <button class="btn btn-primary btn-restore-trash" data-id="${item.id}" title="Restore" style="padding:5px 12px;font-size:12px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Restore
              </button>
              <button class="btn btn-danger btn-purge-trash" data-id="${item.id}" title="Delete permanently">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          `;
          trashList.appendChild(div);
        });
      }
      updateBadgeCounts();
    });
  }

  trashList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const itemId = btn.dataset.id;

    if (btn.classList.contains('btn-restore-trash')) {
      chrome.storage.sync.get({ urls: [], trash: [] }, (data) => {
        const trashItem = data.trash.find(t => t.id === itemId);
        if (!trashItem) return;
        const duplicateUrl = data.urls.find(u => u.url === trashItem.url);
        if (duplicateUrl) {
          showToast('A shortcut with this URL already exists: ' + duplicateUrl.name);
          return;
        }
        const restored = { ...trashItem };
        delete restored.deletedAt;
        const newUrls = [...data.urls, restored];
        const newTrash = data.trash.filter(t => t.id !== itemId);
        chrome.storage.sync.set({ urls: newUrls, trash: newTrash }, () => {
          loadUrls();
          loadTrash();
          loadPresets();
          showToast('Shortcut restored');
        });
      });
    }
    if (btn.classList.contains('btn-purge-trash')) {
      chrome.storage.sync.get({ trash: [] }, (data) => {
        const newTrash = data.trash.filter(t => t.id !== itemId);
        chrome.storage.sync.set({ trash: newTrash }, () => {
          loadTrash();
          showToast('Permanently deleted');
        });
      });
    }
  });

  emptyTrashBtn.addEventListener('click', () => {
    if (confirm('Permanently delete all items in trash? This cannot be undone.')) {
      chrome.storage.sync.set({ trash: [] }, () => {
        loadTrash();
        showToast('Trash emptied');
      });
    }
  });

  // --- Data Management ---
  exportBtn.addEventListener('click', () => {
    chrome.storage.sync.get({ urls: [], variables: [], environments: [], categories: [], trash: [], favorites: [], settings: {} }, (data) => {
      const exportData = {
        urls: data.urls,
        variables: data.variables,
        environments: data.environments,
        categories: data.categories,
        trash: data.trash,
        favorites: data.favorites,
        settings: data.settings
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'custom_shortcuts_data.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported');
    });
  });

  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const { urls, variables, environments } = importedData;
        const categories = importedData.categories || [];
        const trash = importedData.trash || [];
        const favorites = importedData.favorites || [];
        const settings = importedData.settings || {};

        if (!Array.isArray(urls) || !Array.isArray(variables) || !Array.isArray(environments)) {
          throw new Error('Invalid data structure.');
        }

        chrome.storage.sync.set({ urls, variables, environments, categories, trash, favorites, settings }, () => {
          if (chrome.runtime.lastError) {
            showToast('Error: ' + chrome.runtime.lastError.message);
          } else {
            showToast('Data imported successfully!');
            loadUrls();
            loadVariables();
            loadEnvs();
            loadCategories();
            loadTrash();
            loadSettings();
          }
        });
      } catch (error) {
        showToast('Error reading file: ' + error.message);
      }
      importFile.value = '';
    };
    reader.readAsText(file);
  });

  // --- Variable Name Suggestions ---
  const varSuggestions = document.getElementById('var-suggestions');
  let suggestionActiveIdx = -1;

  function getVarTokenAtCursor(input) {
    const val = input.value;
    const cursor = input.selectionStart;
    const before = val.substring(0, cursor);
    const match = before.match(/\{\{([A-Z0-9_]*)$/i);
    if (!match) return null;
    return { start: match.index, prefix: match[1].toUpperCase() };
  }

  function showVarSuggestions() {
    const token = getVarTokenAtCursor(urlInput);
    if (!token) { hideVarSuggestions(); return; }

    chrome.storage.sync.get({ variables: [] }, (data) => {
      const filtered = data.variables.filter(v => v.name.startsWith(token.prefix));
      if (filtered.length === 0) { hideVarSuggestions(); return; }

      suggestionActiveIdx = -1;
      varSuggestions.innerHTML = filtered.map((v, i) => `
        <div class="var-suggestion-item" data-name="${v.name}" data-index="${i}">
          <span class="var-name">{{${v.name}}}</span>
          <span class="var-default">${v.defaultValue}</span>
        </div>
      `).join('');
      varSuggestions.classList.remove('hidden');
    });
  }

  function hideVarSuggestions() {
    varSuggestions.classList.add('hidden');
    varSuggestions.innerHTML = '';
    suggestionActiveIdx = -1;
  }

  function acceptSuggestion(varName) {
    const val = urlInput.value;
    const cursor = urlInput.selectionStart;
    const before = val.substring(0, cursor);
    const after = val.substring(cursor);
    const match = before.match(/\{\{([A-Z0-9_]*)$/i);
    if (!match) return;
    const start = match.index;
    const insertion = '{{' + varName + '}}';
    const afterClose = after.startsWith('}}') ? after.substring(2) : after;
    urlInput.value = val.substring(0, start) + insertion + afterClose;
    const newCursor = start + insertion.length;
    urlInput.setSelectionRange(newCursor, newCursor);
    urlInput.focus();
    hideVarSuggestions();
  }

  urlInput.addEventListener('input', showVarSuggestions);

  urlInput.addEventListener('keydown', (e) => {
    if (varSuggestions.classList.contains('hidden')) return;
    const items = varSuggestions.querySelectorAll('.var-suggestion-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      suggestionActiveIdx = Math.min(suggestionActiveIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('active', i === suggestionActiveIdx));
      items[suggestionActiveIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      suggestionActiveIdx = Math.max(suggestionActiveIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('active', i === suggestionActiveIdx));
      items[suggestionActiveIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestionActiveIdx >= 0 && suggestionActiveIdx < items.length) {
        e.preventDefault();
        acceptSuggestion(items[suggestionActiveIdx].dataset.name);
      }
    } else if (e.key === 'Escape') {
      hideVarSuggestions();
    }
  });

  varSuggestions.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const item = e.target.closest('.var-suggestion-item');
    if (item) acceptSuggestion(item.dataset.name);
  });

  urlInput.addEventListener('blur', () => {
    setTimeout(hideVarSuggestions, 150);
  });

  // --- Preset / Template Library ---
  const PRESET_CATALOG = [
    // General Search
    { name: 'Google', url: 'https://www.google.com/search?q=%s', icon: '🔍', category: 'General Search' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=%s', icon: '🔎', category: 'General Search' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s', icon: '🦆', category: 'General Search' },
    { name: 'Brave Search', url: 'https://search.brave.com/search?q=%s', icon: '🦁', category: 'General Search' },
    { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=%s', icon: '🌳', category: 'General Search' },
    // Developer Tools
    { name: 'GitHub', url: 'https://github.com/search?q=%s', icon: '🐙', category: 'Developer' },
    { name: 'GitHub Code Search', url: 'https://github.com/search?q=%s&type=code', icon: '🐙', category: 'Developer' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=%s', icon: '📚', category: 'Developer' },
    { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/search?q=%s', icon: '📖', category: 'Developer' },
    { name: 'npm', url: 'https://www.npmjs.com/search?q=%s', icon: '📦', category: 'Developer' },
    { name: 'PyPI', url: 'https://pypi.org/search/?q=%s', icon: '🐍', category: 'Developer' },
    { name: 'crates.io', url: 'https://crates.io/search?q=%s', icon: '🦀', category: 'Developer' },
    { name: 'Maven Central', url: 'https://search.maven.org/search?q=%s', icon: '☕', category: 'Developer' },
    { name: 'Can I Use', url: 'https://caniuse.com/?search=%s', icon: '✅', category: 'Developer' },
    { name: 'DevDocs', url: 'https://devdocs.io/#q=%s', icon: '📄', category: 'Developer' },
    { name: 'GitLab', url: 'https://gitlab.com/search?search=%s', icon: '🦊', category: 'Developer' },
    // AI & Reference
    { name: 'ChatGPT', url: 'https://chatgpt.com/?q=%s', icon: '🤖', category: 'AI & Reference' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=%s', icon: '🧠', category: 'AI & Reference' },
    { name: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/input?i=%s', icon: '🔬', category: 'AI & Reference' },
    { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Special:Search/%s', icon: '🌐', category: 'AI & Reference' },
    // Social & Media
    { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=%s', icon: '🎬', category: 'Social & Media' },
    { name: 'Reddit', url: 'https://www.reddit.com/search/?q=%s', icon: '🟠', category: 'Social & Media' },
    { name: 'X (Twitter)', url: 'https://x.com/search?q=%s', icon: '🐦', category: 'Social & Media' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/search/results/all/?keywords=%s', icon: '💼', category: 'Social & Media' },
    // Design & Assets
    { name: 'Dribbble', url: 'https://dribbble.com/search/%s', icon: '🎨', category: 'Design' },
    { name: 'Unsplash', url: 'https://unsplash.com/s/photos/%s', icon: '📷', category: 'Design' },
    { name: 'Google Fonts', url: 'https://fonts.google.com/?query=%s', icon: '🔤', category: 'Design' },
    { name: 'Figma Community', url: 'https://www.figma.com/community/search?resource_type=mixed&sort_by=relevancy&query=%s', icon: '🖌️', category: 'Design' },
    // Cloud & DevOps
    { name: 'Docker Hub', url: 'https://hub.docker.com/search?q=%s', icon: '🐳', category: 'Cloud & DevOps' },
    { name: 'AWS Docs', url: 'https://docs.aws.amazon.com/search/doc-search.html#facet_doc_product=&facet_doc_guide=&this_doc_guide=&doc_locale=en_us#702702702702702702&q=%s', icon: '☁️', category: 'Cloud & DevOps' },
    { name: 'Terraform Registry', url: 'https://registry.terraform.io/search?q=%s', icon: '🏗️', category: 'Cloud & DevOps' },
    // Shopping & Maps
    { name: 'Amazon', url: 'https://www.amazon.com/s?k=%s', icon: '🛒', category: 'Shopping & Maps' },
    { name: 'Google Maps', url: 'https://www.google.com/maps/search/%s', icon: '🗺️', category: 'Shopping & Maps' },
    { name: 'eBay', url: 'https://www.ebay.com/sch/i.html?_nkw=%s', icon: '🏷️', category: 'Shopping & Maps' }
  ];

  const presetGrid = document.getElementById('preset-grid');
  const presetSearch = document.getElementById('preset-search');
  const presetNoResults = document.getElementById('preset-no-results');
  const presetCategoryFilters = document.getElementById('preset-category-filters');
  let activePresetCategory = 'All';

  function getPresetCategories() {
    const cats = [];
    PRESET_CATALOG.forEach(p => {
      if (!cats.includes(p.category)) cats.push(p.category);
    });
    return cats;
  }

  function renderPresetFilters() {
    const cats = getPresetCategories();
    presetCategoryFilters.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'preset-filter-pill' + (activePresetCategory === 'All' ? ' active' : '');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => { activePresetCategory = 'All'; renderPresetFilters(); loadPresets(); });
    presetCategoryFilters.appendChild(allBtn);

    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'preset-filter-pill' + (activePresetCategory === cat ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', () => { activePresetCategory = cat; renderPresetFilters(); loadPresets(); });
      presetCategoryFilters.appendChild(btn);
    });
  }

  function loadPresets() {
    chrome.storage.sync.get({ urls: [] }, (data) => {
      const existingUrls = new Set(data.urls.map(u => u.url));
      const searchTerm = (presetSearch.value || '').trim().toLowerCase();

      let filtered = PRESET_CATALOG;
      if (activePresetCategory !== 'All') {
        filtered = filtered.filter(p => p.category === activePresetCategory);
      }
      if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.url.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
      }

      presetGrid.innerHTML = '';

      if (filtered.length === 0) {
        presetNoResults.classList.remove('hidden');
        return;
      }
      presetNoResults.classList.add('hidden');

      const grouped = {};
      filtered.forEach(p => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      });

      const cats = getPresetCategories();
      cats.forEach(cat => {
        if (!grouped[cat]) return;
        if (activePresetCategory === 'All') {
          const header = document.createElement('div');
          header.className = 'preset-section-header';
          header.textContent = cat;
          presetGrid.appendChild(header);
        }
        grouped[cat].forEach(preset => {
          const isAdded = existingUrls.has(preset.url);
          const card = document.createElement('div');
          card.className = 'preset-card' + (isAdded ? ' preset-added' : '');
          card.innerHTML = `
            <div class="preset-card-icon">${preset.icon}</div>
            <div class="preset-card-info">
              <div class="preset-card-name">${preset.name}</div>
              <div class="preset-card-url" title="${preset.url}">${preset.url}</div>
            </div>
            <div class="preset-card-actions">
              ${isAdded
              ? `<button class="preset-remove-btn" data-url="${preset.url}" data-name="${preset.name}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
                    Remove
                  </button>`
              : `<button class="preset-add-btn" data-name="${preset.name}" data-url="${preset.url}" data-category="${preset.category}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Add
                  </button>`
          }
            </div>
          `;
          presetGrid.appendChild(card);
        });
      });
    });
  }

  presetSearch.addEventListener('input', loadPresets);

  presetGrid.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.preset-add-btn');
    if (addBtn) {
      const name = addBtn.dataset.name;
      const url = addBtn.dataset.url;
      const presetCategory = addBtn.dataset.category;
      chrome.storage.sync.get({ urls: [] }, (data) => {
        const newItem = { id: `custom-search-${Date.now()}`, name, url, source: 'preset', presetCategory };
        const newUrls = [...data.urls, newItem];
        chrome.storage.sync.set({ urls: newUrls }, () => {
          loadPresets();
          loadUrls();
          showToast(`"${name}" added to your search URLs`);
        });
      });
      return;
    }

    const removeBtn = e.target.closest('.preset-remove-btn');
    if (removeBtn) {
      const url = removeBtn.dataset.url;
      const name = removeBtn.dataset.name;
      chrome.storage.sync.get({ urls: [], favorites: [] }, (data) => {
        const newUrls = data.urls.filter(u => u.url !== url);
        const removedIds = new Set(data.urls.filter(u => u.url === url).map(u => u.id));
        const newFavs = data.favorites.filter(id => !removedIds.has(id));
        chrome.storage.sync.set({ urls: newUrls, favorites: newFavs }, () => {
          loadPresets();
          loadUrls();
          showToast(`"${name}" removed`);
        });
      });
    }
  });

  renderPresetFilters();

  // --- Drag and Drop Reordering ---
  enableDragReorder(
      urlList, '.list-item',
      el => el.dataset.id,
      'urls', 'id',
      loadUrls
  );

  enableDragReorder(
      variableList, '.list-item',
      el => el.dataset.variableName,
      'variables', 'name',
      () => { loadVariables(); loadEnvs(); }
  );

  enableDragReorder(
      envList, '.env-section',
      el => el.dataset.envId,
      'environments', 'id',
      loadEnvs
  );

  enableDragReorder(
      categoryList, '.list-item',
      el => el.dataset.id,
      'categories', 'id',
      () => { loadCategories(); loadUrls(); }
  );

  // --- Settings Management ---
  function loadSettings() {
    chrome.storage.sync.get({ settings: DEFAULT_SETTINGS, categories: [] }, (data) => {
      currentSettings = { ...DEFAULT_SETTINGS, ...data.settings };
      settingTrashDays.value = currentSettings.trashDays;
      settingTabPosition.value = currentSettings.tabPosition;
      document.getElementById('trash-retention-display').textContent = currentSettings.trashDays + ' days';

      // Populate default category dropdown
      settingDefaultCategory.innerHTML = '<option value="">None</option>';
      data.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon || '📁'} ${cat.name}`;
        if (cat.id === currentSettings.defaultCategory) opt.selected = true;
        settingDefaultCategory.appendChild(opt);
      });

      const presetMenuLayoutSelect = document.getElementById('setting-preset-menu-layout');
      if (presetMenuLayoutSelect) presetMenuLayoutSelect.value = currentSettings.presetMenuLayout || 'flat';

      renderContextMenuOrder();
    });
  }

  function saveSettings(partial) {
    chrome.storage.sync.get({ settings: DEFAULT_SETTINGS }, (data) => {
      const updated = { ...DEFAULT_SETTINGS, ...data.settings, ...partial };
      chrome.storage.sync.set({ settings: updated }, () => {
        currentSettings = updated;
        showToast('Settings saved');
      });
    });
  }

  settingTrashDays.addEventListener('change', () => {
    const val = Math.min(90, Math.max(1, parseInt(settingTrashDays.value) || 15));
    settingTrashDays.value = val;
    document.getElementById('trash-retention-display').textContent = val + ' days';
    saveSettings({ trashDays: val });
    loadTrash();
  });

  settingTabPosition.addEventListener('change', () => {
    saveSettings({ tabPosition: settingTabPosition.value });
  });

  settingDefaultCategory.addEventListener('change', () => {
    saveSettings({ defaultCategory: settingDefaultCategory.value });
  });

  document.getElementById('setting-preset-menu-layout').addEventListener('change', (e) => {
    saveSettings({ presetMenuLayout: e.target.value });
  });

  // --- Context Menu Order ---
  const CONTEXT_MENU_SECTIONS = {
    favorites: { icon: '⭐', label: 'Favorites' },
    presets: { icon: '📚', label: 'Presets' },
    urls: { icon: '🔗', label: 'Search URLs' },
    categories: { icon: '🏷️', label: 'Categories' }
  };
  const contextMenuOrderContainer = document.getElementById('context-menu-order');
  let cmoDraggedItem = null;
  let cmoHandleClicked = false;

  contextMenuOrderContainer.addEventListener('mousedown', (e) => {
    cmoHandleClicked = !!e.target.closest('.order-handle');
  });

  contextMenuOrderContainer.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.context-menu-order-item');
    if (!item || !cmoHandleClicked) { e.preventDefault(); return; }
    cmoDraggedItem = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  });

  contextMenuOrderContainer.addEventListener('dragend', () => {
    if (cmoDraggedItem) cmoDraggedItem.classList.remove('dragging');
    contextMenuOrderContainer.querySelectorAll('.context-menu-order-item').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    cmoDraggedItem = null;
  });

  contextMenuOrderContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.context-menu-order-item');
    if (!item || item === cmoDraggedItem) return;
    contextMenuOrderContainer.querySelectorAll('.context-menu-order-item').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    item.classList.add(e.clientY < midY ? 'drag-over-top' : 'drag-over-bottom');
  });

  contextMenuOrderContainer.addEventListener('dragleave', (e) => {
    const item = e.target.closest('.context-menu-order-item');
    if (item) item.classList.remove('drag-over-top', 'drag-over-bottom');
  });

  contextMenuOrderContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const targetItem = e.target.closest('.context-menu-order-item');
    if (!targetItem || !cmoDraggedItem || targetItem === cmoDraggedItem) return;
    const rect = targetItem.getBoundingClientRect();
    const insertAfter = e.clientY >= rect.top + rect.height / 2;

    const currentOrder = currentSettings.contextMenuOrder || DEFAULT_SETTINGS.contextMenuOrder;
    const newOrder = [...currentOrder];
    const draggedKey = cmoDraggedItem.dataset.key;
    const targetKey = targetItem.dataset.key;
    const draggedIdx = newOrder.indexOf(draggedKey);
    newOrder.splice(draggedIdx, 1);
    let targetIdx = newOrder.indexOf(targetKey);
    if (insertAfter) targetIdx++;
    newOrder.splice(targetIdx, 0, draggedKey);

    currentSettings.contextMenuOrder = newOrder;
    saveSettings({ contextMenuOrder: newOrder });
    renderContextMenuOrder();
  });

  function renderContextMenuOrder() {
    const order = currentSettings.contextMenuOrder || DEFAULT_SETTINGS.contextMenuOrder;
    contextMenuOrderContainer.innerHTML = '';

    order.forEach((key, idx) => {
      const section = CONTEXT_MENU_SECTIONS[key];
      if (!section) return;
      const item = document.createElement('div');
      item.className = 'context-menu-order-item';
      item.draggable = true;
      item.dataset.key = key;
      item.innerHTML = `
        <span class="order-handle">${DRAG_HANDLE_SVG}</span>
        <span class="order-number">${idx + 1}</span>
        <span class="order-icon">${section.icon}</span>
        <span class="order-label">${section.label}</span>
      `;
      contextMenuOrderContainer.appendChild(item);
    });
  }

  // --- Tutorial ---
  const TUTORIAL_STEPS = [
    {
      icon: '👋',
      title: 'Welcome to Custom Search Shortcuts!',
      body: `<p>This quick tutorial will walk you through the key features so you can get started in under a minute.</p>`
    },
    {
      icon: '🔗',
      title: 'Add Search URLs',
      body: `<p>Head to the <strong>Search URLs</strong> tab to add your custom search engines. Use <code>%s</code> as a placeholder for selected text.</p>
        <ul class="tutorial-tip-list">
          <li>Example: <code>https://google.com/search?q=%s</code></li>
          <li>Select text on any page, right-click, and pick your shortcut</li>
          <li>You can also click <strong>Add Current Tab</strong> in the popup to quickly save a page</li>
        </ul>`
    },
    {
      icon: '🏷️',
      title: 'Organize with Categories',
      body: `<p>Group your shortcuts into <strong>Categories</strong> with custom emoji icons. Categorized URLs appear as nested submenus in the right-click context menu.</p>
        <ul class="tutorial-tip-list">
          <li>Create categories like "Work", "Dev Tools", "Social"</li>
          <li>Assign a category when adding or editing a URL</li>
          <li>Drag and drop to reorder categories</li>
        </ul>`
    },
    {
      icon: '⭐',
      title: 'Pin Favorites',
      body: `<p>Click the <strong>star icon</strong> on any shortcut to mark it as a favorite. Favorites are pinned to the top of both the popup and the right-click context menu for instant access.</p>`
    },
    {
      icon: '🔀',
      title: 'Environment Variables',
      body: `<p>Perfect for developers! Define <strong>variables</strong> like <code>{{INSTANCE}}</code> in your URLs, then create <strong>environments</strong> (Dev, Staging, Prod) with different values.</p>
        <ul class="tutorial-tip-list">
          <li>Variables tab: define variable names and default values</li>
          <li>Environments tab: override values per environment</li>
          <li>Right-click menu shows environment sub-options automatically</li>
        </ul>`
    },
    {
      icon: '🛡️',
      title: 'Trash, Import/Export & Settings',
      body: `<p>A few more things you should know:</p>
        <ul class="tutorial-tip-list">
          <li><strong>Trash</strong> — deleted shortcuts are recoverable for up to 15 days</li>
          <li><strong>Import/Export</strong> — backup all your data as JSON (top-right buttons)</li>
          <li><strong>Settings</strong> — configure theme, trash retention, tab position, and default category</li>
          <li><strong>Help</strong> — click the Help button anytime to replay this tutorial</li>
        </ul>`
    },
    {
      icon: '🚀',
      title: 'Quick Start with Presets',
      body: `<p>Want to hit the ground running? Add all <strong>built-in preset search engines</strong> (Google, GitHub, Stack Overflow, YouTube, and more) to your shortcuts in one click.</p>
        <p>You can always manage them later from the <strong>Presets</strong> tab.</p>
        <div class="tutorial-preset-actions">
          <button class="btn btn-add-all" id="tutorial-add-all-presets">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Add All Presets
          </button>
          <button class="btn btn-skip-presets" id="tutorial-skip-presets">No thanks</button>
        </div>`
    }
  ];

  let tutorialStep = 0;
  const tutorialOverlay = document.getElementById('tutorial-overlay');
  const tutorialIcon = document.getElementById('tutorial-icon');
  const tutorialTitle = document.getElementById('tutorial-title');
  const tutorialBody = document.getElementById('tutorial-body');
  const tutorialDots = document.getElementById('tutorial-dots');
  const tutorialNext = document.getElementById('tutorial-next');
  const tutorialSkip = document.getElementById('tutorial-skip');
  const tutorialClose = document.getElementById('tutorial-close');

  function addAllPresets(callback) {
    chrome.storage.sync.get({ urls: [] }, (data) => {
      const existingUrls = new Set(data.urls.map(u => u.url));
      const newPresets = PRESET_CATALOG
          .filter(p => !existingUrls.has(p.url))
          .map(p => ({ id: `custom-search-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: p.name, url: p.url, source: 'preset', presetCategory: p.category }));
      if (newPresets.length === 0) {
        if (callback) callback(0);
        return;
      }
      const newUrls = [...data.urls, ...newPresets];
      chrome.storage.sync.set({ urls: newUrls }, () => {
        loadUrls();
        loadPresets();
        if (callback) callback(newPresets.length);
      });
    });
  }

  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialStep];
    tutorialIcon.textContent = step.icon;
    tutorialTitle.textContent = step.title;
    tutorialBody.innerHTML = step.body;

    tutorialDots.innerHTML = TUTORIAL_STEPS.map((_, i) => {
      const cls = i < tutorialStep ? 'tutorial-step-dot done' : i === tutorialStep ? 'tutorial-step-dot active' : 'tutorial-step-dot';
      return `<div class="${cls}"></div>`;
    }).join('');

    const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
    tutorialNext.innerHTML = isLast
        ? 'Get Started <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
        : 'Next <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
    tutorialSkip.textContent = isLast ? '' : 'Skip tutorial';
    tutorialSkip.style.visibility = isLast ? 'hidden' : 'visible';

    // Wire up preset buttons on the final step
    const addAllBtn = document.getElementById('tutorial-add-all-presets');
    const skipPresetsBtn = document.getElementById('tutorial-skip-presets');
    if (addAllBtn) {
      addAllBtn.addEventListener('click', () => {
        addAllBtn.disabled = true;
        addAllBtn.textContent = 'Adding...';
        addAllPresets((count) => {
          addAllBtn.textContent = count > 0 ? `${count} presets added!` : 'All presets already added';
          setTimeout(() => closeTutorial(), 1200);
        });
      });
    }
    if (skipPresetsBtn) {
      skipPresetsBtn.addEventListener('click', closeTutorial);
    }
  }

  function showTutorial() {
    tutorialStep = 0;
    renderTutorialStep();
    tutorialOverlay.classList.remove('hidden');
  }

  function closeTutorial() {
    tutorialOverlay.classList.add('hidden');
    chrome.storage.sync.get({ settings: DEFAULT_SETTINGS }, (data) => {
      const updated = { ...DEFAULT_SETTINGS, ...data.settings, tutorialSeen: true };
      chrome.storage.sync.set({ settings: updated });
    });
  }

  tutorialNext.addEventListener('click', () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      tutorialStep++;
      renderTutorialStep();
    } else {
      closeTutorial();
    }
  });

  tutorialSkip.addEventListener('click', closeTutorial);
  tutorialClose.addEventListener('click', closeTutorial);
  tutorialOverlay.addEventListener('click', (e) => {
    if (e.target === tutorialOverlay) closeTutorial();
  });

  document.getElementById('help-btn').addEventListener('click', showTutorial);

  // --- Initial Load ---
  loadSettings();
  loadUrls();
  loadPresets();
  loadVariables();
  loadEnvs();
  loadCategories();
  loadTrash();

  // Show tutorial on first visit or when requested via query param
  if (urlParams.get('tutorial') === '1') {
    showTutorial();
  } else {
    chrome.storage.sync.get({ settings: DEFAULT_SETTINGS }, (data) => {
      if (!data.settings.tutorialSeen) showTutorial();
    });
  }
});