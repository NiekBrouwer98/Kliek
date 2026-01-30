import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Recipe, WeekMenu } from '../types/recipe'
import { supabase } from '../lib/supabase'
import * as storage from '../lib/storage'
import * as supabaseRecipes from '../lib/supabaseRecipes'
import { useAuth } from './AuthContext'

type DataContextValue = {
  recipes: Recipe[]
  recipesLoading: boolean
  getRecipe: (id: string) => Recipe | undefined
  addRecipe: (recipe: Recipe) => Promise<void>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  refreshRecipes: () => Promise<void>
  getWeekMenu: (year: number, week: number) => Promise<WeekMenu>
  saveWeekMenu: (menu: WeekMenu) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)

  const refreshRecipes = useCallback(async () => {
    if (supabase && user) {
      setRecipesLoading(true)
      try {
        const list = await supabaseRecipes.fetchRecipes(supabase)
        setRecipes(list)
      } catch (e) {
        console.error('Failed to fetch recipes', e)
        setRecipes([])
      } finally {
        setRecipesLoading(false)
      }
    } else {
      setRecipes(storage.getRecipes())
      setRecipesLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshRecipes()
  }, [refreshRecipes])

  const getRecipe = useCallback(
    (id: string): Recipe | undefined => recipes.find((r) => r.id === id),
    [recipes]
  )

  const addRecipe = useCallback(
    async (recipe: Recipe) => {
      if (supabase && user) {
        await supabaseRecipes.insertRecipe(supabase, recipe)
        await refreshRecipes()
      } else {
        storage.addRecipe(recipe)
        setRecipes(storage.getRecipes())
      }
    },
    [user, refreshRecipes]
  )

  const updateRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>) => {
      if (supabase && user) {
        await supabaseRecipes.updateRecipeRow(supabase, id, updates)
        await refreshRecipes()
      } else {
        storage.updateRecipe(id, updates)
        setRecipes(storage.getRecipes())
      }
    },
    [user, refreshRecipes]
  )

  const deleteRecipe = useCallback(
    async (id: string) => {
      if (supabase && user) {
        await supabaseRecipes.deleteRecipeRow(supabase, id)
        await refreshRecipes()
      } else {
        storage.deleteRecipe(id)
        setRecipes(storage.getRecipes())
      }
    },
    [user, refreshRecipes]
  )

  const getWeekMenu = useCallback(
    async (year: number, week: number): Promise<WeekMenu> => {
      if (supabase && user) {
        return supabaseRecipes.getOrCreateWeekMenu(supabase, year, week)
      }
      return storage.getWeekMenu(year, week)
    },
    [user]
  )

  const saveWeekMenu = useCallback(
    async (menu: WeekMenu) => {
      if (supabase && user) {
        await supabaseRecipes.upsertWeekMenu(supabase, menu)
      } else {
        storage.saveWeekMenu(menu)
      }
    },
    [user]
  )

  const value: DataContextValue = {
    recipes,
    recipesLoading,
    getRecipe,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    refreshRecipes,
    getWeekMenu,
    saveWeekMenu,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
