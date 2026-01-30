import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe, RecipeSource } from '../types/recipe'
import { useData } from '../contexts/DataContext'
import { autoCategorize } from '../lib/categories'
import { parsePastedText, extractTextFromPdf } from '../lib/importParser'

type ImportTab = 'paste' | 'pdf' | 'url'

const SOURCE_OPTIONS: { value: RecipeSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'albert-heijn', label: 'Albert Heijn' },
  { value: 'pdf', label: 'PDF' },
]

export default function ImportRecipe() {
  const [tab, setTab] = useState<ImportTab>('paste')
  const [pasteText, setPasteText] = useState('')
  const [source, setSource] = useState<RecipeSource>('website')
  const [url, setUrl] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { addRecipe } = useData()

  const createRecipeFromParsed = useCallback(
    async (title: string, ingredients: string[], instructions: string[], sourceType: RecipeSource, sourceUrl?: string) => {
      const categories = autoCategorize({ title, ingredients, instructions })
      const now = new Date().toISOString()
      const recipe: Recipe = {
        id: uuidv4(),
        title: title || 'Imported recipe',
        source: sourceType,
        sourceUrl: sourceUrl || undefined,
        ingredients,
        instructions,
        categories,
        createdAt: now,
        updatedAt: now,
      }
      await addRecipe(recipe)
      navigate(`/recipe/${recipe.id}`)
    },
    [navigate, addRecipe]
  )

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!pasteText.trim()) {
      setError('Paste some recipe text first.')
      return
    }
    const parsed = parsePastedText(pasteText)
    if (parsed.ingredients.length === 0 && parsed.instructions.length === 0) {
      setError("Couldn't detect ingredients or instructions. Try adding headings like 'Ingredients' and 'Instructions'.")
      return
    }
    await createRecipeFromParsed(parsed.title, parsed.ingredients, parsed.instructions, source)
  }

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!pdfFile) {
      setError('Select a PDF file first.')
      return
    }
    setLoading(true)
    try {
      const text = await extractTextFromPdf(pdfFile)
      if (!text.trim()) {
        setError('No text could be extracted from this PDF (e.g. scanned image).')
        setLoading(false)
        return
      }
      const parsed = parsePastedText(text, pdfFile.name.replace(/\.pdf$/i, ''))
      await createRecipeFromParsed(parsed.title, parsed.ingredients, parsed.instructions, 'pdf')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read PDF.')
    } finally {
      setLoading(false)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const u = url.trim()
    if (!u) {
      setError('Enter a URL first.')
      return
    }
    setError(
      'Importing directly from a URL is not supported in the browser (due to CORS). ' +
        'Open the recipe page, copy the recipe text (ingredients + instructions), then use the "Paste" tab and paste it here.'
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-recipe text-2xl font-bold text-amber-950 mb-2">Import recipe</h1>
      <p className="text-amber-800/80 mb-6">
        Paste text from a website, Instagram, or Albert Heijn; or upload a PDF. All recipes are normalized to the same format.
      </p>

      <div className="flex gap-2 border-b border-amber-200 mb-6">
        {(['paste', 'pdf', 'url'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t-xl font-medium capitalize transition-colors ${
              tab === t ? 'bg-amber-700 text-white' : 'bg-amber-100/80 text-amber-800 hover:bg-amber-200/80'
            }`}
          >
            {t === 'url' ? 'Website URL' : t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-100 border border-amber-300 text-amber-900">
          {error}
        </div>
      )}

      {tab === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="space-y-4">
          <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md">
            <label className="block text-sm font-medium text-amber-900 mb-2">Where did you copy this from?</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as RecipeSource)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 mb-4"
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <label className="block text-sm font-medium text-amber-900 mb-2">Paste recipe text</label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 font-mono text-sm"
              placeholder="Paste the full recipe (title, ingredients, instructions). Headings like 'Ingredients' and 'Instructions' help parsing."
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors"
          >
            Import recipe
          </button>
        </form>
      )}

      {tab === 'pdf' && (
        <form onSubmit={handlePdfSubmit} className="space-y-4">
          <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md">
            <label className="block text-sm font-medium text-amber-900 mb-2">Select PDF file</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-900"
            />
            <p className="mt-2 text-sm text-amber-800/80">
              Text will be extracted and parsed into ingredients and instructions. Scanned PDFs (images) are not supported.
            </p>
          </div>
          <button
            type="submit"
            disabled={!pdfFile || loading}
            className="px-6 py-2.5 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing…' : 'Import from PDF'}
          </button>
        </form>
      )}

      {tab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md">
            <label className="block text-sm font-medium text-amber-900 mb-2">Recipe page URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
              placeholder="https://..."
            />
            <p className="mt-2 text-sm text-amber-800/80">
              Browsers block reading other websites from this app. Open the link, copy the recipe text, then use the Paste tab.
            </p>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors"
          >
            Open instructions
          </button>
        </form>
      )}
    </div>
  )
}
