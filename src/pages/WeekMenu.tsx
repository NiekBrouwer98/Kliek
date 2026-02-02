import { useState, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useData } from '../contexts/DataContext'
import type { Recipe, WeekMenuSlot } from '../types/recipe'
import RecipeCardDraggable from '../components/RecipeCardDraggable'
import { GROCERY_CATEGORY_ORDER, sortIngredientsByCategory } from '../lib/groceryCategories'
import { getRemovedGroceryItems, setRemovedGroceryItems } from '../lib/storage'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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

function WeekSlot({
  slot,
  recipe,
  onClear,
}: {
  slot: WeekMenuSlot
  recipe: Recipe | undefined
  onClear: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${slot.day}-${slot.meal}`,
    data: { type: 'slot', day: slot.day, meal: slot.meal },
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[80px] rounded-xl border-2 border-dashed p-3 transition-colors
        ${isOver ? 'border-sage bg-sage/10' : 'border-border bg-white/80'}
      `}
    >
      {recipe ? (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-recipe font-medium text-ink truncate">{recipe.title}</p>
            <p className="text-xs text-ink-muted">Lunch / Dinner</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex-shrink-0 p-1.5 rounded-lg text-ink-muted hover:bg-cream-2 hover:text-ink transition-colors"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ) : (
        <p className="text-sm text-ink-muted py-2">Drop recipe here</p>
      )}
    </div>
  )
}

function DraggableRecipeItem({ recipe }: { recipe: Recipe }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: recipe.id,
    data: { type: 'recipe', recipe },
  })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-50' : ''}>
      <RecipeCardDraggable recipe={recipe} compact={true} />
    </div>
  )
}

export default function WeekMenu() {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(() => getYear(today))
  const [week, setWeek] = useState(() => getWeekNumber(today))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { recipes, getWeekMenu, saveWeekMenu } = useData()
  const [slots, setSlots] = useState<WeekMenuSlot[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [removedGroceries, setRemovedGroceries] = useState<string[]>([])

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return recipes
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.categories && r.categories.some((c) => c.toLowerCase().includes(q)))
    )
  }, [recipes, searchQuery])

  useEffect(() => {
    let cancelled = false
    setMenuLoading(true)
    getWeekMenu(year, week).then((menu) => {
      if (!cancelled) {
        setSlots(menu.slots)
        setMenuLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setMenuLoading(false)
    })
    return () => { cancelled = true }
  }, [year, week, getWeekMenu])

  useEffect(() => {
    setRemovedGroceries(getRemovedGroceryItems(year, week))
  }, [year, week])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const getRecipe = (id: string): Recipe | undefined => recipes.find((r) => r.id === id)
  const getSlot = (day: number, meal: 'lunch' | 'dinner'): WeekMenuSlot =>
    slots.find((s) => s.day === day && s.meal === meal) ?? { day, meal, recipeId: null }
  const getRecipeForSlot = (slot: WeekMenuSlot): Recipe | undefined =>
    slot.recipeId ? getRecipe(slot.recipeId) : undefined

  const setSlotRecipe = (day: number, meal: 'lunch' | 'dinner', recipeId: string | null) => {
    setSlots((prev) => {
      const next = prev.map((s) =>
        s.day === day && s.meal === meal ? { ...s, recipeId } : s
      )
      void saveWeekMenu({ year, week, slots: next })
      return next
    })
  }

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string)
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const overId = String(over.id)
    if (overId.startsWith('slot-')) {
      const [, dayStr, meal] = overId.split('-')
      const day = Number(dayStr)
      const mealType = meal as 'lunch' | 'dinner'
      if (active.data.current?.type === 'recipe' && active.data.current.recipe) {
        setSlotRecipe(day, mealType, (active.data.current.recipe as Recipe).id)
      }
    }
  }

  const weekStart = useMemo(() => {
    const d = new Date(year, 0, 1)
    const firstMonday = new Date(d)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    firstMonday.setDate(d.getDate() + diff + (week - 1) * 7)
    return firstMonday
  }, [year, week])

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-recipe text-2xl font-semibold text-ink">Week menu</h1>
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

      <p className="text-ink-muted">
        Drag recipes from the list below into the week grid. You can also open a recipe and click &quot;Add to week menu&quot; then choose a day/meal (future: we&apos;ll add that picker).
      </p>

      {menuLoading && (
        <p className="text-ink-muted mb-4">Loading week menu…</p>
      )}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 text-ink font-medium w-28">Day</th>
                <th className="text-left p-3 text-ink font-medium">Lunch</th>
                <th className="text-left p-3 text-ink font-medium">Dinner</th>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((name, day) => (
                <tr key={day} className="border-t border-border">
                  <td className="p-3 align-top">
                    <span className="font-medium text-ink">{name}</span>
                    <span className="block text-xs text-ink-muted">
                      {new Date(weekStart.getTime() + day * 86400000).getDate()}/
                      {new Date(weekStart.getTime() + day * 86400000).getMonth() + 1}
                    </span>
                  </td>
                  <td className="p-3 align-top w-[50%]">
                    <WeekSlot
                      slot={getSlot(day, 'lunch')}
                      recipe={getRecipeForSlot(getSlot(day, 'lunch'))}
                      onClear={() => setSlotRecipe(day, 'lunch', null)}
                    />
                  </td>
                  <td className="p-3 align-top w-[50%]">
                    <WeekSlot
                      slot={getSlot(day, 'dinner')}
                      recipe={getRecipeForSlot(getSlot(day, 'dinner'))}
                      onClear={() => setSlotRecipe(day, 'dinner', null)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <h2 className="font-recipe text-lg font-semibold text-ink mb-4">Grocery list</h2>
          <p className="text-ink-muted text-sm mb-4">
            Ingredients from this week&apos;s recipes, grouped by category. Remove items you already have.
          </p>
          {hasAnyGroceries ? (
            <div className="space-y-6">
              {GROCERY_CATEGORY_ORDER.map((category) => {
                const items = groceryListByCategory.get(category) ?? []
                if (items.length === 0) return null
                return (
                  <div key={category}>
                    <h3 className="font-medium text-ink mb-2 text-sm uppercase tracking-wide text-olive">
                      {category}
                    </h3>
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
          ) : (
            <p className="text-ink-muted py-4">
              Add recipes to the week grid above to generate a grocery list.
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

        <div className="mt-10">
          <h2 className="font-recipe text-lg font-semibold text-ink mb-4">Recipes – drag to week</h2>
          <div className="mb-4">
            <input
              type="search"
              placeholder="Search recipes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
              aria-label="Search recipes"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {filteredRecipes.map((recipe) => (
              <DraggableRecipeItem key={recipe.id} recipe={recipe} />
            ))}
          </div>
          {recipes.length === 0 && (
            <p className="text-ink-muted">Add or import recipes first, then drag them here.</p>
          )}
          {recipes.length > 0 && filteredRecipes.length === 0 && (
            <p className="text-ink-muted">No recipes match your search. Try a different term.</p>
          )}
        </div>

        <DragOverlay>
          {activeId && getRecipe(activeId) ? (
            <div className="w-48 opacity-95 shadow-lg rounded-xl overflow-hidden bg-white border border-border">
              <RecipeCardDraggable recipe={getRecipe(activeId)!} compact={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
