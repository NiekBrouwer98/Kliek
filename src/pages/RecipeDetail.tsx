import { useParams, Link, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'

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
  const { getRecipe, deleteRecipe } = useData()
  const recipe = id ? getRecipe(id) : undefined

  if (!recipe) {
    return (
      <div className="text-center py-16">
        <p className="text-ink-muted">Recipe not found.</p>
        <Link to="/" className="mt-4 inline-block font-medium text-olive hover:underline">
          Back to recipes
        </Link>
      </div>
    )
  }

  const totalTime = [recipe.prepTimeMinutes, recipe.cookTimeMinutes].filter(Boolean).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)

  const handleDelete = async () => {
    if (confirm('Delete this recipe?')) {
      await deleteRecipe(recipe.id)
      navigate('/')
    }
  }

  return (
    <article className="max-w-2xl mx-auto">
      <div className="rounded-[1.5rem] overflow-hidden bg-white border border-border-soft shadow-sm">
        <div className="aspect-[16/9] bg-cream-2 relative">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sage/40">
              <span className="text-6xl font-recipe">🍳</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {recipe.categories.map((cat: string) => (
              <span
                key={cat}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/90 text-olive backdrop-blur-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="px-6 sm:px-10 py-8 sm:py-10">
          <h1 className="font-recipe text-2xl sm:text-3xl font-semibold text-ink leading-tight">
            {recipe.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
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
              className="mt-3 inline-block text-sm font-medium text-terracotta hover:text-terracotta-dark transition-colors"
            >
              Original source →
            </a>
          )}

          <section className="mt-10 pt-8 border-t border-border">
            <h2 className="font-recipe text-lg font-semibold text-ink mb-4">Ingredients</h2>
            <ul className="space-y-2 text-ink leading-relaxed list-none pl-0">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="pl-6 relative before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-sage/60">
                  {ing}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 pt-8 border-t border-border">
            <h2 className="font-recipe text-lg font-semibold text-ink mb-4">Instructions</h2>
            <ol className="space-y-5 text-ink leading-relaxed list-none pl-0">
              {recipe.instructions.map((step: string, i: number) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sage/20 flex items-center justify-center text-sm font-semibold text-olive">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {recipe.notes && (
            <section className="mt-10 pt-8 border-t border-border">
              <h2 className="font-recipe text-lg font-semibold text-ink mb-3">Notes</h2>
              <p className="text-ink-muted whitespace-pre-wrap leading-relaxed bg-cream-2/60 rounded-xl p-4">{recipe.notes}</p>
            </section>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to={`/add?edit=${recipe.id}`}
          className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark transition-colors"
        >
          Edit
        </Link>
        <Link to="/week-menu" className="px-5 py-2.5 rounded-xl bg-sage text-white font-medium hover:bg-sage-dark transition-colors">
          Add to week menu
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          className="px-5 py-2.5 rounded-xl border border-border text-ink-muted hover:bg-cream-2 hover:text-ink transition-colors"
        >
          Delete
        </button>
        <Link to="/" className="px-5 py-2.5 rounded-xl text-ink-muted hover:text-olive font-medium transition-colors">
          ← Back to recipes
        </Link>
      </div>
    </article>
  )
}
