# AnchorRead

[中文](README_zh.md) | English

Free & open-source reading accelerator for Chrome. Bold the first part of words to guide your eyes and read faster.

## What is Fixation Reading?

Fixation reading is a technique that highlights the initial portion of each word, creating artificial fixation points that guide the eye through text. This may help improve reading speed and focus. AnchorRead is a free, privacy-friendly implementation of this concept.

## Features

- **One-click toggle** — Enable/disable on any page instantly
- **Fixation Boundary Table** — Math-based algorithm, no language dependency, fast and stable
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
2. Toggle the switch to enable on the current page
3. **First time on a page?** Refresh the page after enabling to activate (you'll see a reminder in the popup)
4. The page text is instantly converted — no further refresh needed
5. Settings are saved automatically across pages

### First-Time Reminder

> ⚠️ **After installing the extension or opening a new tab, you must refresh the page once** for AnchorRead to take effect. The popup will show a reminder if the page hasn't been refreshed yet.

### Tips

- **Not working on a page?** Some pages (like the Chrome Web Store itself) restrict extension content scripts for security reasons
- **Dynamic pages**: AnchorRead automatically handles pages that load content as you scroll (Twitter, Reddit, etc.)
- **Turn off temporarily**: Just toggle the switch off — the page text returns to normal instantly

## How It Works

AnchorRead creates **fixation anchors** by visually "breaking" each word at a letter boundary, giving your eyes a clear landing point during saccades.

### Stage 1: text-vide Boundary Table (Baseline)

Uses the **Fixation Boundary Table** verified by the text-vide project (fixationPoint=3, the text-vide default).

**Core logic (reverse-subtraction):**

1. Measure word length `len`
2. Look up boundary table `[0, 1, 2, 5, 7, 9, 11, 13, 15, 17, ...]`
3. Find first boundary value `>= len`; its **index** = count of unbolded trailing characters
4. Bold length = `len - index` (never bolds the entire word)

**Examples:**

| Word | Length | Bold Length | Result |
|------|--------|-------------|--------|
| cat | 3 | 1 | **c**at |
| hello | 5 | 3 | **hel**lo |
| reading | 7 | 4 | **read**ing |
| comprehensive | 13 | 7 | **compreh**ensive |

### Stage 2: Optical Balance Adjustment

The boundary table gives a "math midpoint", but the human eye's **visual center of gravity** is not the geometric midpoint. v1.2.6 introduces an optical balance rule engine that adjusts the break point after the table lookup.

**Why optical balance?**

| Problem | Math Break | Visual Feel |
|---------|-------------|--------------|
| `water` | `wat\|er` | `t` is a light letter — the break "doesn't hold" |
| `develop` | `devel\|op` | `p` is a descender — naturally anchors; should use it |
| `icon` | `ic\|on` | `c` opens right and blends into `o`; break earlier |

**5 priority levels of optical rules:**

| Priority | Rule | Example |
|----------|------|---------|
| 1 | **Hand-crafted word table** (optimal break points calibrated manually) | `water` → `wate\|r`, `develop` → `devel\|op` |
| 2 | **Syllable/morpheme boundaries** | `action` → `ac\|tion`, `running` → `runn\|ing` |
| 3 | **Visual center biased LEFT** (~1/6 word length left of geometric midpoint) | 7-letter word: midpoint=4, optical break=3 |
| 4 | **Avoid heavy–light–heavy jumps** | Don't end on visually light letters like `i`/`l`/`t` |
| 5 | **Prefer ending on descenders/ascenders** | Descenders (`g`/`j`/`p`/`q`/`y`) have "hooks" that visually anchor the weight |

**Fusion strategy:** Boundary table gives baseline, optical rules give suggested value. If the difference `<= 2`, adopt the optical value; otherwise keep baseline (prevents over-correction).

### Content Word Filter (Optional)

Added in v1.2.5: function words (the/to/of/and/be/have/do etc., ~150 words) are skipped from bolding. Only content words (nouns/verbs/adjectives/adverbs) get bolded, reducing visual noise.

## File Structure

```
anchor-read/
├── manifest.json      # Chrome Extension manifest (Manifest V3)
├── content.js         # Core text conversion engine
├── background.js      # Service worker for state management
├── popup.html         # Extension popup UI with toggle
├── popup.js           # Popup logic
└── icons/             # Extension icons (16/48/128px)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT License — free to use, modify, and distribute.
