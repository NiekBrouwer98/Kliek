import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe, RecipeSource } from '../types/recipe'
import { getRecipe, addRecipe, updateRecipe } from '../lib/storage'
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

  const handleSubmit = (e: React.FormEvent) => {
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
      updateRecipe(existing.id, {
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
      addRecipe(recipe)
      navigate(`/recipe/${recipe.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-recipe text-2xl font-bold text-amber-950 mb-6">
        {existing ? 'Edit recipe' : 'Add recipe'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="e.g. Pasta carbonara"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => update('source', e.target.value as RecipeSource)}
                className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Source URL (optional)</label>
              <input
                type="url"
                value={form.sourceUrl ?? ''}
                onChange={(e) => update('sourceUrl', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Image URL (optional)</label>
            <input
              type="url"
              value={form.imageUrl ?? ''}
              onChange={(e) => update('imageUrl', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Servings</label>
              <input
                type="number"
                min={1}
                value={form.servings ?? ''}
                onChange={(e) => update('servings', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Prep (min)</label>
              <input
                type="number"
                min={0}
                value={form.prepTimeMinutes ?? ''}
                onChange={(e) => update('prepTimeMinutes', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Cook (min)</label>
              <input
                type="number"
                min={0}
                value={form.cookTimeMinutes ?? ''}
                onChange={(e) => update('cookTimeMinutes', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-amber-900">Ingredients *</label>
            <button type="button" onClick={addIngredient} className="text-sm text-amber-700 hover:underline">
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
                  className="flex-1 px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. 200 g spaghetti"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="px-3 py-2 rounded-xl text-amber-700 hover:bg-amber-100"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-amber-900">Instructions *</label>
            <button type="button" onClick={addInstruction} className="text-sm text-amber-700 hover:underline">
              + Add step
            </button>
          </div>
          <div className="space-y-2">
            {form.instructions.map((inst, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex-shrink-0 w-6 text-amber-700 font-medium">{i + 1}.</span>
                <input
                  type="text"
                  value={inst}
                  onChange={(e) => setInstruction(i, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Boil the pasta until al dente."
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(i)}
                  className="px-3 py-2 rounded-xl text-amber-700 hover:bg-amber-100"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-amber-900">Categories</label>
            <button type="button" onClick={runAutoCategories} className="text-sm text-amber-700 hover:underline">
              Auto-categorize
            </button>
          </div>
          <p className="text-sm text-amber-800/80 mb-2">Comma-separated or use Auto-categorize.</p>
          <input
            type="text"
            value={form.categories.join(', ')}
            onChange={(e) => update('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
            placeholder="e.g. Pasta, Quick & Easy"
          />
        </div>

        <div className="bg-white/95 rounded-2xl border border-amber-200/60 p-6 shadow-md">
          <label className="block text-sm font-medium text-amber-900 mb-2">Notes (optional)</label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
            placeholder="Extra tips, substitutions..."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors"
          >
            {existing ? 'Save changes' : 'Save recipe'}
          </button>
          <Link to={existing ? `/recipe/${existing.id}` : '/'} className="px-6 py-2.5 rounded-xl text-amber-800 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
