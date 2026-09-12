export const ORDERS_STORAGE_KEY = 'petshop_orders'
export const ORDERS_UPDATED_EVENT = 'petshop-orders-updated'

export const defaultOrders = [
  {
    id: '#ORD-20231015-01', date: '15 ต.ค. 2023, 10:20 น.', status: 'รอดำเนินการ', tone: 'pending',
    name: 'Royal Canin อาหารสุนัขพันธุ์เล็ก', qty: 3, items: '+ อีก 2 รายการ', total: 1250, icon: 'fa-bag-shopping',
    subtotal: 1290, discount: 80, discountCode: 'PET80', delivery: 40,
    address: { name: 'กระเทียม เจียว', phone: '0812345678', address: '99/9 ถนนพหลโยธิน', subdistrict: 'เวียง', district: 'เมืองพะเยา', province: 'พะเยา', postalCode: '56000' },
    paymentMethod: { name: 'เก็บเงินปลายทาง' },
    products: [
      { id: 1, name: 'Royal Canin Adult 3kg', price: 890, qty: 1, icon: 'fa-bag-shopping' },
      { id: 2, name: 'Whiskas ทูน่าแซลมอน', price: 30, qty: 2, icon: 'fa-fish' },
    ],
  },
  {
    id: '#ORD-20231012-42', date: '12 ต.ค. 2023, 14:15 น.', status: 'กำลังจัดส่ง', tone: 'shipping',
    name: 'ของเล่นแมว บอลตกแต่ง 3 ชิ้น', qty: 1, items: '', total: 890, icon: 'fa-fish',
    subtotal: 850, discount: 0, discountCode: '', delivery: 40,
    address: { name: 'กระเทียม เจียว', phone: '0812345678', address: '99/9 ถนนพหลโยธิน', subdistrict: 'เวียง', district: 'เมืองพะเยา', province: 'พะเยา', postalCode: '56000' },
    paymentMethod: { name: 'พร้อมเพย์', last4: '5678' },
    products: [{ id: 4, name: 'ของเล่น', price: 850, qty: 1, icon: 'fa-baseball' }],
  },
  {
    id: '#ORD-20230928-11', date: '28 ก.ย. 2023, 09:45 น.', status: 'สำเร็จ', tone: 'success',
    name: 'เครื่องให้อาหารอัตโนมัติ Smart Feeder', qty: 1, items: '', total: 2500, icon: 'fa-box-open',
    subtotal: 2460, discount: 0, discountCode: '', delivery: 40,
    address: { name: 'กระเทียม เจียว', phone: '0812345678', address: '99/9 ถนนพหลโยธิน', subdistrict: 'เวียง', district: 'เมืองพะเยา', province: 'พะเยา', postalCode: '56000' },
    paymentMethod: { name: 'บัตรเครดิต / เดบิต', last4: '4242' },
    products: [{ id: 5, name: 'เครื่องให้อาหารอัตโนมัติ Smart Feeder', price: 2460, qty: 1, icon: 'fa-box-open' }],
  },
]

export function getOrders() {
  try {
    const saved = window.localStorage.getItem(ORDERS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultOrders
  } catch {
    return defaultOrders
  }
}

export function saveOrders(orders) {
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT))
  window.dispatchEvent(new Event('petshop-orders-updated'))
}

function getCurrentCustomerId() {
  const raw = window.localStorage.getItem('petshop_customer_id') || window.localStorage.getItem('petshop_current_user_id')
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function createOrder({ items, address, paymentMethod, subtotal, discount, discountCode, delivery, total }) {
  const orders = getOrders()
  const now = new Date()
  const id = `#ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-4)}`
  const first = items[0]
  const customerId = getCurrentCustomerId()

  const order = {
    id,
    userId: customerId,
    customerId,
    createdAt: now.toISOString(),
    date: now.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
    status: 'รอดำเนินการ',
    tone: 'pending',
    name: first?.name || 'สินค้า PetShop',
    qty: items.reduce((sum, item) => sum + item.qty, 0),
    items: items.length > 1 ? `+ อีก ${items.length - 1} รายการ` : '',
    total,
    icon: first?.icon || 'fa-box',
    address,
    paymentMethod,
    subtotal,
    discount,
    discountCode: discountCode || '',
    delivery,
    products: items,
  }

  saveOrders([order, ...orders])
  return order
}
