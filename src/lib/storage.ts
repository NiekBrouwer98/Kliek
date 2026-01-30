import type { Recipe, WeekMenu } from '../types/recipe'

const RECIPES_KEY = 'kliek-recipes'
const WEEK_MENUS_KEY = 'kliek-week-menus'

export function getRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes))
}

export function getRecipe(id: string): Recipe | undefined {
  return getRecipes().find((r) => r.id === id)
}

export function addRecipe(recipe: Recipe): void {
  const recipes = getRecipes()
  if (recipes.some((r) => r.id === recipe.id)) return
  recipes.push(recipe)
  saveRecipes(recipes)
}

export function updateRecipe(id: string, updates: Partial<Recipe>): void {
  const recipes = getRecipes()
  const idx = recipes.findIndex((r) => r.id === id)
  if (idx === -1) return
  recipes[idx] = { ...recipes[idx], ...updates, updatedAt: new Date().toISOString() }
  saveRecipes(recipes)
}

export function deleteRecipe(id: string): void {
  saveRecipes(getRecipes().filter((r) => r.id !== id))
}

export function getWeekMenus(): WeekMenu[] {
  try {
    const raw = localStorage.getItem(WEEK_MENUS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getWeekMenu(year: number, week: number): WeekMenu {
  const menus = getWeekMenus()
  const existing = menus.find((m) => m.year === year && m.week === week)
  if (existing) return existing
  const slots: WeekMenu['slots'] = []
  for (let day = 0; day < 7; day++) {
    slots.push({ day, meal: 'lunch', recipeId: null })
    slots.push({ day, meal: 'dinner', recipeId: null })
  }
  const menu: WeekMenu = { year, week, slots }
  menus.push(menu)
  localStorage.setItem(WEEK_MENUS_KEY, JSON.stringify(menus))
  return menu
}

export function saveWeekMenu(menu: WeekMenu): void {
  const menus = getWeekMenus().filter((m) => !(m.year === menu.year && m.week === menu.week))
  menus.push(menu)
  localStorage.setItem(WEEK_MENUS_KEY, JSON.stringify(menus))
}
