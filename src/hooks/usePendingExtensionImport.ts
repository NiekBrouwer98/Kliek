import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import type { Recipe } from '../types/recipe'
import { useData } from '../contexts/DataContext'
import { autoCategorize } from '../lib/categories'

const PENDING_IMPORT_KEY = 'kliek-pending-import'

interface ExtensionRecipePayload {
  title: string
  ingredients: string[]
  instructions: string[]
  sourceUrl?: string
  imageUrl?: string
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
}

function processPendingImport(addRecipe: (recipe: Recipe) => Promise<void>): string | null {
  try {
    const raw = localStorage.getItem(PENDING_IMPORT_KEY)
    if (!raw) return null
    const payload = JSON.parse(raw) as ExtensionRecipePayload
    localStorage.removeItem(PENDING_IMPORT_KEY)

    if (!payload.title || !Array.isArray(payload.ingredients) || !Array.isArray(payload.instructions)) {
      return null
    }

    const ingredients = payload.ingredients.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    const instructions = payload.instructions.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    if (ingredients.length === 0 && instructions.length === 0) return null

    const categories = autoCategorize({
      title: payload.title,
      ingredients,
      instructions,
    })
    const now = new Date().toISOString()
    const recipe: Recipe = {
      id: uuidv4(),
      title: payload.title.trim(),
      source: 'website',
      sourceUrl: payload.sourceUrl,
      imageUrl: payload.imageUrl,
      servings: payload.servings,
      prepTimeMinutes: payload.prepTimeMinutes,
      cookTimeMinutes: payload.cookTimeMinutes,
      ingredients,
      instructions,
      categories,
      createdAt: now,
      updatedAt: now,
    }
    void addRecipe(recipe)
    return recipe.id
  } catch {
    localStorage.removeItem(PENDING_IMPORT_KEY)
    return null
  }
}

/**
 * Listens for recipe data sent from the Kliek browser extension and adds it to the app.
 * Call once at app root.
 */
export function usePendingExtensionImport() {
  const navigate = useNavigate()
  const { addRecipe } = useData()

  useEffect(() => {
    async function handle() {
      const recipeId = await processPendingImport(addRecipe)
      if (recipeId) navigate(`/recipe/${recipeId}`, { replace: true })
    }

    void handle()

    window.addEventListener('kliek-pending-import', handle)

    const pollMs = 400
    const pollMax = 3000
    const pollId = window.setInterval(() => {
      handle()
    }, pollMs)
    const stopPoll = window.setTimeout(() => {
      window.clearInterval(pollId)
    }, pollMax)

    return () => {
      window.removeEventListener('kliek-pending-import', handle)
      window.clearInterval(pollId)
      window.clearTimeout(stopPoll)
    }
  }, [navigate])
}
