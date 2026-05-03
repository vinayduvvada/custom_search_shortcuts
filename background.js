// Create a parent menu item on installation
chrome.runtime.onInstalled.addListener(() => {
  createParentMenu();
  loadMenuItems();
});

function createParentMenu() {
  chrome.contextMenus.create({
    id: 'customSearchParent',
    title: 'Custom Search',
    contexts: ['selection']
  });
}

// Function to load menu items from storage
function loadMenuItems() {
  chrome.storage.sync.get({ urls: [], variables: [], environments: [], categories: [], favorites: [] }, (data) => {
    chrome.contextMenus.removeAll(() => {
      createParentMenu();
      const { urls, environments, categories, favorites } = data;
      const favSet = new Set(favorites || []);

      if (urls && urls.length > 0) {
        const categoryMap = {};
        categories.forEach(cat => { categoryMap[cat.id] = `cat_${cat.id}`; });

        // Helper to add a URL menu item under a given parent
        const addUrlMenu = (urlItem, parentMenuId, idSuffix) => {
          const suffix = idSuffix || '';
          const hasVariablesInUrl = /\{\{(.+?)\}\}/.test(urlItem.url);
          const hasEnvironments = environments && environments.length > 0;
          const shouldShowEnvironments = hasVariablesInUrl && hasEnvironments;
          const urlMenuId = shouldShowEnvironments ? `parent_${urlItem.id}${suffix}` : `${urlItem.id}|NO_ENV${suffix}`;

          chrome.contextMenus.create({
            id: urlMenuId,
            title: urlItem.name,
            contexts: ['selection'],
            parentId: parentMenuId
          });

          if (shouldShowEnvironments) {
            environments.forEach(env => {
              chrome.contextMenus.create({
                id: `${urlItem.id}|${env.id}${suffix}`,
                title: env.name,
                contexts: ['selection'],
                parentId: urlMenuId
              });
            });
          }
        };

        // 0. Favorites first (pinned at top)
        const favUrls = urls.filter(u => favSet.has(u.id));
        const nonFavUrls = urls.filter(u => !favSet.has(u.id));

        if (favUrls.length > 0) {
          favUrls.forEach(urlItem => addUrlMenu(urlItem, 'customSearchParent'));
          if (nonFavUrls.length > 0) {
            chrome.contextMenus.create({
              id: 'separator-favorites',
              type: 'separator',
              contexts: ['selection'],
              parentId: 'customSearchParent'
            });
          }
        }

        // 1. Uncategorized (non-favorite) URLs
        nonFavUrls.filter(u => !u.category || !categoryMap[u.category])
          .forEach(urlItem => addUrlMenu(urlItem, 'customSearchParent'));

        // 2. Separator between uncategorized URLs and categories (if both exist)
        const hasUncategorized = nonFavUrls.some(u => !u.category || !categoryMap[u.category]);
        const usedCategories = categories.filter(cat => urls.some(u => u.category === cat.id));
        if ((hasUncategorized || favUrls.length > 0) && usedCategories.length > 0) {
          chrome.contextMenus.create({
            id: 'separator-categories',
            type: 'separator',
            contexts: ['selection'],
            parentId: 'customSearchParent'
          });
        }

        // 3. Category submenus with all their URLs (favorites appear here too)
        usedCategories.forEach(cat => {
          const icon = cat.icon || '📁';
          chrome.contextMenus.create({
            id: categoryMap[cat.id],
            title: `${icon} ${cat.name}`,
            contexts: ['selection'],
            parentId: 'customSearchParent'
          });
          urls.filter(u => u.category === cat.id)
            .forEach(urlItem => {
              const suffix = favSet.has(urlItem.id) ? '_cat' : '';
              addUrlMenu(urlItem, categoryMap[cat.id], suffix);
            });
        });
      }

      // 4. Separator before management options
      if (urls && urls.length > 0) {
        chrome.contextMenus.create({
          id: 'separator',
          type: 'separator',
          contexts: ['selection'],
          parentId: 'customSearchParent'
        });
      }

      chrome.contextMenus.create({
        id: 'manage',
        title: 'Manage Custom Searches',
        contexts: ['selection'],
        parentId: 'customSearchParent'
      });

      chrome.contextMenus.create({
        id: 'addCurrentUrl',
        title: 'Add Current Page to Search List',
        contexts: ['selection'],
        parentId: 'customSearchParent'
      });
    });
  });
}

// Function to substitute environment variables in a URL
function substituteEnvVars(url, envId, variables, environments) {
  return url.replace(/\{\{(.+?)\}\}/g, (match, varName) => {
    const trimmedVarName = varName.trim();
    const variable = variables.find(v => v.name === trimmedVarName);

    if (variable) {
      const env = environments.find(e => e.id === envId);
      if (env) {
        const envValue = env.values.find(v => v.key === trimmedVarName);
        if (envValue && envValue.value) {
          return envValue.value; // Use environment-specific value
        }
      }
      return variable.defaultValue || ''; // Fallback to default value
    }
    return match; // If variable is not defined, return the original placeholder
  });
}

// Listen for clicks on context menu items
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'manage') {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (info.menuItemId === 'addCurrentUrl') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] &&
        !(tabs[0].url.startsWith('chrome-extension://') || tabs[0].url.startsWith('chrome://'))) {
        const tabUrl = tabs[0].url;
        const tabTitle = tabs[0].title || 'New Search';
        chrome.tabs.create({
          url: chrome.runtime.getURL('options.html') +
            '?prefillName=' + encodeURIComponent(tabTitle) +
            '&prefillUrl=' + encodeURIComponent(tabUrl)
        });
      }
    });
    return;
  }

  if (info.menuItemId.startsWith('parent_')) return; // Ignore clicks on parent menu items

  const cleanedId = info.menuItemId.replace(/_cat$/, '');
  const [urlId, envId] = cleanedId.split('|');
  if (!urlId) return;

  chrome.storage.sync.get({ urls: [], variables: [], environments: [], settings: {} }, (data) => {
    const urlItem = data.urls.find(item => item.id === urlId);
    if (urlItem) {
      const resolvedUrl = substituteEnvVars(urlItem.url, envId, data.variables, data.environments);
      const finalUrl = resolvedUrl.replace('%s', encodeURIComponent(info.selectionText));
      const tabOpts = { url: finalUrl };
      if ((data.settings.tabPosition || 'next') === 'next') tabOpts.index = tab.index + 1;
      chrome.tabs.create(tabOpts);
    }
  });
});

// Listen for changes in storage to update menu items
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.urls || changes.variables || changes.environments || changes.categories || changes.favorites)) {
    loadMenuItems();
  }
});
