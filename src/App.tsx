import { Routes, Route, NavLink } from 'react-router-dom'
import { usePendingExtensionImport } from './hooks/usePendingExtensionImport'
import { useAuth } from './contexts/AuthContext'
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
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="bg-cream-2 border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <NavLink to="/" className="font-recipe text-xl font-semibold text-ink tracking-tight hover:text-olive transition-colors">
            Kliek
          </NavLink>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-sage text-white' : 'text-ink-muted hover:text-olive hover:bg-sage/10'}`
              }
            >
              Recipes
            </NavLink>
            <NavLink
              to="/add"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-sage text-white' : 'text-ink-muted hover:text-olive hover:bg-sage/10'}`
              }
            >
              Add recipe
            </NavLink>
            <NavLink
              to="/import"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-sage text-white' : 'text-ink-muted hover:text-olive hover:bg-sage/10'}`
              }
            >
              Import
            </NavLink>
            <NavLink
              to="/week-menu"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-sage text-white' : 'text-ink-muted hover:text-olive hover:bg-sage/10'}`
              }
            >
              Week menu
            </NavLink>
            {user ? (
              <span className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                <span className="text-ink-muted text-sm truncate max-w-[120px]" title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-olive hover:bg-sage/10 transition-colors"
                >
                  Log out
                </button>
              </span>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-sage text-white' : 'text-ink-muted hover:text-olive hover:bg-sage/10'}`
                }
              >
                Sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-10 sm:py-12">
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
