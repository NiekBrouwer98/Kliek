# Kliek – Personal Recipe Book

A personal recipe app where you can save recipes from different sources, add your own, and plan your week menu with drag-and-drop.

## Features

- **Import recipes** from:
  - **Browser extension**: Install the Kliek extension (see below) and use **Send recipe to Kliek** on any recipe page. The extension extracts the recipe (Schema.org JSON-LD or DOM) and sends it straight into the app.
  - **Paste**: Copy recipe text from any website, Instagram, or the Albert Heijn app and paste it. The app parses ingredients and instructions automatically.
  - **PDF**: Upload a PDF; text is extracted and parsed into a recipe.
  - **Website URL**: Without the extension, browsers block reading other sites from the app, so you’re guided to copy the recipe and use the Paste tab.
- **Add your own recipes** via a form with fixed fields: title, source, image URL, servings, prep/cook time, ingredients, instructions, categories, notes.
- **Unified format**: All recipes are stored and shown in the same layout (ingredients list, numbered instructions, categories).
- **Auto-categorization**: Recipes are tagged automatically (e.g. Pasta, Salad, Vegetarian, Quick & Easy) from title and text.
- **Search**: Search by recipe name, ingredients, or categories; filter by category.
- **Week menu**: Drag recipes from your list into lunch/dinner slots for each day. Data is stored in your browser.

## Tech stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- @dnd-kit for drag-and-drop
- pdfjs-dist for PDF text extraction
- Data in `localStorage` (no backend)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Build for production:

```bash
npm run build
npm run preview
```

## Browser extension (import from URL)

A Chrome extension in the `extension/` folder lets you import recipes **directly from a URL**. On any recipe page, click the extension icon and choose **Send recipe to Kliek**; the recipe is extracted and added to your app.

1. Run the Kliek app at `http://localhost:5173`.
2. In Chrome, go to `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select the project’s `extension` folder.
3. Open a recipe website, click the Kliek extension, then **Send recipe to Kliek**.

See `extension/README.md` for details and how to use a production app URL.

## Data

Recipes and week menus are saved in the browser’s `localStorage` under the keys `kliek-recipes` and `kliek-week-menus`. Clearing site data will remove them.
