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
import { getRecipes } from '../lib/storage'
import { getWeekMenu, saveWeekMenu } from '../lib/storage'
import type { Recipe, WeekMenuSlot } from '../types/recipe'
import RecipeCardDraggable from '../components/RecipeCardDraggable'

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
        min-h-[80px] rounded-xl border-2 border-dashed p-2 transition-colors
        ${isOver ? 'border-amber-500 bg-amber-50' : 'border-amber-200 bg-white/60'}
      `}
    >
      {recipe ? (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-recipe font-medium text-amber-950 truncate">{recipe.title}</p>
            <p className="text-xs text-amber-700">Lunch / Dinner</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex-shrink-0 p-1 rounded text-amber-600 hover:bg-amber-100"
            aria-label="Remove"
          >
            ×
          </button>
        </div>
      ) : (
        <p className="text-sm text-amber-600/80 py-2">Drop recipe here</p>
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
    <div ref={setNodeRef} {...listeners} {...attributes} className={isDragging ? 'opacity-60' : ''}>
      <RecipeCardDraggable recipe={recipe} compact={true} />
    </div>
  )
}

export default function WeekMenu() {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(() => getYear(today))
  const [week, setWeek] = useState(() => getWeekNumber(today))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [recipes] = useState(getRecipes())

  const menu = useMemo(() => getWeekMenu(year, week), [year, week])
  const [slots, setSlots] = useState<WeekMenuSlot[]>(menu.slots)
  useEffect(() => {
    setSlots(getWeekMenu(year, week).slots)
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
      saveWeekMenu({ year, week, slots: next })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-recipe text-2xl font-bold text-amber-950">Week menu</h1>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-amber-800">Week</span>
          <input
            type="number"
            min={1}
            max={53}
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="w-14 px-3 py-2 rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <p className="text-amber-800/80">
        Drag recipes from the list below into the week grid. You can also open a recipe and click &quot;Add to week menu&quot; then choose a day/meal (future: we&apos;ll add that picker).
      </p>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-amber-900 font-medium w-28">Day</th>
                <th className="text-left p-2 text-amber-900 font-medium">Lunch</th>
                <th className="text-left p-2 text-amber-900 font-medium">Dinner</th>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((name, day) => (
                <tr key={day} className="border-t border-amber-200/60">
                  <td className="p-2 align-top">
                    <span className="font-medium text-amber-900">{name}</span>
                    <span className="block text-xs text-amber-600">
                      {new Date(weekStart.getTime() + day * 86400000).getDate()}/
                      {new Date(weekStart.getTime() + day * 86400000).getMonth() + 1}
                    </span>
                  </td>
                  <td className="p-2 align-top w-[50%]">
                    <WeekSlot
                      slot={getSlot(day, 'lunch')}
                      recipe={getRecipeForSlot(getSlot(day, 'lunch'))}
                      onClear={() => setSlotRecipe(day, 'lunch', null)}
                    />
                  </td>
                  <td className="p-2 align-top w-[50%]">
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

        <div className="mt-8">
          <h2 className="font-recipe text-lg font-semibold text-amber-950 mb-3">Recipes – drag to week</h2>
          <div className="flex flex-wrap gap-3">
            {recipes.map((recipe) => (
              <DraggableRecipeItem key={recipe.id} recipe={recipe} />
            ))}
          </div>
          {recipes.length === 0 && (
            <p className="text-amber-800/80">Add or import recipes first, then drag them here.</p>
          )}
        </div>

        <DragOverlay>
          {activeId && getRecipe(activeId) ? (
            <div className="w-48 opacity-95 shadow-xl rounded-xl overflow-hidden bg-white border border-amber-200">
              <RecipeCardDraggable recipe={getRecipe(activeId)!} compact={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
