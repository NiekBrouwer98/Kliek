import { useDraggable } from '@dnd-kit/core'
import type { Recipe } from '../types/recipe'

interface RecipeCardDraggableProps {
  recipe: Recipe
  compact?: boolean
}

const sourceLabels: Record<Recipe['source'], string> = {
  manual: 'Manual',
  website: 'Website',
  instagram: 'Instagram',
  'albert-heijn': 'Albert Heijn',
  pdf: 'PDF',
}

export default function RecipeCardDraggable({ recipe, compact }: RecipeCardDraggableProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: recipe.id,
    data: { type: 'recipe', recipe },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        bg-white rounded-xl border border-border shadow-sm cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-60 shadow-md scale-[1.02] z-50' : ''}
        ${compact ? 'flex items-center gap-2' : 'overflow-hidden'}
      `}
    >
      {!compact && (
        <div className="aspect-[4/3] bg-cream-2 relative overflow-hidden rounded-t-xl">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sage/40">
              <span className="text-2xl">🍳</span>
            </div>
          )}
        </div>
      )}
      <div className={compact ? 'p-2' : 'p-3'}>
        <h3 className={`font-recipe font-semibold text-ink line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
          {recipe.title}
        </h3>
        {!compact && (
          <p className="mt-1 text-xs text-ink-muted capitalize">{sourceLabels[recipe.source]}</p>
        )}
      </div>
    </div>
  )
}
