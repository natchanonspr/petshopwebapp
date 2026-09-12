export const STORE_STORAGE_KEY = 'petshop_store_profile_v1'
export const STORE_UPDATED_EVENT = 'petshop-store-updated'

export const DEFAULT_STORE = {
  name: 'PetShop ร้านเพื่อนสัตว์เลี้ยง',
  address: '99/9 ถนนพหลโยธิน ต.เวียง อ.เมืองพะเยา จ.พะเยา 56000',
  phone: '081-234-5678',
  taxId: '0105559999999',
  image: '',
}

export function getStoreProfile() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORE_STORAGE_KEY) || 'null')
    return { ...DEFAULT_STORE, ...(saved && typeof saved === 'object' ? saved : {}) }
  } catch {
    return { ...DEFAULT_STORE }
  }
}

export function saveStoreProfile(profile) {
  const next = { ...DEFAULT_STORE, ...profile }
  window.localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(STORE_UPDATED_EVENT))
  return next
}

export function getStoreLogoStyle(image) {
  return image ? { backgroundImage: `url(${image})` } : undefined
}
