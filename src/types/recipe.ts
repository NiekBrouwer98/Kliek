export type RecipeSource = 'manual' | 'website' | 'instagram' | 'albert-heijn' | 'pdf'

export interface Recipe {
  id: string
  title: string
  source: RecipeSource
  sourceUrl?: string
  imageUrl?: string
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  ingredients: string[]
  instructions: string[]
  categories: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface WeekMenuSlot {
  day: number // 0 = Monday, 6 = Sunday
  meal: 'lunch' | 'dinner'
  recipeId: string | null
}

export interface WeekMenu {
  year: number
  week: number
  slots: WeekMenuSlot[]
}
