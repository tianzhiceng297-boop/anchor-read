# BionicRead

[中文](README_zh.md) | English

Free & open-source Bionic Reading converter for Chrome. Bold the first letters of words to read faster.

> **Disclaimer**: BionicRead is an independent open-source project and is not affiliated with, endorsed by, or connected to Bionic Reading AG or BRCG Casutt GmbH. "Bionic Reading" is a registered trademark of BRCG Casutt GmbH.

## What is Bionic Reading?

Bionic Reading is a reading technique that bolds the first portion of each word, guiding the eye through text and potentially improving reading speed and comprehension. This plugin is a free, privacy-friendly implementation of this text formatting approach.

## Features

- **One-click toggle** — Enable/disable Bionic Reading on any page instantly
- **Dynamic content support** — Automatically converts text loaded after page load (SPAs, infinite scroll)
- **Lightweight** — Zero dependencies, ~5KB total
- **Privacy-first** — No data collection, no network requests, no account required
- **Free forever** — Open source under MIT license

## Installation

### Method 1: From Chrome Web Store (Easiest)

_Coming soon..._

### Method 2: Load from Source (Recommended for Advanced Users)

If you're comfortable with git, clone the repo and load it directly:

```bash
git clone https://github.com/tianzhiceng297-boop/bionic-read.git
```

Then follow the steps in **Method 3** below to load the cloned folder.

### Method 3: Load from Source (Step-by-Step Beginner Guide)

Never installed a browser extension before? No worries — follow these steps:

#### Step 1 — Download the extension files

Download the source code as a ZIP file:

1. Go to [https://github.com/tianzhiceng297-boop/bionic-read](https://github.com/tianzhiceng297-boop/bionic-read)
2. Click the green **"Code"** button near the top
3. Select **"Download ZIP"**
4. Extract the downloaded ZIP file to any folder on your computer

> The extracted folder should contain files like `manifest.json`, `content.js`, `popup.html`, etc.

#### Step 2 — Open the Extensions page in Chrome

1. Open Google Chrome (or Chromium-based browsers like Edge, Brave)
2. In the address bar, type `chrome://extensions/` and press Enter
3. Alternatively: click the **menu icon** (three dots ⋮ in top-right) → **Extensions** → **Manage Extensions**

#### Step 3 — Enable Developer Mode

1. On the Extensions page, look for a toggle labeled **"Developer mode"** in the **top-right corner**
2. Turn it **ON** — this allows you to load extensions from local files
3. Don't worry, this is safe — it just means Chrome will let you add your own extensions

#### Step 4 — Load the extension

1. Click the **"Load unpacked"** button that appears near the top-left
2. A file picker window will open — navigate to the `bionic-read` folder you extracted in Step 1
3. Select the folder and click **"Select Folder"**

> **Important**: Select the folder that contains `manifest.json`, NOT its parent folder.

#### Step 5 — Verify installation

- The extension should now appear in your extensions list with the name **"BionicRead"**
- A puzzle piece 🧩 icon appears in your Chrome toolbar — click it, then pin BionicRead for easy access
- You should see the BionicRead icon (blue rounded square with a "B") in your toolbar

#### For Microsoft Edge Users

Edge uses the same Chromium engine, so you can install Chrome extensions too:

1. Go to `edge://extensions/`
2. Enable **Developer mode** (left sidebar)
3. Click **"Load unpacked"** and select the `bionic-read` folder

## Usage

1. Click the **BionicRead** icon in your browser toolbar (if you don't see it, click the 🧩 puzzle icon first to find it)
2. Toggle the switch to enable/disable Bionic Reading on the current page
3. The page text is instantly converted — no refresh needed
4. The toggle state is saved automatically — it remembers your preference across pages

### Tips

- **Not working on a page?** Some pages (like the Chrome Web Store itself) restrict extension content scripts for security reasons
- **Dynamic pages**: BionicRead automatically handles pages that load content as you scroll (Twitter, Reddit, etc.)
- **Turn off temporarily**: Just toggle the switch off — the page text returns to normal instantly

## Algorithm

BionicRead uses the proven fixation-boundary algorithm:

| Word | Length | Bolded | Result |
|------|--------|--------|--------|
| a | 1 | 0 | a |
| cat | 3 | 2 | **ca**t |
| hello | 5 | 3 | **hel**lo |
| programming | 11 | 9 | **programmi**ng |
| comprehensive | 13 | 10 | **comprehensi**ve |

The algorithm determines how many characters to bold by looking up a word's length against a boundary table — the index of the matching threshold equals the number of characters left unbolded at the end.

## File Structure

```
bionic-read/
├── manifest.json      # Chrome Extension manifest (Manifest V3)
├── content.js         # Core text conversion logic
├── background.js      # Service worker for state management
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
└── icons/             # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT License — free to use, modify, and distribute.
