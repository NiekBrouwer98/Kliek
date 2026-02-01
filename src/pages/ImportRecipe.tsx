import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe, RecipeSource } from '../types/recipe'
import { useData } from '../contexts/DataContext'
import { autoCategorize } from '../lib/categories'
import { parsePastedText, extractTextFromPdf } from '../lib/importParser'

type ImportTab = 'paste' | 'pdf' | 'url'

interface FetchedRecipe {
  title: string
  ingredients: string[]
  instructions: string[]
  sourceUrl: string
  imageUrl?: string
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
}

const SOURCE_OPTIONS: { value: RecipeSource; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'albert-heijn', label: 'Albert Heijn' },
  { value: 'pdf', label: 'PDF' },
]

function inferSource(url: string): RecipeSource {
  const u = url.toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('ah.nl') || u.includes('albert-heijn')) return 'albert-heijn'
  return 'website'
}

export default function ImportRecipe() {
  const [searchParams, setSearchParams] = useSearchParams()
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

  const createRecipeFromFetched = useCallback(
    async (payload: FetchedRecipe) => {
      const ingredients = payload.ingredients.filter((s) => typeof s === 'string' && s.trim().length > 0)
      const instructions = payload.instructions.filter((s) => typeof s === 'string' && s.trim().length > 0)
      const categories = autoCategorize({
        title: payload.title,
        ingredients,
        instructions,
      })
      const now = new Date().toISOString()
      const recipe: Recipe = {
        id: uuidv4(),
        title: payload.title?.trim() || 'Imported recipe',
        source: inferSource(payload.sourceUrl),
        sourceUrl: payload.sourceUrl,
        imageUrl: payload.imageUrl,
        servings: payload.servings,
        prepTimeMinutes: payload.prepTimeMinutes,
        cookTimeMinutes: payload.cookTimeMinutes,
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

  const fetchRecipeFromUrl = useCallback(
    async (targetUrl: string) => {
      setError(null)
      setLoading(true)
      try {
        const apiUrl = `${window.location.origin}/api/fetch-recipe?url=${encodeURIComponent(targetUrl)}`
        const res = await fetch(apiUrl)
        const data = await res.json()
        if (!res.ok) {
          setError(data?.error || `Failed to fetch (${res.status})`)
          return
        }
        await createRecipeFromFetched(data as FetchedRecipe)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recipe from URL.')
      } finally {
        setLoading(false)
      }
    },
    [createRecipeFromFetched]
  )

  useEffect(() => {
    const sharedUrl = searchParams.get('url')
    if (!sharedUrl || !sharedUrl.startsWith('http')) return
    setSearchParams({}, { replace: true })
    setTab('url')
    setUrl(sharedUrl)
    void fetchRecipeFromUrl(sharedUrl)
    // Only run when landing with a shared URL (e.g. from Share sheet on iPhone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const u = url.trim()
    if (!u) {
      setError('Enter a URL first.')
      return
    }
    await fetchRecipeFromUrl(u)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-recipe text-2xl font-semibold text-ink mb-2">Import recipe</h1>
      <p className="text-ink-muted mb-8">
        Paste text from a website, Instagram, or Albert Heijn; or upload a PDF. All recipes are normalized to the same format.
      </p>

      <div className="flex gap-2 border-b border-border mb-8">
        {(['paste', 'pdf', 'url'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-t-xl font-medium capitalize transition-colors ${
              tab === t ? 'bg-sage text-white' : 'bg-cream-2 text-ink-muted hover:bg-sage/10 hover:text-olive'
            }`}
          >
            {t === 'url' ? 'Website URL' : t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-cream-2 border border-border text-ink">
          {error}
        </div>
      )}

      {tab === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <label className="block text-sm font-medium text-ink mb-2">Where did you copy this from?</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as RecipeSource)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20 mb-4"
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <label className="block text-sm font-medium text-ink mb-2">Paste recipe text</label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20 font-mono text-sm"
              placeholder="Paste the full recipe (title, ingredients, instructions). Headings like 'Ingredients' and 'Instructions' help parsing."
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark transition-colors shadow-sm"
          >
            Import recipe
          </button>
        </form>
      )}

      {tab === 'pdf' && (
        <form onSubmit={handlePdfSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <label className="block text-sm font-medium text-ink mb-2">Select PDF file</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cream-2 file:text-ink"
            />
            <p className="mt-2 text-sm text-ink-muted">
              Text will be extracted and parsed into ingredients and instructions. Scanned PDFs (images) are not supported.
            </p>
          </div>
          <button
            type="submit"
            disabled={!pdfFile || loading}
            className="px-6 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Processing…' : 'Import from PDF'}
          </button>
        </form>
      )}

      {tab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
            <label className="block text-sm font-medium text-ink mb-2">Recipe page URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
              placeholder="https://..."
            />
            <p className="mt-2 text-sm text-ink-muted">
              Paste a link to a recipe page (website, Instagram, Albert Heijn, etc.). We’ll fetch and import it.
            </p>
            <p className="mt-2 text-sm text-olive italic">
              On iPhone: Kliek doesn’t appear in the Share menu (iOS doesn’t support it). Copy the recipe link from Instagram or Safari, open Kliek, then paste the link here and tap Fetch and import.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Fetching…' : 'Fetch and import'}
          </button>
        </form>
      )}
    </div>
  )
}
