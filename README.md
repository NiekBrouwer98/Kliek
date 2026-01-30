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
- **Week menu**: Drag recipes from your list into lunch/dinner slots for each day.
- **Sync across devices**: Sign in with email/password (Supabase). Recipes and week menus sync to the cloud so you see the same data on your phone and computer.

## Tech stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- @dnd-kit for drag-and-drop
- pdfjs-dist for PDF text extraction
- **Supabase** for auth and database (sync); falls back to `localStorage` when not configured

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

## Sync (Supabase)

To enable **sign-in and sync across devices** (e.g. iPhone and computer):

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. In the Supabase dashboard: **SQL Editor** → New query → paste the contents of `supabase/migrations/001_initial.sql` → Run.
3. In **Settings → API**: copy the **Project URL** and **anon public** key.
4. In the app root, create a `.env` file (see `.env.example`):
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart the dev server. You’ll see **Sign in** in the header; sign up with email/password. Recipes and week menus are then stored in Supabase and sync to all devices where you’re signed in.

Without Supabase (no `.env`), the app still works: recipes and week menus are stored only in the browser’s `localStorage` on that device.

## Data

- **With Supabase**: Recipes and week menus are stored in your Supabase project (per user). Same data on every device when signed in.
- **Without Supabase**: Recipes and week menus are in the browser’s `localStorage` under `kliek-recipes` and `kliek-week-menus`. Clearing site data removes them.
