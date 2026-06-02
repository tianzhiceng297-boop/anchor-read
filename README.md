# BionicRead

Free & open-source Bionic Reading converter for Chrome. Bold the first letters of words to read faster.

## What is Bionic Reading?

Bionic Reading is a reading technique that bolds the first portion of each word, guiding the eye through text and potentially improving reading speed and comprehension. This plugin is a free, privacy-friendly alternative to the official Bionic Reading tools.

## Features

- **One-click toggle** — Enable/disable Bionic Reading on any page instantly
- **Dynamic content support** — Automatically converts text loaded after page load (SPAs, infinite scroll)
- **Lightweight** — Zero dependencies, ~5KB total
- **Privacy-first** — No data collection, no network requests, no account required
- **Free forever** — Open source under MIT license

## Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the `bionic-read` folder
5. The extension icon will appear in your toolbar

### From Chrome Web Store

_Coming soon..._

## Usage

1. Click the **BionicRead** icon in your Chrome toolbar
2. Toggle the switch to enable/disable Bionic Reading on the current page
3. The page text is instantly converted — no refresh needed

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
├── popup.css          # Popup styles (embedded in popup.html)
└── icons/             # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT License — free to use, modify, and distribute.
