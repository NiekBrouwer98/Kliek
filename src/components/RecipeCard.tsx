import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'

interface RecipeCardProps {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = [recipe.prepTimeMinutes, recipe.cookTimeMinutes].filter(Boolean).reduce((a, b) => a! + b!, 0)
  const descriptionParts: string[] = []
  if (recipe.servings != null) descriptionParts.push(`${recipe.servings} servings`)
  if (totalTime != null && totalTime > 0) descriptionParts.push(`${totalTime} min`)
  if (recipe.categories.length > 0) descriptionParts.push(recipe.categories.slice(0, 2).join(', '))
  const description = descriptionParts.join(' · ')

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-cream rounded-[1.25rem]"
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-cream-2 border border-border-soft shadow-sm transition-shadow group-hover:shadow-md">
        <div className="aspect-[4/3] relative overflow-hidden">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sage/40">
              <span className="text-5xl font-recipe">🍳</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {recipe.categories.slice(0, 3).map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-olive backdrop-blur-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
        <div className="p-5">
          <h2 className="font-recipe text-lg font-semibold text-ink line-clamp-2 leading-snug group-hover:text-olive transition-colors">
            {recipe.title}
          </h2>
          {description && (
            <p className="mt-2 text-sm text-ink-muted line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
