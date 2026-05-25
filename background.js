// Preset URL to category mapping (for grouping presets in context menu)
const PRESET_CATEGORY_MAP = {
  'https://www.google.com/search?q=%s': 'General Search',
  'https://www.bing.com/search?q=%s': 'General Search',
  'https://duckduckgo.com/?q=%s': 'General Search',
  'https://search.brave.com/search?q=%s': 'General Search',
  'https://www.ecosia.org/search?q=%s': 'General Search',
  'https://github.com/search?q=%s': 'Developer',
  'https://github.com/search?q=%s&type=code': 'Developer',
  'https://stackoverflow.com/search?q=%s': 'Developer',
  'https://developer.mozilla.org/en-US/search?q=%s': 'Developer',
  'https://www.npmjs.com/search?q=%s': 'Developer',
  'https://pypi.org/search/?q=%s': 'Developer',
  'https://crates.io/search?q=%s': 'Developer',
  'https://search.maven.org/search?q=%s': 'Developer',
  'https://caniuse.com/?search=%s': 'Developer',
  'https://devdocs.io/#q=%s': 'Developer',
  'https://gitlab.com/search?search=%s': 'Developer',
  'https://chatgpt.com/?q=%s': 'AI & Reference',
  'https://www.perplexity.ai/search?q=%s': 'AI & Reference',
  'https://www.wolframalpha.com/input?i=%s': 'AI & Reference',
  'https://en.wikipedia.org/wiki/Special:Search/%s': 'AI & Reference',
  'https://www.youtube.com/results?search_query=%s': 'Social & Media',
  'https://www.reddit.com/search/?q=%s': 'Social & Media',
  'https://x.com/search?q=%s': 'Social & Media',
  'https://www.linkedin.com/search/results/all/?keywords=%s': 'Social & Media',
  'https://dribbble.com/search/%s': 'Design',
  'https://unsplash.com/s/photos/%s': 'Design',
  'https://fonts.google.com/?query=%s': 'Design',
  'https://www.figma.com/community/search?resource_type=mixed&sort_by=relevancy&query=%s': 'Design',
  'https://hub.docker.com/search?q=%s': 'Cloud & DevOps',
  'https://docs.aws.amazon.com/search/doc-search.html#facet_doc_product=&facet_doc_guide=&this_doc_guide=&doc_locale=en_us#702702702702702702&q=%s': 'Cloud & DevOps',
  'https://registry.terraform.io/search?q=%s': 'Cloud & DevOps',
  'https://www.amazon.com/s?k=%s': 'Shopping & Maps',
  'https://www.google.com/maps/search/%s': 'Shopping & Maps',
  'https://www.ebay.com/sch/i.html?_nkw=%s': 'Shopping & Maps'
};

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
  chrome.storage.sync.get({ urls: [], variables: [], environments: [], categories: [], favorites: [], settings: {} }, (data) => {
    chrome.contextMenus.removeAll(() => {
      createParentMenu();
      const { urls, environments, categories, favorites, settings } = data;
      const favSet = new Set(favorites || []);
      const DEFAULT_ORDER = ['favorites', 'presets', 'urls', 'categories'];
      const contextMenuOrder = (settings && settings.contextMenuOrder) || DEFAULT_ORDER;

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

        // Prepare section data
        const presetUrls = urls.filter(u => u.source === 'preset');
        const nonPresetUrls = urls.filter(u => u.source !== 'preset');
        const favUrls = nonPresetUrls.filter(u => favSet.has(u.id));
        const nonFavUrls = nonPresetUrls.filter(u => !favSet.has(u.id));
        const uncategorizedUrls = nonFavUrls.filter(u => !u.category || !categoryMap[u.category]);
        const usedCategories = categories.filter(cat => nonPresetUrls.some(u => u.category === cat.id));

        // Render sections in user-defined order
        let sectionsRendered = 0;

        const renderSection = {
          favorites: () => {
            if (favUrls.length === 0) return;
            if (sectionsRendered > 0) {
              chrome.contextMenus.create({
                id: 'separator-favorites',
                type: 'separator',
                contexts: ['selection'],
                parentId: 'customSearchParent'
              });
            }
            favUrls.forEach(urlItem => addUrlMenu(urlItem, 'customSearchParent'));
            sectionsRendered++;
          },
          presets: () => {
            if (presetUrls.length === 0) return;
            if (sectionsRendered > 0) {
              chrome.contextMenus.create({
                id: 'separator-presets',
                type: 'separator',
                contexts: ['selection'],
                parentId: 'customSearchParent'
              });
            }
            chrome.contextMenus.create({
              id: 'preset-submenu',
              title: '📚 Presets',
              contexts: ['selection'],
              parentId: 'customSearchParent'
            });
            const presetMenuLayout = (settings && settings.presetMenuLayout) || 'flat';
            if (presetMenuLayout === 'grouped') {
              const presetGroups = {};
              presetUrls.forEach(urlItem => {
                const cat = urlItem.presetCategory || PRESET_CATEGORY_MAP[urlItem.url] || 'Other';
                if (!presetGroups[cat]) presetGroups[cat] = [];
                presetGroups[cat].push(urlItem);
              });
              Object.keys(presetGroups).forEach(cat => {
                const groupId = `preset-group-${cat.replace(/[^a-zA-Z0-9]/g, '_')}`;
                chrome.contextMenus.create({
                  id: groupId,
                  title: cat,
                  contexts: ['selection'],
                  parentId: 'preset-submenu'
                });
                presetGroups[cat].forEach(urlItem => {
                  const suffix = favSet.has(urlItem.id) ? '_preset' : '';
                  addUrlMenu(urlItem, groupId, suffix);
                });
              });
            } else {
              presetUrls.forEach(urlItem => {
                const suffix = favSet.has(urlItem.id) ? '_preset' : '';
                addUrlMenu(urlItem, 'preset-submenu', suffix);
              });
            }
            sectionsRendered++;
          },
          urls: () => {
            if (uncategorizedUrls.length === 0) return;
            if (sectionsRendered > 0) {
              chrome.contextMenus.create({
                id: 'separator-urls',
                type: 'separator',
                contexts: ['selection'],
                parentId: 'customSearchParent'
              });
            }
            uncategorizedUrls.forEach(urlItem => addUrlMenu(urlItem, 'customSearchParent'));
            sectionsRendered++;
          },
          categories: () => {
            if (usedCategories.length === 0) return;
            if (sectionsRendered > 0) {
              chrome.contextMenus.create({
                id: 'separator-categories',
                type: 'separator',
                contexts: ['selection'],
                parentId: 'customSearchParent'
              });
            }
            usedCategories.forEach(cat => {
              const icon = cat.icon || '📁';
              chrome.contextMenus.create({
                id: categoryMap[cat.id],
                title: `${icon} ${cat.name}`,
                contexts: ['selection'],
                parentId: 'customSearchParent'
              });
              nonPresetUrls.filter(u => u.category === cat.id)
                  .forEach(urlItem => {
                    const suffix = favSet.has(urlItem.id) ? '_cat' : '';
                    addUrlMenu(urlItem, categoryMap[cat.id], suffix);
                  });
            });
            sectionsRendered++;
          }
        };

        contextMenuOrder.forEach(sectionKey => {
          if (renderSection[sectionKey]) renderSection[sectionKey]();
        });
      }

      // Management options (always at the bottom)
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

  const cleanedId = info.menuItemId.replace(/_(cat|preset)$/, '');
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
  if (namespace === 'sync' && (changes.urls || changes.variables || changes.environments || changes.categories || changes.favorites || changes.settings)) {
    loadMenuItems();
  }
});

// --- Keyboard Shortcut Handler ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'KEYBOARD_SHORTCUT_SEARCH') return;

  const { urlId, selectedText } = message;
  chrome.storage.sync.get({ urls: [], variables: [], environments: [], settings: {} }, (data) => {
    const urlItem = data.urls.find(item => item.id === urlId);
    if (!urlItem) return;

    // For keyboard shortcuts, use the default variable values (no environment)
    const resolvedUrl = substituteEnvVars(urlItem.url, 'NO_ENV', data.variables, data.environments);
    const finalUrl = resolvedUrl.replace('%s', encodeURIComponent(selectedText));

    const tabOpts = { url: finalUrl };
    if (sender.tab && (data.settings.tabPosition || 'next') === 'next') {
      tabOpts.index = sender.tab.index + 1;
    }
    chrome.tabs.create(tabOpts);
  });
});

// --- Omnibox Handler (keyword: cs) ---
chrome.omnibox.onInputStarted.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({
    description: 'Custom Search: Type a search shortcut name followed by your query (e.g., "google hello world")'
  });
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  chrome.storage.sync.get({ urls: [] }, (data) => {
    const input = text.trim().toLowerCase();
    if (!input) return suggest([]);

    const parts = input.split(/\s+/);
    const prefix = parts[0];

    // Suggest URLs whose name starts with the first word
    const suggestions = data.urls
        .filter(u => u.name.toLowerCase().startsWith(prefix) || u.name.toLowerCase().includes(prefix))
        .slice(0, 8)
        .map(u => {
          const query = parts.slice(1).join(' ') || '...';
          const escapedName = u.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const escapedQuery = query.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return {
            content: u.name + ' ' + (parts.slice(1).join(' ') || ''),
            description: `Search <match>${escapedName}</match> for <dim>"${escapedQuery}"</dim>`
          };
        });
    suggest(suggestions);
  });
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  chrome.storage.sync.get({ urls: [], variables: [], environments: [], settings: {} }, (data) => {
    const input = text.trim();
    if (!input) return;

    const parts = input.split(/\s+/);
    const shortcutName = parts[0].toLowerCase();
    const query = parts.slice(1).join(' ');

    // Try exact name match first (case-insensitive), then prefix, then contains
    let urlItem = data.urls.find(u => u.name.toLowerCase() === shortcutName);
    if (!urlItem) urlItem = data.urls.find(u => u.name.toLowerCase().startsWith(shortcutName));
    if (!urlItem) urlItem = data.urls.find(u => u.name.toLowerCase().includes(shortcutName));

    // If still no match but we have a query, use it as the full search text with the first URL
    if (!urlItem && data.urls.length > 0) {
      // Treat entire input as query, use first URL (Google or first available)
      urlItem = data.urls.find(u => u.name.toLowerCase().includes('google')) || data.urls[0];
      const resolvedUrl = substituteEnvVars(urlItem.url, 'NO_ENV', data.variables, data.environments);
      const finalUrl = resolvedUrl.replace('%s', encodeURIComponent(input));
      openOmniboxResult(finalUrl, disposition);
      return;
    }

    if (urlItem) {
      const searchText = query || '';
      const resolvedUrl = substituteEnvVars(urlItem.url, 'NO_ENV', data.variables, data.environments);
      const finalUrl = resolvedUrl.replace('%s', encodeURIComponent(searchText));
      openOmniboxResult(finalUrl, disposition);
    }
  });
});

/**
 * Opens a URL based on the omnibox disposition.
 * @param {string} url - The URL to open.
 * @param {string} disposition - "currentTab", "newForegroundTab", or "newBackgroundTab".
 */
function openOmniboxResult(url, disposition) {
  switch (disposition) {
    case 'currentTab':
      chrome.tabs.update({ url });
      break;
    case 'newForegroundTab':
      chrome.tabs.create({ url });
      break;
    case 'newBackgroundTab':
      chrome.tabs.create({ url, active: false });
      break;
    default:
      chrome.tabs.update({ url });
  }
}
