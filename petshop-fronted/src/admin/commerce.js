import { loadAdminData, saveAdminData } from './data.js'
import { getOrders, saveOrders } from '../data/orders.js'
import { addNotification } from '../lib/notifications.js'

import { products as catalogProducts } from '../data/products.js'
import { logActivity } from './activity.js'

function findProduct(data, id) {
  let product = (data.products || []).find((item) => String(item.id) === String(id))
  if (!product) {
    const catalog = catalogProducts.find((item) => String(item.id) === String(id))
    if (catalog) {
      product = { ...catalog, stock: Number(catalog.stock ?? 999999), sold: Number(catalog.sold || 0) }
      data.products = [...(data.products || []), product]
    }
  }
  return product
}

export function reserveOrderStock(order) {
  const data = loadAdminData()
  const items = order?.products || order?.items || []
  const errors = []

  items.forEach((item) => {
    const product = findProduct(data, item.id)
    const qty = Math.max(1, Number(item.qty) || 1)
    if (!product) errors.push(`ไม่พบสินค้า #${item.id}`)
    else if (Number(product.stock || 0) < qty) errors.push(`${product.name} เหลือ ${product.stock || 0} ชิ้น`)
  })

  if (errors.length) return { ok: false, errors }
  items.forEach((item) => {
    const product = findProduct(data, item.id)
    const qty = Math.max(1, Number(item.qty) || 1)
    product.stock = Math.max(0, Number(product.stock || 0) - qty)
    product.sold = Number(product.sold || 0) + qty
  })
  order.inventoryApplied = true
  saveOrders(getOrders().map((item) => item.id === order.id ? { ...item, inventoryApplied: true } : item))
  const adminOrder = (data.orders || []).find((item) => String(item.id) === String(order.id))
  if (adminOrder) adminOrder.inventoryApplied = true
  saveAdminData(data)
  return { ok: true }
}

export function restoreOrderStock(order) {
  if (!order || order.inventoryApplied !== true || order.stockRestored) return { ok: true, skipped: true }
  const data = loadAdminData()
  const items = order.products || order.items || []
  items.forEach((item) => {
    const product = findProduct(data, item.id)
    const qty = Math.max(1, Number(item.qty) || 1)
    if (product) {
      product.stock = Number(product.stock || 0) + qty
      product.sold = Math.max(0, Number(product.sold || 0) - qty)
    }
  })
  const adminOrder = (data.orders || []).find((item) => String(item.id) === String(order.id))
  if (adminOrder) adminOrder.stockRestored = true
  saveAdminData(data)
  return { ok: true }
}

export function notifyOrderCreated(order) {
  return addNotification({
    audience: 'customer',
    type: 'order',
    icon: 'fa-circle-check',
    title: 'สั่งซื้อสำเร็จแล้ว 🎉',
    detail: `${order?.id || 'คำสั่งซื้อ'} ยอดชำระ ฿${Number(order?.total || 0).toLocaleString('th-TH')}`,
    orderId: order?.id,
  })
}

export function notifyOrderStatusChanged(order, previousStatus, previousPayment = order?.payment) {
  if (!order || (previousStatus === order.status && previousPayment === order.payment)) return null
  if (previousPayment !== order.payment && order.payment === 'ชำระแล้ว') {
    addNotification({ audience: 'customer', type: 'order', icon: 'fa-credit-card', title: 'ชำระเงินสำเร็จแล้ว 💳', detail: `${order.id || 'คำสั่งซื้อ'} ยอด ฿${Number(order.total || 0).toLocaleString('th-TH')}`, orderId: order.id })
  }
  if (previousStatus === order.status) return null
  const messages = {
    'กำลังจัดส่ง': 'คำสั่งซื้อของคุณกำลังจัดส่งแล้ว',
    'จัดส่งแล้ว': 'พัสดุของคุณถูกจัดส่งแล้ว',
    'สำเร็จ': 'คำสั่งซื้อของคุณสำเร็จแล้ว',
    'ยกเลิก': 'คำสั่งซื้อของคุณถูกยกเลิกแล้ว',
  }
  return addNotification({
    audience: 'customer',
    type: 'order',
    icon: order.status === 'ยกเลิก' ? 'fa-circle-xmark' : order.status === 'สำเร็จ' ? 'fa-circle-check' : 'fa-truck-fast',
    title: messages[order.status] || 'สถานะคำสั่งซื้อเปลี่ยนแปลง',
    detail: `${order.id || 'คำสั่งซื้อ'} · ${order.status}`,
    orderId: order.id,
  })
}

export function notifyPromotion(title, detail) {
  return addNotification({ audience: 'customer', type: 'promo', icon: 'fa-tag', title, detail })
}

export function notifyAdmin(title, detail) {
  return addNotification({ audience: 'admin', type: 'system', icon: 'fa-bullhorn', title, detail })
}
