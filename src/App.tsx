import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { usePendingExtensionImport } from './hooks/usePendingExtensionImport'
import { useAuth } from './contexts/AuthContext'
import ImportFromDeviceBanner from './components/ImportFromDeviceBanner'
import ExtensionInstallGuide from './components/ExtensionInstallGuide'
import RecipeList from './pages/RecipeList'
import RecipeDetail from './pages/RecipeDetail'
import AddRecipe from './pages/AddRecipe'
import ImportRecipe from './pages/ImportRecipe'
import WeekMenu from './pages/WeekMenu'
import GroceryList from './pages/GroceryList'
import Login from './pages/Login'

function App() {
  usePendingExtensionImport()
  const { user, signOut } = useAuth()
  const [extensionGuideOpen, setExtensionGuideOpen] = useState(false)

  useEffect(() => {
    if (window.location.hash === '#extension') {
      setExtensionGuideOpen(true)
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    const onHashChange = () => {
      if (window.location.hash === '#extension') {
        setExtensionGuideOpen(true)
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="bg-cream-2 border-b border-border sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-5xl mx-auto px-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
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
            <NavLink
              to="/grocery-list"
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-sage text-white' : 'text-ink-muted hover:text-olive hover:bg-sage/10'}`
              }
            >
              Grocery list
            </NavLink>
            <button
              type="button"
              onClick={() => setExtensionGuideOpen(true)}
              className="px-3 py-2 rounded-xl text-sm font-medium text-ink-muted hover:text-olive hover:bg-sage/10 transition-colors"
            >
              Chrome extension
            </button>
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
      {extensionGuideOpen && (
        <ExtensionInstallGuide onClose={() => setExtensionGuideOpen(false)} />
      )}
      <main className="flex-1 max-w-5xl w-full mx-auto px-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-10 sm:pt-12 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <ImportFromDeviceBanner />
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/add" element={<AddRecipe />} />
          <Route path="/import" element={<ImportRecipe />} />
          <Route path="/week-menu" element={<WeekMenu />} />
          <Route path="/grocery-list" element={<GroceryList />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
