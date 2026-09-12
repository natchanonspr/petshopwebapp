const KEY = 'petshop_admin_data_v1'

const seed = {
  users: [
    { id: 1, customerId: 1, name: 'คุณสมชาย รักดี', phone: '081-234-5678', email: 'somchai@example.com', gender: 'ชาย', birthDate: '1995-06-15', addresses: [{ id: 1, recipient: 'คุณสมชาย รักดี', phone: '081-234-5678', detail: '99/9 หมู่ 1', subdistrict: 'คลองหนึ่ง', district: 'คลองหลวง', province: 'ปทุมธานี', postalCode: '12120', default: true }], status: 'active', orders: 8, lastActive: 'วันนี้ 14:30' },
    { id: 2, customerId: 2, name: 'คุณหญิงอร พงษ์ดี', phone: '089-888-9999', email: 'yingorn@example.com', gender: 'หญิง', birthDate: '1998-11-02', addresses: [{ id: 1, recipient: 'คุณหญิงอร พงษ์ดี', phone: '089-888-9999', detail: '88/8 หมู่ 5', subdistrict: 'บางเขน', district: 'เมืองนนทบุรี', province: 'นนทบุรี', postalCode: '11000', default: true }], status: 'active', orders: 12, lastActive: 'วันนี้ 13:12' },
    { id: 3, customerId: 3, name: 'คุณธนพล ใจดี', phone: '086-555-7678', email: 'thanapon@example.com', gender: 'ชาย', birthDate: '1992-03-28', addresses: [{ id: 1, recipient: 'คุณธนพล ใจดี', phone: '086-555-7678', detail: '55/5 หมู่ 2', subdistrict: 'ในเมือง', district: 'เมืองเชียงใหม่', province: 'เชียงใหม่', postalCode: '50200', default: true }], status: 'suspended', orders: 3, lastActive: 'เมื่อวาน' },
  ],
  products: [
    {
      id: 1, name: 'Royal Canin Adult 3kg', category: 'อาหารสุนัข', subtitle: 'อาหารสุนัขโตพันธุ์กลาง', price: 890, stock: 23, sold: 128,
      rating: '4.8', reviews: 234, badge: 'แนะนำ', icon: 'fa-bag-shopping',
      description: 'อาหารสุนัขสำหรับสุนัขโต สูตรครบถ้วนและสมดุล เหมาะสำหรับสุนัขโตพันธุ์กลาง ช่วยดูแลสุขภาพในทุกวัน',
      highlights: ['โปรตีนคุณภาพสูง', 'ช่วยดูแลสุขภาพ', 'เหมาะสำหรับสุนัขโต'],
      variants: [{ label: '1.5 kg', price: 520 }, { label: '3 kg', price: 890 }, { label: '10 kg', price: 2270 }], defaultSize: '3 kg',
    },
    {
      id: 2, name: 'Whiskas ทูน่าแซลมอน', category: 'อาหารแมว', subtitle: 'อาหารแมวรสทูน่าและแซลมอน', price: 30, stock: 120, sold: 120,
      rating: '4.6', reviews: 512, badge: 'ขายดี', icon: 'fa-fish', description: 'อาหารแมวรสอร่อยสำหรับมื้อประจำวัน พร้อมสารอาหารที่เหมาะสมสำหรับแมว',
      highlights: ['รสชาติถูกใจน้องแมว', 'มีสารอาหารจำเป็น', 'เหมาะสำหรับมื้อประจำวัน'],
    },
    {
      id: 3, name: 'JerHigh Chicken Stick 100 g', category: 'ขนมสุนัข', subtitle: 'ขนมสุนัขรสไก่', price: 120, stock: 15, sold: 115,
      rating: '4.8', reviews: 234, icon: 'fa-bone', description: 'ขนมสำหรับน้องหมา เหมาะสำหรับใช้เป็นรางวัลระหว่างวัน',
      highlights: ['รสชาติอร่อย', 'เหมาะเป็นขนมรางวัล', 'พกพาสะดวก'],
    },
    {
      id: 4, name: 'SmartHeart Gold 1.3 kg', category: 'อาหารสุนัข', subtitle: 'อาหารสุนัขสูตรคุณภาพ', price: 420, stock: 98, sold: 98,
      rating: '4.7', reviews: 167, icon: 'fa-bone', description: 'อาหารสุนัขสำหรับมื้อประจำวัน พร้อมสารอาหารที่จำเป็น',
      highlights: ['วัตถุดิบคุณภาพ', 'ดูแลสุขภาพประจำวัน', 'เหมาะสำหรับสุนัข'],
    },
  ],
  orders: [
    { id: '#PP-2024-0892', customer: 'คุณสมชาย รักดี', total: 1010, status: 'รอดำเนินการ', payment: 'ชำระแล้ว', shipping: 'ยังไม่จัดส่ง' },
    { id: '#PP-2024-0891', customer: 'คุณหญิงอร พงษ์ดี', total: 825, status: 'กำลังจัดส่ง', payment: 'ชำระแล้ว', shipping: 'TH123456789' },
    { id: '#PP-2024-0890', customer: 'คุณวิภา มานะ', total: 1250, status: 'จัดส่งแล้ว', payment: 'ชำระแล้ว', shipping: 'TH987654321' },
  ],
  coupons: [
    { id: 1, code: 'PET10', type: 'เปอร์เซ็นต์', value: 10, active: true },
    { id: 2, code: 'WELCOME50', type: 'บาท', value: 50, active: true },
  ],
  notifications: [],
  ai: { enabled: true, foodRules: ['อายุสัตว์', 'สายพันธุ์', 'น้ำหนัก', 'ข้อจำกัดด้านโภชนาการ'], nutrition: [] },
}

export function loadAdminData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (!saved) return JSON.parse(JSON.stringify(seed))
    const data = { ...seed, ...saved }
    data.users = (saved.users || seed.users).map((u, i) => ({ ...(seed.users[i] || {}), ...u, id: Number(u.id || i + 1), customerId: Number(u.customerId || u.id || i + 1), addresses: u.addresses || seed.users[i]?.addresses || [] }))
    data.products = (saved.products || seed.products).map((p) => {
      const base = seed.products.find(item => String(item.id) === String(p.id))
      if (!base) return p
      if (String(p.id) === '1' && p.name === 'Royal Canin Indoor Cat 2 kg') return { ...base, stock: p.stock ?? base.stock, sold: p.sold ?? base.sold }
      return { ...base, ...p }
    })
    return data
  } catch { return JSON.parse(JSON.stringify(seed)) }
}
export function saveAdminData(data) { localStorage.setItem(KEY, JSON.stringify(data)); window.dispatchEvent(new CustomEvent('petshop-admin-data-updated')); return data }
export function resetAdminData() { saveAdminData(JSON.parse(JSON.stringify(seed))); return loadAdminData() }
export function updateAdminData(mutator) { const data=loadAdminData(); mutator(data); return saveAdminData(data) }
export { KEY }
