/**
 * Maps ingredient strings to grocery list categories for grouping.
 * Order of categories here defines display order.
 */
export const GROCERY_CATEGORY_ORDER = [
  'Produce',
  'Dairy & eggs',
  'Meat & fish',
  'Bakery',
  'Pantry',
  'Frozen',
  'Other',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORY_ORDER)[number]

const CATEGORY_KEYWORDS: { category: GroceryCategory; keywords: string[] }[] = [
  {
    category: 'Produce',
    keywords: [
      'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'berry', 'berries', 'avocado',
      'tomato', 'tomaten', 'potato', 'aardappel', 'onion', 'ui', 'garlic', 'knoflook',
      'carrot', 'wortel', 'celery', 'pepper', 'paprika', 'cucumber', 'komkommer',
      'lettuce', 'sla', 'spinach', 'spinazie', 'kale', 'broccoli', 'cauliflower', 'bloemkool',
      'mushroom', 'champignon', 'ginger', 'gember', 'herb', 'kruid', 'basil', 'parsley', 'peterselie',
      'coriander', 'dill', 'mint', 'oregano', 'thyme', 'rosemary', 'salade', 'fruit', 'groente',
      'vegetable', 'citrus', 'pear', 'peach', 'plum', 'melon', 'watermelon', 'courgette', 'zucchini',
      'aubergine', 'eggplant', 'squash', 'pumpkin', 'pompoen', 'beet', 'biet', 'radish', 'prei', 'leek',
    ],
  },
  {
    category: 'Dairy & eggs',
    keywords: [
      'milk', 'melk', 'cream', 'room', 'yoghurt', 'yogurt', 'cheese', 'kaas', 'butter', 'boter',
      'egg', 'eieren', 'ei ', ' eitje', 'eiwit', 'yolk', 'mozzarella', 'parmesan', 'feta',
      'crème fraîche', 'creme fraiche', 'sour cream', 'zure room', 'kwark', 'cottage cheese',
    ],
  },
  {
    category: 'Meat & fish',
    keywords: [
      'chicken', 'kip', 'beef', 'vlees', 'pork', 'spek', 'bacon', 'lamb', 'lams', 'minced', 'gehakt',
      'fish', 'vis', 'salmon', 'zalm', 'tuna', 'tonijn', 'cod', 'kabeljauw', 'shrimp', 'garnalen',
      'prawn', 'sausage', 'worst', 'ham', 'turkey', 'kalkoen', 'meat', 'seafood', 'schaal',
    ],
  },
  {
    category: 'Bakery',
    keywords: [
      'bread', 'brood', 'roll', 'bolletje', 'baguette', 'tortilla', 'wrap', 'pita',
      'croissant', 'pastry', 'deeg', 'dough', 'crouton', 'naan', 'flatbread',
    ],
  },
  {
    category: 'Pantry',
    keywords: [
      'oil', 'olie', 'vinegar', 'azijn', 'salt', 'zout', 'pepper', 'peper', 'sugar', 'suiker',
      'flour', 'bloem', 'meal', 'rice', 'rijst', 'pasta', 'noodle', 'noedel', 'couscous',
      'bean', 'bonen', 'lentil', 'linzen', 'chickpea', 'kikkererwten', 'canned', 'blik',
      'tomato paste', 'tomatensaus', 'sauce', 'saus', 'stock', 'bouillon', 'broth',
      'honey', 'honing', 'maple syrup', 'jam', 'nut', 'noot', 'noten', 'seed', 'zaad',
      'coconut', 'kokos', 'olive', 'olijf', 'mustard', 'mosterd', 'ketchup', 'mayo',
      'soy', 'soja', 'soy sauce', 'ketjap', 'curry paste', 'spice', 'kruiden', 'paprika powder',
      'cinnamon', 'kaneel', 'nutmeg', 'cumin', 'komijn', 'turmeric', 'kerrie', 'chili',
      'cereal', 'oat', 'haver', 'muesli', 'breadcrumb', 'paneermeel', 'baking powder',
      'vanilla', 'vanille', 'cocoa', 'cacao', 'chocolate', 'chocolade', 'tahini',
      'peanut butter', 'pindakaas', 'almond', 'amandel', 'cracker', 'biscuit',
    ],
  },
  {
    category: 'Frozen',
    keywords: [
      'frozen', 'diepvries', 'ice', 'ijs', 'frozen vegetable', 'frozen fruit',
      'frozen pea', 'diepvriesgroente', 'ice cream',
    ],
  },
]

function normalizeForMatch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function getGroceryCategory(ingredient: string): GroceryCategory {
  const normalized = normalizeForMatch(ingredient)
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => normalized.includes(normalizeForMatch(k)))) return category
  }
  return 'Other'
}

export function sortIngredientsByCategory(ingredients: string[]): Map<GroceryCategory, string[]> {
  const byCategory = new Map<GroceryCategory, string[]>()
  for (const cat of GROCERY_CATEGORY_ORDER) {
    byCategory.set(cat, [])
  }
  for (const ing of ingredients) {
    const cat = getGroceryCategory(ing)
    byCategory.get(cat)!.push(ing)
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }
  return byCategory
}
