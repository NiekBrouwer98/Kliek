import type { Recipe, WeekMenu } from '../types/recipe'

const RECIPES_TABLE = 'recipes'
const WEEK_MENUS_TABLE = 'week_menus'

type RecipeRow = {
  id: string
  user_id: string
  title: string
  source: string
  source_url: string | null
  image_url: string | null
  servings: number | null
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  ingredients: string[]
  instructions: string[]
  categories: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

type WeekMenuRow = {
  id: string
  user_id: string
  year: number
  week: number
  slots: WeekMenu['slots']
  created_at: string
  updated_at: string
}

function recipeFromRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    source: row.source as Recipe['source'],
    sourceUrl: row.source_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    servings: row.servings ?? undefined,
    prepTimeMinutes: row.prep_time_minutes ?? undefined,
    cookTimeMinutes: row.cook_time_minutes ?? undefined,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    categories: row.categories ?? [],
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function recipeToRow(recipe: Omit<Recipe, 'createdAt' | 'updatedAt'>): Omit<RecipeRow, 'user_id' | 'created_at' | 'updated_at'> {
  return {
    id: recipe.id,
    title: recipe.title,
    source: recipe.source,
    source_url: recipe.sourceUrl ?? null,
    image_url: recipe.imageUrl ?? null,
    servings: recipe.servings ?? null,
    prep_time_minutes: recipe.prepTimeMinutes ?? null,
    cook_time_minutes: recipe.cookTimeMinutes ?? null,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    categories: recipe.categories,
    notes: recipe.notes ?? null,
  }
}

export async function fetchRecipes(supabase: NonNullable<typeof import('./supabase').supabase>): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from(RECIPES_TABLE)
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => recipeFromRow(row as RecipeRow))
}

export async function fetchRecipe(
  supabase: NonNullable<typeof import('./supabase').supabase>,
  id: string
): Promise<Recipe | null> {
  const { data, error } = await supabase.from(RECIPES_TABLE).select('*').eq('id', id).single()
  if (error || !data) return null
  return recipeFromRow(data as RecipeRow)
}

export async function insertRecipe(
  supabase: NonNullable<typeof import('./supabase').supabase>,
  recipe: Recipe
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const row = recipeToRow(recipe)
  const { error } = await supabase.from(RECIPES_TABLE).insert({
    ...row,
    user_id: user.id,
    created_at: recipe.createdAt,
    updated_at: recipe.updatedAt,
  })
  if (error) throw error
}

export async function updateRecipeRow(
  supabase: NonNullable<typeof import('./supabase').supabase>,
  id: string,
  updates: Partial<Recipe>
): Promise<void> {
  const set: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.title != null) set.title = updates.title
  if (updates.source != null) set.source = updates.source
  if (updates.sourceUrl != null) set.source_url = updates.sourceUrl
  if (updates.imageUrl != null) set.image_url = updates.imageUrl
  if (updates.servings != null) set.servings = updates.servings
  if (updates.prepTimeMinutes != null) set.prep_time_minutes = updates.prepTimeMinutes
  if (updates.cookTimeMinutes != null) set.cook_time_minutes = updates.cookTimeMinutes
  if (updates.ingredients != null) set.ingredients = updates.ingredients
  if (updates.instructions != null) set.instructions = updates.instructions
  if (updates.categories != null) set.categories = updates.categories
  if (updates.notes != null) set.notes = updates.notes
  const { error } = await supabase.from(RECIPES_TABLE).update(set).eq('id', id)
  if (error) throw error
}

export async function deleteRecipeRow(
  supabase: NonNullable<typeof import('./supabase').supabase>,
  id: string
): Promise<void> {
  const { error } = await supabase.from(RECIPES_TABLE).delete().eq('id', id)
  if (error) throw error
}

export async function fetchWeekMenu(
  supabase: NonNullable<typeof import('./supabase').supabase>,
  year: number,
  week: number
): Promise<WeekMenu | null> {
  const { data, error } = await supabase
    .from(WEEK_MENUS_TABLE)
    .select('*')
    .eq('year', year)
    .eq('week', week)
    .single()
  if (error || !data) return null
  const row = data as WeekMenuRow
  return { year: row.year, week: row.week, slots: row.slots }
}

export async function upsertWeekMenu(
  supabase: NonNullable<typeof import('./supabase').supabase>,
  menu: WeekMenu
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from(WEEK_MENUS_TABLE).upsert(
    { user_id: user.id, year: menu.year, week: menu.week, slots: menu.slots, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,year,week' }
  )
  if (error) throw error
}

function defaultSlots(): WeekMenu['slots'] {
  const slots: WeekMenu['slots'] = []
  for (let day = 0; day < 7; day++) {
    slots.push({ day, meal: 'lunch', recipeId: null })
    slots.push({ day, meal: 'dinner', recipeId: null })
  }
  return slots
}

export async function getOrCreateWeekMenu(
  supabase: NonNullable<typeof import('./supabase').supabase>,
  year: number,
  week: number
): Promise<WeekMenu> {
  const existing = await fetchWeekMenu(supabase, year, week)
  if (existing) return existing
  const menu: WeekMenu = { year, week, slots: defaultSlots() }
  await upsertWeekMenu(supabase, menu)
  return { ...menu, slots: [...menu.slots] }
}
