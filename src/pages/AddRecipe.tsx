import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe, RecipeSource } from '../types/recipe'
import { useData } from '../contexts/DataContext'
import { autoCategorize } from '../lib/categories'

const SOURCES: { value: RecipeSource; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'website', label: 'Website' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'albert-heijn', label: 'Albert Heijn' },
  { value: 'pdf', label: 'PDF' },
]

const emptyRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  source: 'manual',
  sourceUrl: '',
  imageUrl: '',
  servings: undefined,
  prepTimeMinutes: undefined,
  cookTimeMinutes: undefined,
  ingredients: [''],
  instructions: [''],
  categories: [],
  notes: '',
}

export default function AddRecipe() {
  const [params] = useSearchParams()
  const editId = params.get('edit')
  const { getRecipe, addRecipe, updateRecipe } = useData()
  const existing = editId ? getRecipe(editId) : undefined

  const [form, setForm] = useState(() => {
    if (existing) {
      return {
        ...existing,
        ingredients: existing.ingredients.length ? existing.ingredients : [''],
        instructions: existing.instructions.length ? existing.instructions : [''],
      }
    }
    return {
      ...emptyRecipe,
      ingredients: [''] as string[],
      instructions: [''] as string[],
    }
  })

  useEffect(() => {
    if (existing) {
      setForm({
        ...existing,
        ingredients: existing.ingredients.length ? existing.ingredients : [''],
        instructions: existing.instructions.length ? existing.instructions : [''],
      })
    }
  }, [editId, existing?.updatedAt])

  const navigate = useNavigate()

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addIngredient = () => update('ingredients', [...form.ingredients, ''])
  const removeIngredient = (i: number) => {
    const next = form.ingredients.filter((_, idx) => idx !== i)
    update('ingredients', next.length ? next : [''])
  }
  const setIngredient = (i: number, v: string) => {
    const next = [...form.ingredients]
    next[i] = v
    update('ingredients', next)
  }

  const addInstruction = () => update('instructions', [...form.instructions, ''])
  const removeInstruction = (i: number) => {
    const next = form.instructions.filter((_, idx) => idx !== i)
    update('instructions', next.length ? next : [''])
  }
  const setInstruction = (i: number, v: string) => {
    const next = [...form.instructions]
    next[i] = v
    update('instructions', next)
  }

  const runAutoCategories = () => {
    const cats = autoCategorize({
      title: form.title,
      ingredients: form.ingredients.filter(Boolean),
      instructions: form.instructions.filter(Boolean),
    })
    update('categories', cats)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ingredients = form.ingredients.map((s) => s.trim()).filter(Boolean)
    const instructions = form.instructions.map((s) => s.trim()).filter(Boolean)
    if (!form.title.trim() || ingredients.length === 0 || instructions.length === 0) {
      alert('Please fill in title, at least one ingredient, and at least one instruction.')
      return
    }
    const categories = form.categories.length > 0 ? form.categories : autoCategorize({ title: form.title, ingredients, instructions })
    const now = new Date().toISOString()
    if (existing) {
      await updateRecipe(existing.id, {
        title: form.title.trim(),
        source: form.source,
        sourceUrl: form.sourceUrl?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        servings: form.servings ? Number(form.servings) : undefined,
        prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : undefined,
        cookTimeMinutes: form.cookTimeMinutes ? Number(form.cookTimeMinutes) : undefined,
        ingredients,
        instructions,
        categories,
        notes: form.notes?.trim() || undefined,
      })
      navigate(`/recipe/${existing.id}`)
    } else {
      const recipe: Recipe = {
        id: uuidv4(),
        ...form,
        ingredients,
        instructions,
        categories,
        sourceUrl: form.sourceUrl?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        servings: form.servings ? Number(form.servings) : undefined,
        prepTimeMinutes: form.prepTimeMinutes ? Number(form.prepTimeMinutes) : undefined,
        cookTimeMinutes: form.cookTimeMinutes ? Number(form.cookTimeMinutes) : undefined,
        notes: form.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }
      await addRecipe(recipe)
      navigate(`/recipe/${recipe.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-recipe text-2xl font-semibold text-ink mb-8">
        {existing ? 'Edit recipe' : 'Add recipe'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
              placeholder="e.g. Pasta carbonara"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Source</label>
              <select
                value={form.source}
                onChange={(e) => update('source', e.target.value as RecipeSource)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Source URL (optional)</label>
              <input
                type="url"
                value={form.sourceUrl ?? ''}
                onChange={(e) => update('sourceUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Image URL (optional)</label>
            <input
              type="url"
              value={form.imageUrl ?? ''}
              onChange={(e) => update('imageUrl', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Servings</label>
              <input
                type="number"
                min={1}
                value={form.servings ?? ''}
                onChange={(e) => update('servings', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Prep (min)</label>
              <input
                type="number"
                min={0}
                value={form.prepTimeMinutes ?? ''}
                onChange={(e) => update('prepTimeMinutes', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Cook (min)</label>
              <input
                type="number"
                min={0}
                value={form.cookTimeMinutes ?? ''}
                onChange={(e) => update('cookTimeMinutes', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-ink">Ingredients *</label>
            <button type="button" onClick={addIngredient} className="text-sm font-medium text-terracotta hover:text-terracotta-dark transition-colors">
              + Add line
            </button>
          </div>
          <div className="space-y-2">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={ing}
                  onChange={(e) => setIngredient(i, e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
                  placeholder="e.g. 200 g spaghetti"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="px-3 py-2.5 rounded-xl text-ink-muted hover:bg-cream-2 hover:text-ink transition-colors"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-ink">Instructions *</label>
            <button type="button" onClick={addInstruction} className="text-sm font-medium text-terracotta hover:text-terracotta-dark transition-colors">
              + Add step
            </button>
          </div>
          <div className="space-y-2">
            {form.instructions.map((inst, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-6 text-olive font-semibold text-sm">{i + 1}.</span>
                <input
                  type="text"
                  value={inst}
                  onChange={(e) => setInstruction(i, e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
                  placeholder="e.g. Boil the pasta until al dente."
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(i)}
                  className="px-3 py-2.5 rounded-xl text-ink-muted hover:bg-cream-2 hover:text-ink transition-colors"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-ink">Categories</label>
            <button type="button" onClick={runAutoCategories} className="text-sm font-medium text-terracotta hover:text-terracotta-dark transition-colors">
              Auto-categorize
            </button>
          </div>
          <p className="text-sm text-ink-muted mb-2">Comma-separated or use Auto-categorize.</p>
          <input
            type="text"
            value={form.categories.join(', ')}
            onChange={(e) => update('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
            placeholder="e.g. Pasta, Quick & Easy"
          />
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
          <label className="block text-sm font-medium text-ink mb-2">Notes (optional)</label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
            placeholder="Extra tips, substitutions..."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark transition-colors shadow-sm"
          >
            {existing ? 'Save changes' : 'Save recipe'}
          </button>
          <Link to={existing ? `/recipe/${existing.id}` : '/'} className="px-6 py-2.5 rounded-xl text-ink-muted hover:text-olive font-medium transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
