const normalize = (value = '') => String(value)
  .toLowerCase()
  .normalize('NFKC')
  .replace(/[\u200B-\u200D\uFEFF]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, '')

const levenshtein = (a, b) => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    previous = current
  }
  return previous[b.length]
}

const similarity = (query, text) => {
  if (!query || !text) return 0
  if (text.includes(query)) return query.length / text.length + 0.55
  if (query.includes(text)) return text.length / query.length + 0.35

  const distance = levenshtein(query, text)
  return 1 - distance / Math.max(query.length, text.length)
}

const scoreText = (query, text) => {
  const value = normalize(text)
  if (!value) return 0
  const direct = similarity(query, value)
  if (query.length < 3) return direct >= 0.5 ? direct : 0

  // Compare short chunks too, so a typo inside a long product name still matches.
  let best = direct
  const windowSize = Math.min(value.length, Math.max(query.length + 2, query.length * 1.5))
  for (let start = 0; start + Math.min(query.length, value.length) <= value.length; start += 1) {
    const chunk = value.slice(start, start + windowSize)
    best = Math.max(best, similarity(query, chunk))
    if (best >= 1) break
  }
  return best
}

export function fuzzyProductScore(product, query) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return 1

  const fields = [
    { value: product.name, weight: 1 },
    { value: product.brand, weight: 0.92 },
    { value: product.category, weight: 0.82 },
    { value: product.subtitle, weight: 0.78 },
    ...(Array.isArray(product.tags) ? product.tags.map((value) => ({ value, weight: 0.76 })) : []),
  ]

  return Math.max(...fields.map(({ value, weight }) => scoreText(normalizedQuery, value) * weight), 0)
}

export function getProductSearchSuggestions(products, query, limit = 3) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []

  return products
    .map((product, index) => ({ product, index, score: fuzzyProductScore(product, normalizedQuery) }))
    .filter(({ score }) => score >= (normalizedQuery.length <= 3 ? 0.5 : 0.3))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ product }) => product)
}

export function fuzzyFilterProducts(products, query) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return products

  return products
    .map((product, index) => ({ product, index, score: fuzzyProductScore(product, normalizedQuery) }))
    .filter(({ score }) => {
      // Exact/substring matches always pass. For longer searches allow moderate typos.
      return score >= (normalizedQuery.length <= 3 ? 0.62 : 0.42)
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ product }) => product)
}
