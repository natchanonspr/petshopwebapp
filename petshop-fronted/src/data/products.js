export const products = [
  {
    id: 1,
    name: 'Royal Canin Adult 3kg',
    category: 'อาหารสุนัข',
    subtitle: 'อาหารสุนัขโตพันธุ์กลาง',
    rating: '4.8',
    reviews: 234,
    sold: 128,
    price: 890,
    description: 'อาหารสุนัขสำหรับสุนัขโต สูตรครบถ้วนและสมดุล เหมาะสำหรับสุนัขโตพันธุ์กลาง ช่วยดูแลสุขภาพในทุกวัน',
    highlights: ['โปรตีนคุณภาพสูง', 'ช่วยดูแลสุขภาพ', 'เหมาะสำหรับสุนัขโต'],
    variants: [{ label: '1.5 kg', price: 520 }, { label: '3 kg', price: 890 }, { label: '10 kg', price: 2270 }],
    defaultSize: '3 kg',
    badge: 'แนะนำ',
    icon: 'fa-bag-shopping',
  },
  {
    id: 2,
    name: 'Whiskas ทูน่าแซลมอน',
    category: 'อาหารแมว',
    subtitle: 'อาหารแมวรสทูน่าและแซลมอน',
    rating: '4.6',
    reviews: 512,
    sold: 120,
    price: 30,
    description: 'อาหารแมวรสอร่อยสำหรับมื้อประจำวัน พร้อมสารอาหารที่เหมาะสมสำหรับแมว',
    highlights: ['รสชาติถูกใจน้องแมว', 'มีสารอาหารจำเป็น', 'เหมาะสำหรับมื้อประจำวัน'],
    badge: 'ขายดี',
    icon: 'fa-fish',
  },
  {
    id: 3,
    name: 'อาหารสุนัข',
    category: 'อาหารสุนัข',
    subtitle: 'อาหารสุนัขคุณภาพสำหรับทุกวัน',
    rating: '4.8',
    reviews: 234,
    sold: 98,
    price: 800,
    description: 'อาหารสุนัขคุณภาพที่คัดสรรให้เหมาะกับการดูแลน้องหมาในทุกวัน',
    highlights: ['วัตถุดิบคุณภาพ', 'ช่วยดูแลสุขภาพ', 'เหมาะสำหรับสัตว์เลี้ยง'],
    icon: 'fa-bone',
  },
  {
    id: 4,
    name: 'ของเล่น',
    category: 'ของเล่น',
    subtitle: 'ของเล่นสำหรับสัตว์เลี้ยง',
    rating: '4.7',
    reviews: 167,
    sold: 76,
    price: 150,
    description: 'ของเล่นช่วยให้น้อง ๆ ได้ออกกำลังกายและใช้เวลาว่างอย่างสนุกสนาน',
    highlights: ['ช่วยให้สัตว์เลี้ยงเพลิดเพลิน', 'เหมาะสำหรับเวลาเล่น', 'ออกแบบสำหรับสัตว์เลี้ยง'],
    badge: 'ลด 20%',
    badgeType: 'sale',
    icon: 'fa-baseball',
  },
  {
    id: 5,
    name: 'ขนมแมวเลีย รสทูน่า',
    category: 'ขนมแมว',
    subtitle: 'ขนมแมวเลียสำหรับเป็นรางวัล',
    rating: '4.9',
    reviews: 326,
    sold: 245,
    price: 59,
    description: 'ขนมแมวเลียรสทูน่า เนื้อนุ่ม ทานง่าย เหมาะสำหรับให้เป็นรางวัลระหว่างวัน',
    highlights: ['เนื้อนุ่ม ทานง่าย', 'รสทูน่าที่แมวชื่นชอบ', 'เหมาะสำหรับเป็นรางวัล'],
    badge: 'ขายดี',
    icon: 'fa-fish',
  },
  {
    id: 6,
    name: 'ขนมขัดฟันสุนัข',
    category: 'ขนมสุนัข',
    subtitle: 'ขนมสำหรับดูแลช่องปาก',
    rating: '4.7',
    reviews: 184,
    sold: 143,
    price: 129,
    description: 'ขนมขัดฟันสำหรับสุนัข ช่วยให้น้องหมาเพลิดเพลินพร้อมดูแลช่องปากในทุกวัน',
    highlights: ['ช่วยดูแลช่องปาก', 'เหมาะสำหรับสุนัข', 'เคี้ยวเพลิน'],
    icon: 'fa-bone',
  },
  {
    id: 7,
    name: 'ทรายแมวเต้าหู้ 7L',
    category: 'ทรายแมว',
    subtitle: 'ทรายแมวเต้าหู้ จับตัวเป็นก้อน',
    rating: '4.8',
    reviews: 271,
    sold: 198,
    price: 249,
    description: 'ทรายแมวเต้าหู้ จับตัวเป็นก้อนเร็ว ลดกลิ่นไม่พึงประสงค์ และทำความสะอาดง่าย',
    highlights: ['จับตัวเป็นก้อน', 'ช่วยลดกลิ่น', 'ทำความสะอาดง่าย'],
    badge: 'แนะนำ',
    icon: 'fa-box',
  },
  {
    id: 8,
    name: 'กระบะทรายแมว',
    category: 'อุปกรณ์',
    subtitle: 'กระบะทรายสำหรับแมว ขนาดใหญ่',
    rating: '4.6',
    reviews: 95,
    sold: 67,
    price: 390,
    description: 'กระบะทรายแมวดีไซน์เรียบง่าย ขนาดเหมาะสำหรับใช้งานในบ้าน',
    highlights: ['ทำความสะอาดง่าย', 'ขนาดกว้าง', 'เหมาะสำหรับใช้ในบ้าน'],
    icon: 'fa-box-open',
  },
  {
    id: 9,
    name: 'แชมพูอาบน้ำสัตว์เลี้ยง',
    category: 'ของใช้',
    subtitle: 'แชมพูสูตรอ่อนโยน',
    rating: '4.7',
    reviews: 143,
    sold: 88,
    price: 199,
    description: 'แชมพูสำหรับสัตว์เลี้ยง สูตรอ่อนโยน เหมาะสำหรับการอาบน้ำและดูแลขนเป็นประจำ',
    highlights: ['สูตรอ่อนโยน', 'ช่วยทำความสะอาดขน', 'เหมาะสำหรับสัตว์เลี้ยง'],
    icon: 'fa-pump-soap',
  },
  {
    id: 10,
    name: 'วิตามินบำรุงขนและผิวหนัง',
    category: 'สุขภาพ',
    subtitle: 'อาหารเสริมสำหรับสัตว์เลี้ยง',
    rating: '4.8',
    reviews: 119,
    sold: 74,
    price: 299,
    description: 'ผลิตภัณฑ์เสริมอาหารสำหรับสัตว์เลี้ยง เพื่อช่วยดูแลสุขภาพขนและผิวหนัง',
    highlights: ['ดูแลขนและผิวหนัง', 'ทานง่าย', 'เหมาะสำหรับสัตว์เลี้ยง'],
    icon: 'fa-heart-pulse',
  },
]

export function getProductsWithAdminOverrides() {
  if (typeof window === 'undefined') return products
  try {
    const saved = JSON.parse(localStorage.getItem('petshop_admin_data_v1') || 'null')
    const adminProducts = Array.isArray(saved?.products) ? saved.products : []
    if (!adminProducts.length) return products
    const merged = products
      .filter((product) => {
        const admin = adminProducts.find((item) => String(item.id) === String(product.id))
        return !admin || admin.deleted !== true
      })
      .map((product) => {
        const admin = adminProducts.find((item) => String(item.id) === String(product.id))
        return admin ? { ...product, ...admin } : product
      })
    const extras = adminProducts.filter((item) => !products.some((product) => String(product.id) === String(item.id)) && item.deleted !== true)
    return [...merged, ...extras]
  } catch {
    return products
  }
}
