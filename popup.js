document.addEventListener('DOMContentLoaded', () => {
  const shortcutsList = document.getElementById('shortcuts-list');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const addCurrentUrlBtn = document.getElementById('add-current-url-btn');

  const ICON_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0d9488'];

  function getIconColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
  }

  function getInitials(name) {
    return name.split(/[\s_-]+/).map(w => w[0]).join('').substring(0, 2);
  }

  function resolveUrlWithDefaults(url, variables) {
    return url.replace(/\{\{(.+?)\}\}/g, (match, varName) => {
      const variable = variables.find(v => v.name === varName.trim());
      return variable ? variable.defaultValue : match;
    });
  }

  function getDomain(url) {
    try { return new URL(url).hostname; } catch { return url.substring(0, 40); }
  }

  function toggleFavorite(urlId) {
    chrome.storage.sync.get({ favorites: [] }, (data) => {
      const favs = data.favorites;
      const idx = favs.indexOf(urlId);
      if (idx === -1) { favs.push(urlId); } else { favs.splice(idx, 1); }
      chrome.storage.sync.set({ favorites: favs }, () => {
        loadAndRender(searchInput.value.trim().toLowerCase() || undefined);
      });
    });
  }

  function createShortcutButton(item, variables, isFavorite) {
    const btn = document.createElement('button');
    btn.className = 'shortcut-item';
    const resolvedUrl = resolveUrlWithDefaults(item.url, variables);
    btn.title = resolvedUrl;
    const color = getIconColor(item.name);
    const starClass = isFavorite ? 'fav-star active' : 'fav-star';
    btn.innerHTML = `
      <div class="shortcut-icon" style="background:${color}">${getInitials(item.name)}</div>
      <div class="shortcut-info">
        <div class="shortcut-name">${item.name}</div>
        <div class="shortcut-url">${getDomain(resolvedUrl)}</div>
      </div>
      <span class="${starClass}" data-id="${item.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </span>
      <svg class="shortcut-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7.8H7.8"/></svg>
    `;
    btn.querySelector('.fav-star').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(item.id);
    });
    btn.addEventListener('click', () => {
      chrome.storage.sync.get({ settings: {} }, (sData) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabOpts = { url: resolvedUrl.replace('%s', '') };
          if ((sData.settings.tabPosition || 'next') === 'next' && tabs[0]) {
            tabOpts.index = tabs[0].index + 1;
          }
          chrome.tabs.create(tabOpts);
        });
      });
    });
    return btn;
  }

  function renderShortcuts(urls, variables, categories, filter, favorites) {
    shortcutsList.innerHTML = '';
    const favSet = new Set(favorites || []);
    const filtered = filter
      ? urls.filter(u => u.name.toLowerCase().includes(filter) || u.url.toLowerCase().includes(filter))
      : urls;

    if (filtered.length === 0 && urls.length === 0) {
      shortcutsList.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    shortcutsList.style.display = 'block';
    emptyState.style.display = 'none';

    if (filtered.length === 0) {
      shortcutsList.innerHTML = '<div style="padding:16px;text-align:center;color:#94a3b8;font-size:13px;">No matching shortcuts</div>';
      return;
    }

    const favItems = filtered.filter(u => favSet.has(u.id));
    const nonFavItems = filtered.filter(u => !favSet.has(u.id));

    if (favItems.length > 0) {
      const favHeader = document.createElement('div');
      favHeader.className = 'category-group-header';
      favHeader.innerHTML = '<span style="font-size:13px">⭐</span>Favorites';
      shortcutsList.appendChild(favHeader);
      favItems.forEach(item => shortcutsList.appendChild(createShortcutButton(item, variables, true)));
    }

    if (favItems.length > 0 && nonFavItems.length > 0) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:var(--border);margin:4px 16px;';
      shortcutsList.appendChild(sep);
    }

    const hasCategories = categories && categories.length > 0;
    const hasCategorizedUrls = hasCategories && nonFavItems.some(u => u.category);

    if (!hasCategorizedUrls) {
      nonFavItems.forEach(item => shortcutsList.appendChild(createShortcutButton(item, variables, false)));
      return;
    }

    const categoryMap = {};
    categories.forEach(c => { categoryMap[c.id] = c.name; });

    const uncategorized = nonFavItems.filter(u => !u.category || !categoryMap[u.category]);
    const grouped = {};
    categories.forEach(c => { grouped[c.id] = []; });
    nonFavItems.forEach(u => {
      if (u.category && categoryMap[u.category]) grouped[u.category].push(u);
    });

    uncategorized.forEach(item => shortcutsList.appendChild(createShortcutButton(item, variables, false)));

    categories.forEach(cat => {
      if (grouped[cat.id].length === 0) return;
      const header = document.createElement('div');
      header.className = 'category-group-header';
      const catIcon = cat.icon || '📁';
      header.innerHTML = `<span style="font-size:13px">${catIcon}</span>${cat.name}`;
      shortcutsList.appendChild(header);
      grouped[cat.id].forEach(item => shortcutsList.appendChild(createShortcutButton(item, variables, false)));
    });
  }

  function loadAndRender(filter) {
    chrome.storage.sync.get({ urls: [], variables: [], categories: [], favorites: [] }, (data) => {
      renderShortcuts(data.urls, data.variables, data.categories, filter, data.favorites);
    });
  }

  searchInput.addEventListener('input', () => {
    loadAndRender(searchInput.value.trim().toLowerCase());
  });

  // Hide add-current-tab if on extension page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url &&
        (tabs[0].url.startsWith('chrome-extension://') || tabs[0].url.startsWith('chrome://'))) {
      addCurrentUrlBtn.style.display = 'none';
    }
  });

  // Theme cycle button (light → system → dark → light)
  const THEME_CYCLE = ['light', 'system', 'dark'];
  const THEME_ICONS = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  };
  const THEME_TITLES = { light: 'Light mode', system: 'System theme', dark: 'Dark mode' };
  const themeCycleBtn = document.getElementById('theme-cycle-btn');

  function updateThemeCycleBtn(mode) {
    themeCycleBtn.innerHTML = THEME_ICONS[mode];
    themeCycleBtn.title = THEME_TITLES[mode];
  }

  chrome.storage.sync.get({ theme: 'system' }, (data) => {
    updateThemeCycleBtn(data.theme || 'system');
  });

  themeCycleBtn.addEventListener('click', () => {
    chrome.storage.sync.get({ theme: 'system' }, (data) => {
      const current = data.theme || 'system';
      const nextIdx = (THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length;
      const next = THEME_CYCLE[nextIdx];
      chrome.storage.sync.set({ theme: next });
      updateThemeCycleBtn(next);
    });
  });

  document.getElementById('help-popup-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') + '?tutorial=1' });
  });

  document.getElementById('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('manage-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('add-first-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  addCurrentUrlBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tabUrl = tabs[0].url;
        const tabTitle = tabs[0].title || 'New Search';
        chrome.tabs.create({
          url: chrome.runtime.getURL('options.html') +
            '?prefillName=' + encodeURIComponent(tabTitle) +
            '&prefillUrl=' + encodeURIComponent(tabUrl)
        });
      }
    });
  });

  loadAndRender();
});
