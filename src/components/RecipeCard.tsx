import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'

interface RecipeCardProps {
  recipe: Recipe
}

const sourceLabels: Record<Recipe['source'], string> = {
  manual: 'Manual',
  website: 'Website',
  instagram: 'Instagram',
  'albert-heijn': 'Albert Heijn',
  pdf: 'PDF',
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = [recipe.prepTimeMinutes, recipe.cookTimeMinutes].filter(Boolean).reduce((a, b) => a! + b!, 0)

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="block bg-white/90 backdrop-blur rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-amber-200/60 hover:border-amber-300"
    >
      <div className="aspect-[4/3] bg-amber-100/80 relative overflow-hidden">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-amber-700/50">
            <span className="text-4xl font-recipe">🍳</span>
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
          {recipe.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/70 text-amber-50"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
      <div className="p-4">
        <h2 className="font-recipe text-lg font-semibold text-amber-950 line-clamp-2">
          {recipe.title}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-amber-800/80">
          <span className="capitalize">{sourceLabels[recipe.source]}</span>
          {recipe.servings != null && <span>• {recipe.servings} servings</span>}
          {totalTime != null && totalTime > 0 && <span>• {totalTime} min</span>}
        </div>
      </div>
    </Link>
  )
}
