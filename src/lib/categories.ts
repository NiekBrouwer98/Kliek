import type { Recipe } from '../types/recipe'

const CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ['pasta', 'spaghetti', 'penne', 'lasagne', 'carbonara'], category: 'Pasta' },
  { keywords: ['salad', 'salade', 'slaw'], category: 'Salad' },
  { keywords: ['soup', 'soep', 'bouillon'], category: 'Soup' },
  { keywords: ['cake', 'taart', 'brownie', 'cookie', 'koek'], category: 'Dessert' },
  { keywords: ['chicken', 'kip', 'poultry'], category: 'Poultry' },
  { keywords: ['beef', 'vlees', 'steak', 'hamburger'], category: 'Beef' },
  { keywords: ['fish', 'vis', 'salmon', 'zalm', 'tuna'], category: 'Fish' },
  { keywords: ['vegetarian', 'vega', 'tofu', 'tempeh', 'chickpea', 'linzen'], category: 'Vegetarian' },
  { keywords: ['breakfast', 'ontbijt', 'pancake', 'waffle'], category: 'Breakfast' },
  { keywords: ['curry', 'indian', 'thai', 'asian'], category: 'Asian' },
  { keywords: ['pizza', 'flatbread'], category: 'Pizza & Bread' },
  { keywords: ['quick', 'snel', '15 min', '20 min', '30 min'], category: 'Quick & Easy' },
]

export function autoCategorize(recipe: Pick<Recipe, 'title' | 'ingredients' | 'instructions'>): string[] {
  const text = [
    recipe.title,
    ...recipe.ingredients,
    ...recipe.instructions,
  ].join(' ').toLowerCase()
  const categories = new Set<string>()
  for (const { keywords, category } of CATEGORY_RULES) {
    if (keywords.some((k) => text.includes(k.toLowerCase()))) categories.add(category)
  }
  if (categories.size === 0) categories.add('Other')
  return Array.from(categories)
}
