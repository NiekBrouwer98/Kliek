/**
 * Parses pasted recipe text (from websites, Instagram, Albert Heijn, etc.)
 * into structured ingredients and instructions.
 */
export interface ParsedRecipe {
  title: string
  ingredients: string[]
  instructions: string[]
}

const INGREDIENT_SECTION_MARKERS = [
  'ingredients',
  'ingredienten',
  'benodigdheden',
  'what you need',
  'you need',
]
const INSTRUCTION_SECTION_MARKERS = [
  'instructions',
  'directions',
  'steps',
  'method',
  'bereiding',
  'recept',
  'how to',
  'preparation',
]

function findSection(lines: string[], markers: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().trim()
    if (markers.some((m) => lower.includes(m) && lower.length < 50)) return i
  }
  return -1
}

function isLikelyIngredient(line: string): boolean {
  const t = line.trim()
  if (t.length < 2 || t.length > 200) return false
  // "1 cup flour", "200g sugar", "2 tbsp oil", "salt and pepper"
  const hasQuantity = /^\d+[\s\/\d.]*/.test(t) || /^\s*[-•*]\s*/.test(t) || /^[\d\-•*]\s/.test(t)
  const hasUnit = /\b(tbsp|tsp|cup|g|kg|ml|oz|lb|clove|piece|pinch)\b/i.test(t)
  const bullet = /^[-•*]\s*/.test(t) || /^\d+[.)]\s*/.test(t)
  return bullet || hasQuantity || hasUnit || (t.split(/\s+/).length <= 8 && !t.endsWith('.'))
}

function isLikelyInstruction(line: string): boolean {
  const t = line.trim()
  if (t.length < 10) return false
  const step = /^\d+[.)]\s*/.test(t) || /^[-•*]\s*/.test(t)
  const imperative = /^(mix|add|heat|stir|bake|combine|place|cut|chop|serve)/i.test(t)
  return step || imperative || t.endsWith('.')
}

export function parsePastedText(raw: string, defaultTitle = 'Imported recipe'): ParsedRecipe {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return { title: defaultTitle, ingredients: [], instructions: [] }

  let title = defaultTitle
  const firstLine = lines[0]
  if (firstLine.length < 80 && !firstLine.match(/^\d/)) title = firstLine

  const ingIdx = findSection(lines, INGREDIENT_SECTION_MARKERS)
  const instrIdx = findSection(lines, INSTRUCTION_SECTION_MARKERS)

  let ingredientStart = ingIdx >= 0 ? ingIdx + 1 : 0
  let ingredientEnd = instrIdx >= 0 ? instrIdx : lines.length
  if (instrIdx >= 0 && ingIdx >= 0 && instrIdx < ingIdx) {
    ingredientStart = 0
    ingredientEnd = ingIdx
  }

  const instructionStart = instrIdx >= 0 ? instrIdx + 1 : (ingIdx >= 0 ? ingredientEnd : 0)
  const instructionEnd = lines.length

  const ingredientLines = lines.slice(ingredientStart, ingredientEnd).filter((l) => isLikelyIngredient(l) || l.length < 120)
  const instructionLines = lines.slice(instructionStart, instructionEnd).filter((l) => isLikelyInstruction(l) || (l.length > 15 && l.length < 500))

  const ingredients = ingredientLines.length > 0
    ? ingredientLines.map((l) => l.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean)
    : lines.slice(0, Math.min(20, lines.length)).filter(isLikelyIngredient).map((l) => l.replace(/^[-•*\d.)\s]+/, '').trim()).filter(Boolean)

  const instructions = instructionLines.length > 0
    ? instructionLines.map((l) => l.replace(/^\d+[.)]\s*/, '').replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
    : lines.filter((l) => !ingredients.includes(l) && l.length > 20).slice(0, 30).map((l) => l.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)

  return { title, ingredients, instructions }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const numPages = pdf.numPages
  const parts: string[] = []
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str ?? '' : ''))
      .join(' ')
    parts.push(text)
  }
  return parts.join('\n\n')
}
