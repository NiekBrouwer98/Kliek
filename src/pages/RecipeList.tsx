import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecipes } from '../lib/storage'
import RecipeCard from '../components/RecipeCard'

function useRecipes() {
  return useState(getRecipes())
}

export default function RecipeList() {
  const [recipes] = useRecipes()
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="font-recipe text-2xl font-bold text-amber-950">My recipes</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/add"
            className="px-4 py-2 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 transition-colors"
          >
            Add recipe
          </Link>
          <Link
            to="/import"
            className="px-4 py-2 rounded-xl bg-amber-600/90 text-white font-medium hover:bg-amber-700 transition-colors"
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
          className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-amber-200 bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-amber-200 bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/80 rounded-2xl border border-amber-200/60 p-12 text-center text-amber-800/80">
          {recipes.length === 0 ? (
            <>
              <p className="font-recipe text-xl text-amber-900">No recipes yet</p>
              <p className="mt-2">Add a recipe manually or import from a website, Instagram, Albert Heijn, or PDF.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/add" className="px-4 py-2 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800">
                  Add recipe
                </Link>
                <Link to="/import" className="px-4 py-2 rounded-xl bg-amber-600/90 text-white font-medium hover:bg-amber-700">
                  Import
                </Link>
              </div>
            </>
          ) : (
            <p>No recipes match your search or category filter.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
