import { useState, useMemo, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import type { Recipe, WeekMenuSlot } from '../types/recipe'
import { GROCERY_CATEGORY_ORDER, sortIngredientsByCategory } from '../lib/groceryCategories'
import { getRemovedGroceryItems, setRemovedGroceryItems } from '../lib/storage'

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getYear(date: Date): number {
  return date.getFullYear()
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export default function GroceryList() {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(() => getYear(today))
  const [week, setWeek] = useState(() => getWeekNumber(today))
  const { recipes, getWeekMenu } = useData()
  const [slots, setSlots] = useState<WeekMenuSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [removedGroceries, setRemovedGroceries] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getWeekMenu(year, week).then((menu) => {
      if (!cancelled) {
        setSlots(menu.slots)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [year, week, getWeekMenu])

  useEffect(() => {
    setRemovedGroceries(getRemovedGroceryItems(year, week))
  }, [year, week])

  const getRecipe = (id: string): Recipe | undefined => recipes.find((r) => r.id === id)

  const groceryListByCategory = useMemo(() => {
    const recipeIds = new Set(slots.map((s) => s.recipeId).filter(Boolean) as string[])
    const allIngredients: string[] = []
    recipeIds.forEach((id) => {
      const recipe = getRecipe(id)
      if (recipe?.ingredients?.length) allIngredients.push(...recipe.ingredients)
    })
    const unique = Array.from(new Set(allIngredients))
    const visible = unique.filter((ing) => !removedGroceries.includes(ing))
    return sortIngredientsByCategory(visible)
  }, [slots, getRecipe, removedGroceries])

  const removeFromGroceryList = (ingredient: string) => {
    const next = [...removedGroceries, ingredient]
    setRemovedGroceries(next)
    setRemovedGroceryItems(year, week, next)
  }

  const restoreGroceryItem = (ingredient: string) => {
    const next = removedGroceries.filter((i) => i !== ingredient)
    setRemovedGroceries(next)
    setRemovedGroceryItems(year, week, next)
  }

  const hasAnyGroceries = useMemo(() => {
    for (const list of groceryListByCategory.values()) {
      if (list.length > 0) return true
    }
    return false
  }, [groceryListByCategory])

  const exportCsv = () => {
    const rows: string[] = [escapeCsvCell('Category') + ',' + escapeCsvCell('Ingredient')]
    for (const category of GROCERY_CATEGORY_ORDER) {
      const items = groceryListByCategory.get(category) ?? []
      for (const ing of items) {
        rows.push(escapeCsvCell(category) + ',' + escapeCsvCell(ing))
      }
    }
    const csv = rows.join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grocery-list-${year}-w${week}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const title = `Grocery list – ${year} Week ${week}`
    const parts: string[] = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>',
      '<style>body{font-family:sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem;}',
      'h1{font-size:1.25rem;color:#333;}',
      'h2{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#5a6d5a;margin:1.5rem 0 0.5rem;}',
      'ul{margin:0;padding:0;list-style:none;}',
      'li{padding:0.35rem 0;border-bottom:1px solid #eee;}',
      '</style></head><body>',
      '<h1>' + title + '</h1>',
    ]
    for (const category of GROCERY_CATEGORY_ORDER) {
      const items = groceryListByCategory.get(category) ?? []
      if (items.length === 0) continue
      parts.push('<h2>' + category + '</h2><ul>')
      for (const ing of items) {
        parts.push('<li>' + ing.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</li>')
      }
      parts.push('</ul>')
    }
    parts.push('</body></html>')
    const html = parts.join('')
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.addEventListener('afterprint', () => win.close(), { once: true })
    }, 300)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-recipe text-2xl font-semibold text-ink">Grocery list</h1>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-20 px-3 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
            <span className="text-ink-muted">Week</span>
            <input
              type="number"
              min={1}
              max={53}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="w-14 px-3 py-2.5 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
            />
          </div>
        </div>
        {hasAnyGroceries && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="px-4 py-2.5 rounded-xl border border-border bg-white text-ink font-medium hover:bg-cream-2 focus:border-sage focus:ring-2 focus:ring-sage/20 transition-colors"
            >
              Export Excel (CSV)
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="px-4 py-2.5 rounded-xl bg-sage text-white font-medium hover:bg-sage/90 focus:ring-2 focus:ring-sage/20 transition-colors"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>

      <p className="text-ink-muted">
        Ingredients from your week menu, grouped by category. Remove items you already have. Export to CSV (Excel) or print to PDF.
      </p>

      {loading && <p className="text-ink-muted">Loading…</p>}

      {!loading && hasAnyGroceries && (
        <div className="space-y-6">
          {GROCERY_CATEGORY_ORDER.map((category) => {
            const items = groceryListByCategory.get(category) ?? []
            if (items.length === 0) return null
            return (
              <div key={category}>
                <h2 className="font-medium text-ink mb-2 text-sm uppercase tracking-wide text-olive">
                  {category}
                </h2>
                <ul className="bg-white/80 rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {items.map((ingredient) => (
                    <li
                      key={ingredient}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 group"
                    >
                      <span className="text-ink">{ingredient}</span>
                      <button
                        type="button"
                        onClick={() => removeFromGroceryList(ingredient)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-ink-muted hover:bg-cream-2 hover:text-terracotta transition-colors"
                        aria-label={`Remove ${ingredient} from list`}
                        title="Remove from list"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !hasAnyGroceries && (
        <p className="text-ink-muted py-4">
          Add recipes to the week menu first, then your grocery list will appear here.
        </p>
      )}

      {removedGroceries.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-olive hover:text-sage font-medium">
            Show removed items ({removedGroceries.length})
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            {removedGroceries.map((ingredient) => (
              <li key={ingredient} className="flex items-center justify-between gap-2">
                <span className="line-through">{ingredient}</span>
                <button
                  type="button"
                  onClick={() => restoreGroceryItem(ingredient)}
                  className="text-olive hover:text-sage font-medium"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
