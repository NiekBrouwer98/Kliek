import { useParams, Link, useNavigate } from 'react-router-dom'
import { getRecipe, deleteRecipe } from '../lib/storage'

const sourceLabels: Record<string, string> = {
  manual: 'Manual',
  website: 'Website',
  instagram: 'Instagram',
  'albert-heijn': 'Albert Heijn',
  pdf: 'PDF',
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = id ? getRecipe(id) : undefined

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <p className="text-amber-800">Recipe not found.</p>
        <Link to="/" className="mt-4 inline-block text-amber-700 font-medium hover:underline">
          Back to recipes
        </Link>
      </div>
    )
  }

  const totalTime = [recipe.prepTimeMinutes, recipe.cookTimeMinutes].filter(Boolean).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)

  const handleDelete = () => {
    if (confirm('Delete this recipe?')) {
      deleteRecipe(recipe.id)
      navigate('/')
    }
  }

  return (
    <article className="max-w-2xl mx-auto">
      <div className="bg-white/95 rounded-2xl shadow-lg border border-amber-200/60 overflow-hidden">
        <div className="aspect-[16/9] bg-amber-100/80 relative">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-700/40">
              <span className="text-6xl font-recipe">🍳</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            {recipe.categories.map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-full text-sm font-medium bg-amber-900/80 text-amber-50"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="font-recipe text-2xl sm:text-3xl font-bold text-amber-950">
            {recipe.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-amber-800/80">
            <span className="capitalize">{sourceLabels[recipe.source] ?? recipe.source}</span>
            {recipe.servings != null && <span>{recipe.servings} servings</span>}
            {totalTime != null && totalTime > 0 && <span>{totalTime} min total</span>}
            {recipe.prepTimeMinutes != null && recipe.prepTimeMinutes > 0 && (
              <span>Prep: {recipe.prepTimeMinutes} min</span>
            )}
            {recipe.cookTimeMinutes != null && recipe.cookTimeMinutes > 0 && (
              <span>Cook: {recipe.cookTimeMinutes} min</span>
            )}
          </div>
          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-amber-700 hover:underline"
            >
              Original source →
            </a>
          )}

          <section className="mt-8">
            <h2 className="font-recipe text-lg font-semibold text-amber-900 mb-2">Ingredients</h2>
            <ul className="list-disc list-inside space-y-1 text-amber-900/90">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="font-recipe text-lg font-semibold text-amber-900 mb-2">Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-amber-900/90">
              {recipe.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>

          {recipe.notes && (
            <section className="mt-8 p-4 rounded-xl bg-amber-50/80 border border-amber-200/60">
              <h2 className="font-recipe text-lg font-semibold text-amber-900 mb-2">Notes</h2>
              <p className="text-amber-900/90 whitespace-pre-wrap">{recipe.notes}</p>
            </section>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/add?edit=${recipe.id}`}
          className="px-4 py-2 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800"
        >
          Edit
        </Link>
        <Link to="/week-menu" className="px-4 py-2 rounded-xl bg-amber-600/90 text-white font-medium hover:bg-amber-700">
          Add to week menu
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-100"
        >
          Delete
        </button>
        <Link to="/" className="px-4 py-2 rounded-xl text-amber-800 hover:underline">
          Back to recipes
        </Link>
      </div>
    </article>
  )
}
