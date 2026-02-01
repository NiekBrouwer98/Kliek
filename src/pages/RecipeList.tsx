import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import RecipeCard from '../components/RecipeCard'

export default function RecipeList() {
  const { recipes, recipesLoading } = useData()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const allCategories = useMemo(() => {
    const set = new Set<string>()
    recipes.forEach((r) => r.categories.forEach((c) => set.add(c)))
    return Array.from(set).sort()
  }, [recipes])

  const filtered = useMemo(() => {
    let list = recipes
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.toLowerCase().includes(q)) ||
          r.categories.some((c) => c.toLowerCase().includes(q))
      )
    }
    if (categoryFilter) {
      list = list.filter((r) => r.categories.includes(categoryFilter))
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [recipes, search, categoryFilter])

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <h1 className="font-recipe text-3xl font-semibold text-ink">My recipes</h1>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/add"
            className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark transition-colors shadow-sm"
          >
            Add recipe
          </Link>
          <Link
            to="/import"
            className="px-5 py-2.5 rounded-xl bg-sage text-white font-medium hover:bg-sage-dark transition-colors shadow-sm"
          >
            Import
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search recipes, ingredients, categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-border bg-white text-ink placeholder:text-ink-muted focus:border-sage focus:ring-2 focus:ring-sage/20"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-border bg-white text-ink focus:border-sage focus:ring-2 focus:ring-sage/20"
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {recipesLoading ? (
        <div className="rounded-2xl border border-border bg-white/80 py-16 text-center text-ink-muted">
          Loading recipes…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white/80 py-16 px-6 text-center">
          {recipes.length === 0 ? (
            <>
              <p className="font-recipe text-xl text-ink">No recipes yet</p>
              <p className="mt-3 text-ink-muted max-w-md mx-auto">
                Add a recipe manually or import from a website, Instagram, Albert Heijn, or PDF.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link to="/add" className="px-5 py-2.5 rounded-xl bg-terracotta text-white font-medium hover:bg-terracotta-dark">
                  Add recipe
                </Link>
                <Link to="/import" className="px-5 py-2.5 rounded-xl bg-sage text-white font-medium hover:bg-sage-dark">
                  Import
                </Link>
              </div>
            </>
          ) : (
            <p className="text-ink-muted">No recipes match your search or category filter.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
