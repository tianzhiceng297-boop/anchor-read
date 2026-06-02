# AnchorRead

[中文](README_zh.md) | English

Free & open-source reading accelerator for Chrome. Bold the first part of words to guide your eyes and read faster.

## What is Fixation Reading?

Fixation reading is a technique that highlights the initial portion of each word, creating artificial fixation points that guide the eye through text. This may help improve reading speed and focus. AnchorRead is a free, privacy-friendly implementation of this concept.

## Features

- **One-click toggle** — Enable/disable on any page instantly
- **Adjustable bold ratio** — Slide between subtle (10%) and bold (90%) to find your comfort zone
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

AnchorRead uses the **text-vide** verified algorithm with 5 fixation boundary tables and linear interpolation for smooth ratio control.

**Source:** [Gumball12/text-vide](https://github.com/Gumball12/text-vide) | [HOW.md](https://github.com/Gumball12/text-vide/blob/main/HOW.md)

**The core algorithm (reverse-subtraction):**

1. Measure word length
2. Select the appropriate boundary table based on the Bold Ratio slider
3. Find the first boundary value >= word length; its index = unbolded trailing count
4. Bold length = word length - index (never bolds the entire word)

**The Bold Ratio slider maps to text-vide's 5 fixation points:**

| Slider | fixationPoint | Behavior |
|--------|-------------|----------|
| 10% | 5 (least bold) | Only first 1-2 chars bolded |
| 30% | 4 | Subtle highlighting |
| 50% | 3 (default) | Balanced, matches text-vide default |
| 70% | 2 | Strong highlighting |
| 90% | 1 (most bold) | Nearly entire word bolded |

Between these 5 points, AnchorRead **linearly interpolates** between the two nearest boundary tables for smooth, continuous adjustment.

**Examples at 50% (fixationPoint=3):**

| Word | Length | Bold Length | Result |
|------|--------|-------------|--------|
| cat | 3 | 1 | **c**at |
| hello | 5 | 3 | **hel**lo |
| reading | 7 | 4 | **read**ing |
| comprehensive | 13 | 7 | **compreh**ensive |

**Examples at 90% (fixationPoint=1, most bold):**

| Word | Length | Bold Length | Result |
|------|--------|-------------|--------|
| cat | 3 | 2 | **ca**t |
| hello | 5 | 3 | **hel**lo |
| reading | 7 | 5 | **readi**ng |
| comprehensive | 13 | 10 | **comprehens**ive |

## File Structure

```
anchor-read/
├── manifest.json      # Chrome Extension manifest (Manifest V3)
├── content.js         # Core text conversion engine
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
