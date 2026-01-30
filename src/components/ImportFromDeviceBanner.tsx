import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { getRecipes, saveRecipes } from '../lib/storage'
import { hasSupabase } from '../lib/supabase'

export default function ImportFromDeviceBanner() {
  const { user } = useAuth()
  const { addRecipe, refreshRecipes } = useData()
  const [dismissed, setDismissed] = useState(false)
  const [importing, setImporting] = useState(false)

  if (!hasSupabase() || !user || dismissed) return null

  const localRecipes = getRecipes()
  if (localRecipes.length === 0) return null

  const handleImport = async () => {
    setImporting(true)
    try {
      for (const recipe of localRecipes) {
        await addRecipe(recipe)
      }
      saveRecipes([])
      await refreshRecipes()
      setDismissed(true)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex flex-wrap items-center justify-between gap-3">
      <p className="font-medium">
        You have {localRecipes.length} recipe{localRecipes.length === 1 ? '' : 's'} on this device. Import them to sync across all devices?
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="px-4 py-2 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 disabled:opacity-50"
        >
          {importing ? 'Importing…' : 'Import'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="px-4 py-2 rounded-xl text-amber-800 hover:bg-amber-200/60"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
