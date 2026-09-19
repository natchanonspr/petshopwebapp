import { useEffect } from 'react'
import { getActiveCoupons } from '../api/coupons.js'

const CURRENT_USER_KEY = 'petshop_current_user_id'
const CUSTOMER_ID_KEY = 'petshop_customer_id'
const EXCLUDED_KEYS = new Set(['petshop_admin_data_v1', 'petshop_admin_data_backup_v1', 'petshop_admin_auth', 'petshop_thailand_geography_v2', 'petshop_checkout_discount'])

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    const value = JSON.parse(raw)
    return value ?? fallback
  } catch {
    return fallback
  }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function buildCustomerSnapshot() {
  const snapshot = {}
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    if (!key || EXCLUDED_KEYS.has(key) || !key.startsWith('petshop')) continue
    snapshot[key] = readJson(key, localStorage.getItem(key))
  }
  return snapshot
}

function findCustomer(profile) {
  const customerId = Number(profile.customerId || localStorage.getItem(CUSTOMER_ID_KEY) || 0)
  const currentId = Number(localStorage.getItem(CURRENT_USER_KEY) || 0)
  const email = normalize(profile.email)
  const phone = normalize(profile.phone)

  if (customerId) return { id: customerId }
  if (currentId) return { id: currentId }
  if (email || phone) return { id: customerId || currentId || null }

  return null
}

function syncCustomerSnapshot() {
  const profile = readJson('petshop_profile', {})
  const customer = findCustomer(profile)
  if (!customer) return

  const canonicalId = Number(customer.id || 0)
  if (!canonicalId) return

  try {
    localStorage.setItem(CUSTOMER_ID_KEY, String(canonicalId))
    localStorage.setItem(CURRENT_USER_KEY, String(canonicalId))
  } catch {}

  buildCustomerSnapshot()
}

export default function AdminUserSync() {
  useEffect(() => {
    const sync = () => {
      try {
        syncCustomerSnapshot()
      } catch {}
    }

    sync()

    const events = [
      'storage',
      'petshop-profile-updated',
      'petshop-address-updated',
      'petshop-payment-updated',
      'petshop-pets-updated',
      'petshop-favorites-updated',
      'petshop-orders-updated',
      'petshop:notifications'
    ]

    events.forEach(event => window.addEventListener(event, sync))
    const timer = window.setInterval(sync, 1000)

    const checkCoupons = () => {
      const token = localStorage.getItem('petshop_token')
      if (!token) return

      getActiveCoupons()
        .catch(() => {})
    }

    checkCoupons()
    const couponTimer = window.setInterval(checkCoupons, 60000)

    return () => {
      events.forEach(event => window.removeEventListener(event, sync))
      window.clearInterval(timer)
      window.clearInterval(couponTimer)
    }
  }, [])

  return null
}
