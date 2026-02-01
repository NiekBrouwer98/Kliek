import * as cheerio from 'cheerio'

const ALLOWED_ORIGINS = [
  'https://kliek-deployed.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]

function getOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.some((o) => origin === o || origin.startsWith(o))) return origin
  return ALLOWED_ORIGINS[0]
}

function parseDuration(str: string | undefined): number | null {
  if (!str || typeof str !== 'string') return null
  const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i)
  if (!match) return null
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  return hours * 60 + minutes
}

function toArray<T>(val: T | T[] | null | undefined): T[] {
  if (Array.isArray(val)) return val
  if (val == null) return []
  return [val]
}

function normalizeStrings(arr: unknown): string[] {
  return toArray(arr)
    .map((x) => (typeof x === 'string' ? x : (x as { '@language'?: string })?.['@language'] ?? ''))
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean)
}

interface ParsedRecipe {
  title: string
  ingredients: string[]
  instructions: string[]
  sourceUrl: string
  imageUrl?: string
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
}

function findImageUrl($: cheerio.CheerioAPI): string {
  const og = $('meta[property="og:image"]').attr('content')
  if (og) return og
  const tw = $('meta[name="twitter:image"], meta[property="twitter:image"]').attr('content')
  if (tw) return tw
  const itemprop = $('[itemprop="image"]')
  if (itemprop.length) {
    const src = itemprop.attr('src') || itemprop.attr('content')
    if (src) return src
    const img = itemprop.find('img').attr('src')
    if (img) return img
  }
  const selectors = [
    'main img[src]',
    'main picture img',
    'article img[src]',
    '[class*="hero"] img',
    '[class*="Hero"] img',
    '[class*="recipe"] img[src]',
    '[class*="Recipe"] img[src]',
    '[class*="allerhande"] img',
    '[class*="detail"] img',
  ]
  for (const sel of selectors) {
    const el = $(sel).first()
    const src = el.attr('src') || el.attr('data-src')
    if (src && !src.startsWith('data:') && src.length > 10) return src
  }
  const mainImg = $('main img, article img, [role="main"] img').first()
  const m = mainImg.attr('src') || mainImg.attr('data-src')
  if (m) return m
  return ''
}

function fromJsonLd($: cheerio.CheerioAPI, sourceUrl: string): ParsedRecipe | null {
  const scripts = $('script[type="application/ld+json"]')
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || '{}')
      const graphs = Array.isArray(data['@graph']) ? data['@graph'] : [data]
      for (const node of graphs) {
        const type = node['@type']
        const types = Array.isArray(type) ? type : type ? [type] : []
        if (!types.some((t: string) => t === 'Recipe' || t === 'https://schema.org/Recipe')) continue
        const name = node.name || node.headline
        const title = typeof name === 'string' ? name : (name && name['@value']) || ''
        const ingredients = normalizeStrings(node.recipeIngredient || [])
        const inst = node.recipeInstructions
        let instructions: string[] = []
        if (inst) {
          toArray(inst).forEach((step: { '@type'?: string; text?: string }) => {
            if (typeof step === 'string') instructions.push(step)
            else if (step?.['@type'] === 'HowToStep' && step.text) instructions.push(step.text)
            else if (step?.text) instructions.push(step.text)
          })
        }
        let imageUrl = ''
        const image = node.image
        if (typeof image === 'string') imageUrl = image
        else if (image?.url || image?.contentUrl) imageUrl = image.url || image.contentUrl
        else if (Array.isArray(image) && image[0]) {
          const first = image[0]
          imageUrl = typeof first === 'string' ? first : first?.url || first?.contentUrl || ''
        }
        if (!imageUrl) imageUrl = findImageUrl($)
        const prepMin = parseDuration(node.prepTime)
        const cookMin = parseDuration(node.cookTime)
        let servings = node.recipeYield ? parseInt(String(node.recipeYield).replace(/\D/g, ''), 10) : null
        if (servings === 0 || Number.isNaN(servings)) servings = null
        if (title && (ingredients.length > 0 || instructions.length > 0)) {
          return {
            title,
            ingredients,
            instructions,
            sourceUrl,
            imageUrl: imageUrl || undefined,
            servings: servings ?? undefined,
            prepTimeMinutes: prepMin ?? undefined,
            cookTimeMinutes: cookMin ?? undefined,
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

function fromDom($: cheerio.CheerioAPI, sourceUrl: string): ParsedRecipe | null {
  const text = (el: cheerio.Cheerio<cheerio.Element>) => (el.length ? (el.text() || '').trim() : '')
  const h1 = $('h1').first()
  const recipeTitle = $('[class*="recipe"] [class*="title"]').first()
  const ogTitle = $('meta[property="og:title"]').attr('content')
  const title =
    text(h1) || text(recipeTitle) || ogTitle || $('title').text() || ''
  const ingSelectors = [
    '[class*="ingredient"] li',
    '[class*="ingredients"] li',
    '[itemprop="recipeIngredient"]',
    '.wprm-recipe-ingredient',
    '.recipe-ingredients li',
    '[data-ingredient]',
  ]
  let ingredients: string[] = []
  for (const sel of ingSelectors) {
    const nodes = $(sel)
    if (nodes.length >= 2 && nodes.length <= 150) {
      ingredients = nodes
        .map((_, el) => text($(el)))
        .get()
        .filter((s) => s.length > 1 && s.length < 300)
      if (ingredients.length >= 2) break
    }
  }
  const instSelectors = [
    '[class*="instruction"] li',
    '[class*="directions"] li',
    '[class*="steps"] li',
    '[itemprop="recipeInstructions"] li',
    '[itemprop="recipeInstructions"] p',
    '.wprm-recipe-instruction-text',
    '.recipe-steps li',
    'ol li',
  ]
  let instructions: string[] = []
  for (const sel of instSelectors) {
    const nodes = $(sel)
    if (nodes.length >= 1 && nodes.length <= 100) {
      instructions = nodes
        .map((_, el) => text($(el)))
        .get()
        .filter((s) => s.length > 5 && s.length < 1500)
      if (instructions.length >= 1) break
    }
  }
  const img = findImageUrl($)
  if (!title && ingredients.length === 0 && instructions.length === 0) return null
  return {
    title: title || 'Imported recipe',
    ingredients,
    instructions,
    sourceUrl,
    imageUrl: img || undefined,
  }
}

export async function GET(request: Request) {
  const origin = getOrigin(request)
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid url parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    })
  }
  try {
    const targetOrigin = new URL(targetUrl).origin
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
        Referer: targetOrigin + '/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    })
    if (!res.ok) {
      const isBlocked = res.status === 403 || res.status === 429
      const message = isBlocked
        ? `The recipe site blocked the request (${res.status}). Try opening the link in your browser, copy the recipe text, and use the Paste tab.`
        : `Failed to fetch: ${res.status}`
      return new Response(
        JSON.stringify({ error: message }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } }
      )
    }
    const html = await res.text()
    const $ = cheerio.load(html)
    const recipe = fromJsonLd($, targetUrl) || fromDom($, targetUrl)
    if (!recipe) {
      return new Response(
        JSON.stringify({ error: 'No recipe found on this page.' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin } }
      )
    }
    return new Response(JSON.stringify(recipe), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch or parse URL'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin },
    })
  }
}
