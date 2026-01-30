# Kliek browser extension

This extension lets you import recipes **directly from a URL**. When you're on a recipe page, click the extension icon and choose **Send recipe to Kliek**. The extension extracts the recipe (from Schema.org JSON-LD or common HTML patterns) and sends it to your Kliek app.

## Setup

1. **Run the Kliek app** at [https://kliek-deployed.vercel.app](https://kliek-deployed.vercel.app) (or `http://localhost:5173` for local dev).
2. **Load the extension** in Chrome:
   - Open `chrome://extensions`
   - Turn on **Developer mode**
   - Click **Load unpacked**
   - Select the `extension` folder in this project
3. **Use it**: Open any recipe website, click the Kliek extension icon, then **Send recipe to Kliek**. The app tab will open (or focus) and the recipe will be added.

## How it works

- The extension runs only when you click it (no background scripts).
- It injects a script into the **current tab** (the recipe page) to read the DOM and/or JSON-LD.
- It then opens or focuses a tab with your Kliek app and injects the recipe data into that tab via `localStorage`. The app reads `kliek-pending-import`, saves the recipe, and redirects you to the new recipe.

## Production / other origins

The extension sends recipes to **https://kliek-deployed.vercel.app** by default (see `KLIEK_APP_ORIGINS` in `popup.js`). The manifest allows that origin and localhost. To use a different URL, add it to `host_permissions` in `manifest.json` and put it first in `KLIEK_APP_ORIGINS` in `popup.js` (or change `getAppUrl()` to return it).

## Optional: custom icons

To add icons, create `extension/icons/` and add:

- `icon16.png` (16×16)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

Then add to `manifest.json`:

```json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
},
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```
