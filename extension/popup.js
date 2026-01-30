/**
 * This function is serialized and run in the recipe page context.
 * Must be self-contained (no outer references).
 */
function extractRecipeInPage() {
  function text(el) {
    if (!el) return '';
    return (el.textContent || '').trim();
  }
  function getImgUrl(el) {
    if (!el) return '';
    if (el.tagName === 'IMG') {
      return el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || '';
    }
    if (el.tagName === 'PICTURE') {
      var srcSet = el.querySelector('source[srcset]');
      if (srcSet && srcSet.getAttribute('srcset')) {
        var part = srcSet.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
        if (part) return part;
      }
      var img = el.querySelector('img');
      if (img) return img.getAttribute('src') || img.getAttribute('data-src') || '';
    }
    return '';
  }
  function findImageUrl() {
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg && ogImg.getAttribute('content')) return ogImg.getAttribute('content');
    var twImg = document.querySelector('meta[name="twitter:image"], meta[property="twitter:image"]');
    if (twImg && twImg.getAttribute('content')) return twImg.getAttribute('content');
    var itempropImg = document.querySelector('[itemprop="image"]');
    if (itempropImg) {
      var u = itempropImg.getAttribute('src') || itempropImg.getAttribute('content') || getImgUrl(itempropImg);
      if (u) return u;
    }
    var selectors = [
      'main img[src]', 'main picture img', 'article img[src]', '[class*="hero"] img', '[class*="Hero"] img',
      '[class*="recipe"] img[src]', '[class*="Recipe"] img[src]', '[class*="banner"] img', '[class*="Banner"] img',
      '[data-testid*="image"] img', '[data-testid*="Image"] img', '[class*="allerhande"] img', '[class*="detail"] img'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
        var u = getImgUrl(el) || (el.getAttribute && el.getAttribute('src'));
        if (u && u.indexOf('data:') !== 0 && u.length > 10) return u;
      }
    }
    var mainImg = document.querySelector('main img, article img, [role="main"] img');
    if (mainImg) {
      var u = getImgUrl(mainImg);
      if (u) return u;
    }
    var allImgs = document.querySelectorAll('img[src], img[data-src]');
    for (var j = 0; j < Math.min(allImgs.length, 20); j++) {
      var node = allImgs[j];
      if (node.closest && (node.closest('nav') || node.closest('footer'))) continue;
      var u = node.getAttribute('src') || node.getAttribute('data-src');
      if (u && u.indexOf('data:') !== 0 && u.length > 15) return u;
    }
    return '';
  }
  function parseDuration(str) {
    if (!str || typeof str !== 'string') return null;
    const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
    if (!match) return null;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
  }
  function toArray(val) {
    if (Array.isArray(val)) return val;
    if (val == null) return [];
    return [val];
  }
  function normalizeStrings(arr) {
    return toArray(arr)
      .map(function (x) {
        return typeof x === 'string' ? x : x && x['@language'] ? x['@language'] : '';
      })
      .filter(Boolean)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }
  function fromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const data = JSON.parse(scripts[i].textContent);
        const graphs = Array.isArray(data['@graph']) ? data['@graph'] : [data];
        for (let g = 0; g < graphs.length; g++) {
          const node = graphs[g];
          const type = node['@type'];
          const types = Array.isArray(type) ? type : type ? [type] : [];
          if (!types.some(function (t) {
            return t === 'Recipe' || t === 'https://schema.org/Recipe';
          })) continue;
          const name = node.name || node.headline;
          const title = typeof name === 'string' ? name : (name && name['@value']) || '';
          let ingredients = [];
          const ing = node.recipeIngredient;
          if (ing) ingredients = normalizeStrings(ing);
          let instructions = [];
          const inst = node.recipeInstructions;
          if (inst) {
            toArray(inst).forEach(function (step) {
              if (typeof step === 'string') instructions.push(step);
              else if (step['@type'] === 'HowToStep' && step.text) instructions.push(step.text);
              else if (step.text) instructions.push(step.text);
            });
          }
          let imageUrl = '';
          const image = node.image;
          if (typeof image === 'string') imageUrl = image;
          else if (image && (image.url || image.contentUrl)) imageUrl = image.url || image.contentUrl;
          else if (Array.isArray(image) && image[0]) {
            const first = image[0];
            imageUrl = typeof first === 'string' ? first : (first.url || first.contentUrl || '');
          }
          let prepMin = null, cookMin = null;
          if (node.prepTime) prepMin = parseDuration(node.prepTime);
          if (node.cookTime) cookMin = parseDuration(node.cookTime);
          let servings = node.recipeYield ? parseInt(String(node.recipeYield).replace(/\D/g, ''), 10) : null;
          if (servings === 0 || isNaN(servings)) servings = null;
          if (title && (ingredients.length > 0 || instructions.length > 0)) {
            if (!imageUrl) imageUrl = findImageUrl();
            return {
              title: title,
              ingredients: ingredients,
              instructions: instructions,
              sourceUrl: window.location.href,
              imageUrl: imageUrl || undefined,
              servings: servings || undefined,
              prepTimeMinutes: prepMin || undefined,
              cookTimeMinutes: cookMin || undefined
            };
          }
        }
      } catch (_) {}
    }
    return null;
  }
  function fromDom() {
    const h1 = document.querySelector('h1');
    const recipeTitle = document.querySelector('[class*="recipe"] [class*="title"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const title = text(h1) || text(recipeTitle) || (ogTitle ? ogTitle.getAttribute('content') : '') || document.title;
    const selectors = [
      '[class*="ingredient"] li', '[class*="ingredients"] li', '[itemprop="recipeIngredient"]',
      '.wprm-recipe-ingredient', '.recipe-ingredients li', '[data-ingredient]'
    ];
    let ingredients = [];
    for (let s = 0; s < selectors.length; s++) {
      const nodes = document.querySelectorAll(selectors[s]);
      if (nodes.length >= 2 && nodes.length <= 150) {
        ingredients = Array.from(nodes).map(function (el) { return text(el); }).filter(function (str) {
          return str.length > 1 && str.length < 300;
        });
        if (ingredients.length >= 2) break;
      }
    }
    const instSelectors = [
      '[class*="instruction"] li', '[class*="directions"] li', '[class*="steps"] li',
      '[itemprop="recipeInstructions"] li', '[itemprop="recipeInstructions"] p',
      '.wprm-recipe-instruction-text', '.recipe-steps li', 'ol li'
    ];
    let instructions = [];
    for (let s = 0; s < instSelectors.length; s++) {
      const nodes = document.querySelectorAll(instSelectors[s]);
      if (nodes.length >= 1 && nodes.length <= 100) {
        instructions = Array.from(nodes).map(function (el) { return text(el); }).filter(function (str) {
          return str.length > 5 && str.length < 1500;
        });
        if (instructions.length >= 1) break;
      }
    }
    const img = findImageUrl();
    if (!title && ingredients.length === 0 && instructions.length === 0) return null;
    return {
      title: title || 'Imported recipe',
      ingredients: ingredients,
      instructions: instructions,
      sourceUrl: window.location.href,
      imageUrl: img || undefined,
      servings: undefined,
      prepTimeMinutes: undefined,
      cookTimeMinutes: undefined
    };
  }
  const result = fromJsonLd() || fromDom();
  if (result) return result;
  return { error: 'No recipe found on this page.' };
}

const KLIEK_APP_ORIGINS = ['http://localhost:5173', 'http://localhost:4173'];

function getAppUrl() {
  return KLIEK_APP_ORIGINS[0];
}

function showStatus(el, type, message) {
  el.className = 'status ' + type;
  el.textContent = message;
  el.classList.remove('hidden');
}

document.getElementById('send').addEventListener('click', async function () {
  const btn = document.getElementById('send');
  const status = document.getElementById('status');
  btn.disabled = true;
  status.classList.add('hidden');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showStatus(status, 'error', 'No active tab.');
      btn.disabled = false;
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractRecipeInPage
    });

    const recipe = results && results[0] && results[0].result;
    if (!recipe) {
      showStatus(status, 'error', 'Could not get recipe from this page.');
      btn.disabled = false;
      return;
    }
    if (recipe.error) {
      showStatus(status, 'error', recipe.error);
      btn.disabled = false;
      return;
    }

    const appUrl = getAppUrl();
    const appTabs = await chrome.tabs.query({ url: appUrl + '/*' });
    let appTabId = appTabs.length > 0 ? appTabs[0].id : null;

    if (!appTabId) {
      const newTab = await chrome.tabs.create({ url: appUrl });
      appTabId = newTab.id;
      await new Promise(function (resolve) {
        function listener(tabId, info) {
          if (tabId === appTabId && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(resolve, 400);
          }
        }
        chrome.tabs.onUpdated.addListener(listener);
        chrome.tabs.get(appTabId).then(function (t) {
          if (t.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(resolve, 400);
          }
        }).catch(function () {});
      });
    } else {
      await chrome.tabs.update(appTabId, { active: true });
    }

    await chrome.scripting.executeScript({
      target: { tabId: appTabId },
      func: function (recipeJson) {
        try {
          localStorage.setItem('kliek-pending-import', recipeJson);
          window.dispatchEvent(new CustomEvent('kliek-pending-import'));
        } catch (_) {}
      },
      args: [JSON.stringify(recipe)]
    });

    showStatus(status, 'success', 'Recipe sent to Kliek. Check the app tab.');
  } catch (err) {
    showStatus(status, 'error', err && err.message ? err.message : 'Something went wrong.');
  }
  btn.disabled = false;
});
