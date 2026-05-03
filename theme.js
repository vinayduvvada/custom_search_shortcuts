/**
 * Theme manager for Custom Search Shortcuts extension.
 * Supports 'light', 'dark', and 'system' modes.
 * Persists selection via chrome.storage.sync.
 */
(function () {
    const STORAGE_KEY = 'theme';
    const THEMES = ['light', 'dark', 'system'];

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(mode) {
        const resolved = mode === 'system' ? getSystemTheme() : mode;
        document.documentElement.setAttribute('data-theme', resolved);
        // Update toggle buttons if present
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === mode);
        });
    }

    function init() {
        chrome.storage.sync.get({ [STORAGE_KEY]: 'system' }, (data) => {
            const mode = THEMES.includes(data[STORAGE_KEY]) ? data[STORAGE_KEY] : 'system';
            applyTheme(mode);

            // Bind toggle buttons
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const newMode = btn.dataset.theme;
                    chrome.storage.sync.set({ [STORAGE_KEY]: newMode });
                    applyTheme(newMode);
                });
            });
        });

        // React to system theme changes when in 'system' mode
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            chrome.storage.sync.get({ [STORAGE_KEY]: 'system' }, (data) => {
                if (data[STORAGE_KEY] === 'system') applyTheme('system');
            });
        });

        // React to storage changes from other pages
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes[STORAGE_KEY]) {
                applyTheme(changes[STORAGE_KEY].newValue || 'system');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
