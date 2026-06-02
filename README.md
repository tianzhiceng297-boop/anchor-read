# AnchorRead

[中文](README_zh.md) | English

Free & open-source reading accelerator for Chrome. Bold the first part of words to guide your eyes and read faster.

## What is Fixation Reading?

Fixation reading is a technique that highlights the initial portion of each word, creating artificial fixation points that guide the eye through text. This may help improve reading speed and focus. AnchorRead is a free, privacy-friendly implementation of this concept.

## Features

- **One-click toggle** — Enable/disable on any page instantly
- **Adjustable bold ratio** — Slide between subtle (10%) and bold (90%) to find your comfort zone
- **Syllable-aware splitting** — Intelligently splits words at syllable boundaries for natural reading
- **Dynamic content support** — Automatically converts text loaded after page load (SPAs, infinite scroll)
- **Lightweight** — Zero dependencies, ~8KB total
- **Privacy-first** — No data collection, no network requests, no account required
- **Free forever** — Open source under MIT license

## Installation

### Method 1: From Chrome Web Store (Easiest)

_Coming soon..._

### Method 2: Load from Source (Recommended for Advanced Users)

If you're comfortable with git, clone the repo and load it directly:

```bash
git clone https://github.com/tianzhiceng297-boop/anchor-read.git
```

Then follow the steps in **Method 3** below to load the cloned folder.

### Method 3: Load from Source (Step-by-Step Beginner Guide)

Never installed a browser extension before? No worries — follow these steps:

#### Step 1 — Download the extension files

Download the source code as a ZIP file:

1. Go to [https://github.com/tianzhiceng297-boop/anchor-read](https://github.com/tianzhiceng297-boop/anchor-read)
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
2. A file picker window will open — navigate to the `anchor-read` folder you extracted in Step 1
3. Select the folder and click **"Select Folder"**

> **Important**: Select the folder that contains `manifest.json`, NOT its parent folder.

#### Step 5 — Verify installation

- The extension should now appear in your extensions list with the name **"AnchorRead"**
- A puzzle piece 🧩 icon appears in your Chrome toolbar — click it, then pin AnchorRead for easy access
- You should see the AnchorRead icon (blue rounded square with an "A") in your toolbar

#### For Microsoft Edge Users

Edge uses the same Chromium engine, so you can install Chrome extensions too:

1. Go to `edge://extensions/`
2. Enable **Developer mode** (left sidebar)
3. Click **"Load unpacked"** and select the `anchor-read` folder

## Usage

1. Click the **AnchorRead** icon in your browser toolbar (if you don't see it, click the 🧩 puzzle icon first to find it)
2. Toggle the switch to enable/disable on the current page
3. Adjust the **Bold Ratio** slider to control how much of each word is highlighted
4. The page text is instantly converted — no refresh needed
5. Settings are saved automatically across pages

### Tips

- **Not working on a page?** Some pages (like the Chrome Web Store itself) restrict extension content scripts for security reasons
- **Dynamic pages**: AnchorRead automatically handles pages that load content as you scroll (Twitter, Reddit, etc.)
- **Adjust the ratio**: Start at 50% and slide left/right until text feels comfortable
- **Turn off temporarily**: Just toggle the switch off — the page text returns to normal instantly

## How It Works

AnchorRead analyzes each word and bolds its initial portion to create "anchors" — visual fixation points that guide the eye forward:

| Word | Syllables | 50% Bold | Result |
|------|-----------|-----------|--------|
| cat | 1 | ca | **ca**t |
| hello | 2 | hel | **hel**lo |
| reading | 2 | read | **read**ing |
| program | 2 | prog | **prog**ram |
| comprehensive | 4 | comprehe | **comprehe**nsive |
| beautiful | 3 | beau | **beau**tiful |

The bold ratio slider lets you control how aggressively words are highlighted. At higher ratios, more of each word is bolded; at lower ratios, only the first syllable is emphasized.

## File Structure

```
anchor-read/
├── manifest.json      # Chrome Extension manifest (Manifest V3)
├── content.js         # Core text conversion + syllable splitting
├── background.js      # Service worker for state management
├── popup.html         # Extension popup UI with toggle + slider
├── popup.js           # Popup logic
└── icons/             # Extension icons (16/48/128px)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT License — free to use, modify, and distribute.
