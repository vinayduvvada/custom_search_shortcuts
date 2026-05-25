# Custom Search Shortcuts

A Chrome extension that adds customizable search shortcuts to your right-click context menu. Quickly search selected text across multiple search engines and websites with support for environment variables and dynamic URL templates.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### Core
- **Custom Search Engines**: Add unlimited custom search URLs to your context menu
- **Environment Variables**: Define variables with different values for dev, test, and prod environments
- **Dynamic URL Templates**: Use `{{variable}}` syntax to create flexible search URLs
- **Right-Click Integration**: Seamlessly integrated into Chrome's context menu
- **Import/Export**: Backup and share your search configurations (includes all data: URLs, variables, environments, categories, trash, favorites, and settings)
- **Manifest V3**: Built with the latest Chrome extension standards

### Organization
- **Search Categories**: Group shortcuts into categories (e.g., "Work", "Dev Tools", "Social") that appear as nested submenus in the context menu
- **Emoji Category Icons**: Assign emoji icons to categories — displayed in the context menu, popup, and options page for visual distinction
- **Drag & Drop Reordering**: Reorder URLs, categories, and environments by dragging
- **Context Menu Separators**: Visual separators between uncategorized URLs, category submenus, and management options

### Favorites
- **Pin Favorites**: Star any shortcut to pin it as a favorite for instant access
- **Popup Favorites Section**: Favorited shortcuts appear at the top of the popup under a dedicated ⭐ Favorites header
- **Context Menu Pinning**: Favorites are pinned to the top of the right-click context menu, separated from the rest
- **Category Preservation**: Favorited URLs still appear inside their category submenus in addition to being pinned at the top
- **Toggle from Options**: Star/unstar shortcuts directly from the options page URL list

### Keyboard Shortcuts
- **Custom Hotkeys**: Assign a keyboard shortcut to any search URL directly from the Search URLs page using the ⌨ keyboard icon
- **Inline Recorder**: Click the keyboard icon on a URL → press your desired key combination (e.g., `Ctrl+Shift+G`) → shortcut is saved instantly
- **Live Key Feedback**: Modifier keys are shown in real-time as you hold them; the full combo is displayed before saving
- **Modifier Required**: Shortcuts must include at least one modifier key (`Ctrl`, `Alt`, or `Shift`)
- **Quick Remove**: Press `Backspace` or `Delete` while recording to remove an existing shortcut
- **Visual Indicator**: A purple dot badge appears on the keyboard icon for URLs that have a shortcut assigned
- **Settings Overview**: View and manage all assigned shortcuts from the Settings tab under "Assigned Keyboard Shortcuts"

### Omnibox Search
- **Address Bar Integration**: Type `cs` in Chrome's address bar, press `Tab`, then type a shortcut name followed by your query
- **Auto-Suggestions**: Matching search URLs appear as suggestions as you type
- **Smart Matching**: Matches shortcut names by exact match, prefix, or contains — in that priority order
- **Fallback Search**: If no shortcut name matches, the entire input is used as a search query with the first available URL
- **Example**: `cs google hello world` → searches Google for "hello world"

### Productivity
- **Duplicate Shortcuts**: Clone an existing shortcut — pre-fills the form with the URL data for review before saving
- **Popup Quick Access**: Search and launch shortcuts directly from the popup with category group headers
- **New Tab Positioning**: Open shortcut links right next to your current tab (configurable)

### Safety
- **Trash / Undo Delete**: Deleted shortcuts are moved to Trash with an "Undo" toast (Gmail-style). Trash retains items for a configurable number of days before permanent removal
- **Restore from Trash**: One-click restore of deleted shortcuts, or permanently delete individual items or empty the entire trash

### Appearance
- **Dark Mode / Theme Toggle**: Light, Dark, and System theme modes. Synced across the options page and popup
- **Settings Page**: Centralized configuration for theme, trash retention period, new tab position, and default category

## 🚀 Installation

### From Chrome Web Store
[Extensions - Chrome Web Store](https://chromewebstore.google.com/detail/custom-search-shortcuts/hfjpbokofaibcjgnkbheeeiogckdockd)

### Manual Installation (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/vinayduvvada/custom_search_shortcuts.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the extension directory

6. The extension icon should appear in your toolbar!

## 📖 Usage Walkthrough (with screenshots)

1. Open the extension popup
---
![Open extension popup – Manage Custom Searches](docs/images/1.%20Plugin%20access.png)

2. Options page (initial view)
![Options page – initial view](docs/images/2.%20Plugin%20page.png)

3. Add a new search URL
![Add a new search URL](docs/images/3.%20Add%20new%20search%20shortcut.png)

4. Use the custom search from the page
![Use custom shortcut](docs/images/4.%20Use%20custom%20shortcut.png)

5. Add a variable (for environment-aware URLs)
![Add a new variable](docs/images/5.%20Add%20a%20new%20variable.png)

6. Create environments
   1. Add a new environment
   ![Add a new environment](docs/images/6.%20Add%20a%20new%20environment%20.png)

   2. Add a environment with default value
   ![New environment with default value](docs/images/7.%20New%20environment%20with%20default%20value.png)

   3. Add multiple environments
   ![Add multiple environments](docs/images/8.%20Add%20multiple%20environments.png)

7. Create a URL that uses a variable
![Add URL with variable](docs/images/9.%20Add%20url%20with%20variable.png)

9. Final configuration
![Final configurations](docs/images/10.%20Final%20configurations.png)

10.  Use environment-specific search
![Use custom shortcut with environments and variables](docs/images/11.%20Custom%20shortcut%20use%20with%20environment%20and%20variables.png)

### Basic Search

1. **Add a Search Engine**:
   - Click the extension icon or right-click and select "Manage Custom Searches"
   - Enter a name (e.g., "Google")
   - Enter a URL with `%s` as the search placeholder:
     ```
     https://www.google.com/search?q=%s
     ```
   - Click "Add URL"

2. **Use Your Search**:
   - Select any text on a webpage
   - Right-click → **Custom Search** → Select your search engine
   - A new tab opens with your search results

### Advanced: Environment Variables

Perfect for developers who need to search across different environments (dev, staging, production).

#### Example Use Case: API Documentation Search

1. **Define a Variable**:
   - Go to Options → Variables section
   - Variable name: `api_host`
   - Default value: `api.example.com`
   - Click "Add Variable"

2. **Create Environments**:
   - Go to Options → Environments section
   - Add environments:
     - **Dev**: `api_host` = `dev-api.example.com`
     - **Test**: `api_host` = `test-api.example.com`
     - **Prod**: `api_host` = `api.example.com`

3. **Create Search URL with Variable**:
   - Name: "API Docs"
   - URL: `https://{{api_host}}/docs/search?q=%s`
   - Click "Add URL"

4. **Use Environment-Specific Search**:
   - Select text on a webpage
   - Right-click → **Custom Search** → **API Docs** → Choose environment (Dev/Test/Prod)
   - Opens the correct environment's documentation

## 🛠️ Development

### Project Structure

```
custom-search-shortcuts/
├── manifest.json          # Extension configuration (permissions, omnibox keyword, content scripts)
├── background.js          # Service worker (context menu, keyboard shortcut handler, omnibox handler)
├── content_script.js      # Content script (listens for keyboard shortcuts on all pages)
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality + theme cycle
├── options.html          # Options page UI (tabs: URLs, Variables, Categories, Environments, Trash, Settings)
├── options.js            # Options page logic (CRUD, drag-reorder, settings, trash, inline shortcut recorder)
├── theme.js              # Shared theme manager (light/dark/system)
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── LICENSE               # MIT License
└── README.md             # This file
```

### Key Files

- **manifest.json**: Extension metadata and permissions
- **background.js**: Handles context menu creation, category submenus, separators, environment submenus, and click events (respects tab position setting)
- **content_script.js**: Injected on all pages — listens for user-defined keyboard shortcuts, captures selected text, and messages the background service worker
- **options.js**: Manages URLs, variables, environments, categories, trash, and settings — includes drag-and-drop reordering, emoji picker, and undo-able delete
- **popup.js**: Popup with category-grouped shortcut list, search filter, theme cycle button
- **theme.js**: Shared theme engine — reads/writes `theme` setting, applies `data-theme` attribute, listens for `prefers-color-scheme` changes and cross-page sync

### Permissions

- `contextMenus`: Create right-click menu items
- `storage`: Save user configurations (synced across devices via `chrome.storage.sync`)
- `activeTab`: Access current tab info for "Add Current Page" and tab positioning
- `tabs`: Query tab index for opening shortcuts next to the current tab
- `scripting`: Required for content script injection (keyboard shortcuts on pages)

### Building & Testing

1. Make your changes to the code

2. Update version in `manifest.json`:
   ```json
   "version": "1.0.1"
   ```

3. Test locally:
   - Go to `chrome://extensions/`
   - Click the refresh icon on your extension
   - Test on various websites

4. Create test URLs using the examples in the [Testing Guide](#testing)

### Testing

Test your extension with various scenarios:

**Basic Text Selection:**
- Simple ASCII text
- Unicode characters (café, 北京, 😀)
- Special characters (&, ?, #, %)

**Different Page Types:**
- Static HTML pages
- Single-page applications (SPAs)
- Content-editable areas

**Environment Variables:**
- URLs with single variable
- URLs with multiple variables
- Missing variable definitions
- Empty environment values

**Test URLs:**
```
Dev:     http://localhost:3000/test.html
Test:    https://staging.yourdomain.com/
Prod:    https://yourdomain.com/
```

## 📦 Export/Import Configuration

### Export
1. Go to Options page
2. Click **Export Configuration**
3. Save the JSON file

### Import
1. Go to Options page
2. Click **Import Configuration**
3. Select your JSON file
4. Your searches, variables, and environments are restored

### Configuration Format

```json
{
  "urls": [
    {
      "id": "custom-search-1234567890",
      "name": "Google",
      "url": "https://www.google.com/search?q=%s",
      "category": "cat-1234567890"
    }
  ],
  "variables": [
    {
      "name": "api_host",
      "defaultValue": "api.example.com"
    }
  ],
  "environments": [
    {
      "id": "env-1234567890",
      "name": "Dev",
      "values": [
        {
          "key": "api_host",
          "value": "dev-api.example.com"
        }
      ]
    }
  ],
  "categories": [
    {
      "id": "cat-1234567890",
      "name": "Dev Tools",
      "icon": "🔧"
    }
  ],
  "trash": [
    {
      "id": "custom-search-9876543210",
      "name": "Old Search",
      "url": "https://example.com/search?q=%s",
      "deletedAt": 1714567890000
    }
  ],
  "favorites": [
    "custom-search-1234567890"
  ],
  "settings": {
    "trashDays": 15,
    "tabPosition": "next",
    "defaultCategory": ""
  },
   "keyboardShortcuts": [
      {
         "urlId": "custom-search-1234567890",
         "shortcut": "Ctrl+Shift+G"
      }
   ]
}
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Test thoroughly before submitting
- Update documentation for new features
- Keep commits focused and descriptive
- Add comments for complex logic

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? Please open an issue on GitHub:

1. Check if the issue already exists
2. Provide detailed description
3. Include steps to reproduce (for bugs)
4. Add screenshots if applicable
5. Specify Chrome version and OS

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Vinay Chowdary Duvvada

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Disclaimer
This extension is provided “as is” without warranty of any kind, express or implied. Use at your own risk. The authors are not responsible for any data loss, security issues, policy violations, or damages arising from the use of this software.

Third‑party websites and services referenced by your custom search URLs are owned and operated by their respective providers. This project is not affiliated with, endorsed by, or sponsored by any third parties (including Google, Amazon, GitHub, etc.).
Always review and comply with the terms of service and robots/usage policies of the websites you query.
Be careful when creating URLs that include sensitive information (such as tokens, secrets, or personal data). Do not store or share sensitive data in plain text.
If you distribute this extension, you are responsible for ensuring compliance with the Chrome Web Store policies and all applicable laws and regulations in your jurisdiction.

## 🙏 Acknowledgments

- Built with Chrome Extension Manifest V3
- Icons designed for clarity and simplicity
- Inspired by the need for quick, customizable web searches

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/vinayduvvada/custom-search-shortcuts/issues)
- **Email**: vinay.chowdary518@gmail.com
- **Documentation**: [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)


## ⚙️ Settings

The Settings tab (gear icon, rightmost tab) provides centralized configuration:

| Setting | Description | Default |
|---|---|---|
| **Theme** | Light / System / Dark | System |
| **Trash Retention** | Days to keep deleted items (1–90) | 15 days |
| **New Tab Position** | Next to current tab / End of tab bar | Next to current |
| **Default Category** | Auto-select category when adding new URLs | None |

## 📊 Version History


### v5.0.0
- **Keyboard Shortcuts**: Assign custom hotkeys to any search URL — select text on any page and press the shortcut to instantly search
- Inline shortcut recorder on each URL list item with live modifier key feedback
- Purple dot badge indicator for URLs with assigned shortcuts
- Assigned Shortcuts overview in the Settings tab
- **Omnibox Search**: Type `cs` + `Tab` in the address bar to search using any shortcut (e.g., `cs google hello world`)
- Auto-suggestions as you type in the omnibox
- Smart name matching (exact → prefix → contains)
- New content script (`content_script.js`) for capturing keyboard shortcuts on all pages
- Export/Import now includes keyboard shortcuts

### v4.0.0
- **Favorites**: Pin shortcuts to the top of the context menu and popup for quick access
- Favorite star toggle in both popup and options page
- Favorited URLs appear at the top of the context menu with a separator
- Favorited URLs with categories still appear inside their category submenus
- Export/Import now includes favorites and settings

### v3.0.0
- Search Categories with emoji icon picker
- Nested category submenus in context menu with separators
- Duplicate shortcut (pre-fills form for review)
- Trash system with configurable retention and undo-able delete
- Dark mode / Light mode / System theme toggle

### v2.0.0
- Settings page (theme, tab position, default category)
- New tabs open next to current tab (configurable)
- Popup grouped by category with emoji headers
- Drag-and-drop reordering for URLs, categories, and environments
- Export/Import includes categories, trash, and settings

### v1.0.0
- Initial public release
- Custom search URLs
- Environment variables support
- Import/Export functionality
- Context menu integration

---

**Made with ❤️ by Vinay Duvvada**

⭐ Star this repo if you find it useful!
