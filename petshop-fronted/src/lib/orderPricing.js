export const VAT_RATE = 0.07

const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  return Number(String(value ?? '').replace(/[฿,\s]/g, '')) || 0
}

export function calculateOrderPricing({ subtotal = 0, discount = 0, delivery = 0 } = {}) {
  const safeSubtotal = Math.max(0, toNumber(subtotal))
  const safeDiscount = Math.min(Math.max(0, toNumber(discount)), safeSubtotal)
  const safeDelivery = Math.max(0, toNumber(delivery))
  const afterDiscount = Math.max(0, safeSubtotal - safeDiscount)
  const total = afterDiscount + safeDelivery

  // Product prices in this prototype are treated as VAT-inclusive consumer prices.
  const vat = total > 0 ? total * VAT_RATE / (1 + VAT_RATE) : 0
  const beforeVat = total - vat

  return {
    subtotal: safeSubtotal,
    discount: safeDiscount,
    afterDiscount,
    delivery: safeDelivery,
    beforeVat,
    vat,
    total,
  }
}

export const formatBaht = (value) => `฿${Math.round(toNumber(value)).toLocaleString('th-TH')}`
