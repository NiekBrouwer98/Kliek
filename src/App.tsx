import { Routes, Route, NavLink } from 'react-router-dom'
import { usePendingExtensionImport } from './hooks/usePendingExtensionImport'
import { useAuth } from './contexts/AuthContext'
import { hasSupabase } from './lib/supabase'
import ImportFromDeviceBanner from './components/ImportFromDeviceBanner'
import RecipeList from './pages/RecipeList'
import RecipeDetail from './pages/RecipeDetail'
import AddRecipe from './pages/AddRecipe'
import ImportRecipe from './pages/ImportRecipe'
import WeekMenu from './pages/WeekMenu'
import Login from './pages/Login'

function App() {
  usePendingExtensionImport()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-amber-900/90 text-amber-50 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <NavLink to="/" className="font-recipe text-xl font-semibold tracking-tight hover:opacity-90">
            Kliek
          </NavLink>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-800 text-white' : 'text-amber-100 hover:bg-amber-800/60'}`
              }
            >
              Recipes
            </NavLink>
            <NavLink
              to="/add"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-800 text-white' : 'text-amber-100 hover:bg-amber-800/60'}`
              }
            >
              Add recipe
            </NavLink>
            <NavLink
              to="/import"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-800 text-white' : 'text-amber-100 hover:bg-amber-800/60'}`
              }
            >
              Import
            </NavLink>
            <NavLink
              to="/week-menu"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-800 text-white' : 'text-amber-100 hover:bg-amber-800/60'}`
              }
            >
              Week menu
            </NavLink>
            {hasSupabase() && (
              user ? (
                <span className="flex items-center gap-2">
                  <span className="text-amber-100 text-sm truncate max-w-[120px]" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-amber-100 hover:bg-amber-800/60"
                  >
                    Log out
                  </button>
                </span>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-amber-800 text-white' : 'text-amber-100 hover:bg-amber-800/60'}`
                  }
                >
                  Sign in
                </NavLink>
              )
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <ImportFromDeviceBanner />
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/add" element={<AddRecipe />} />
          <Route path="/import" element={<ImportRecipe />} />
          <Route path="/week-menu" element={<WeekMenu />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
