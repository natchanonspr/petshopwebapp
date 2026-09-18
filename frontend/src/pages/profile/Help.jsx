import { useMemo, useRef, useState } from 'react'
import HomeHeader from '../../components/home/HomeHeader.jsx'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'

const HELP_ITEMS = [
  { icon: 'fa-circle-question', title: 'คำถามที่พบบ่อย', desc: 'รวมคำถามและคำตอบที่ลูกค้าถามบ่อย', tone: 'bg-orange-50 text-orange-500' },
  { icon: 'fa-cart-shopping', title: 'การสั่งซื้อสินค้า', desc: 'วิธีเลือกสินค้า เพิ่มลงตะกร้า และสั่งซื้อ', tone: 'bg-blue-50 text-blue-500' },
  { icon: 'fa-truck-fast', title: 'การจัดส่งสินค้า', desc: 'ข้อมูลการจัดส่งและการติดตามพัสดุ', tone: 'bg-emerald-50 text-emerald-500' },
  { icon: 'fa-credit-card', title: 'การชำระเงิน', desc: 'วิธีชำระเงินและข้อมูลการชำระค่าสินค้า', tone: 'bg-violet-50 text-violet-500' },
  { icon: 'fa-ticket', title: 'คูปองและส่วนลด', desc: 'วิธีใช้คูปองและโค้ดส่วนลด', tone: 'bg-pink-50 text-pink-500' },
]

const FAQS = [
  ['สั่งซื้อสินค้าอย่างไร?', 'เลือกสินค้าที่ต้องการ เพิ่มลงตะกร้า จากนั้นไปที่ตะกร้าและกดชำระเงิน'],
  ['ตรวจสอบสถานะคำสั่งซื้อได้ที่ไหน?', 'ไปที่เมนูประวัติ แล้วเลือกคำสั่งซื้อที่ต้องการดูรายละเอียด'],
  ['เปลี่ยนที่อยู่จัดส่งได้อย่างไร?', 'ไปที่โปรไฟล์ > ที่อยู่จัดส่ง แล้วเพิ่มหรือแก้ไขที่อยู่ที่ต้องการ'],
  ['สามารถเปลี่ยนวิธีชำระเงินได้ไหม?', 'ได้ ไปที่โปรไฟล์ > วิธีชำระเงิน เพื่อเพิ่ม แก้ไข หรือตั้งค่าวิธีชำระเงินหลัก'],
  ['จัดส่งสินค้าใช้เวลากี่วัน?', 'ระบบจะแสดงสถานะคำสั่งซื้อในหน้า ประวัติการสั่งซื้อ และสามารถกดดูรายละเอียดเพื่อดูข้อมูลการจัดส่งได้'],
  ['ใช้คูปองและโค้ดส่วนลดอย่างไร?', 'เลือกคูปองจากหน้า คูปองของฉัน หรือกรอกโค้ดในหน้าเช็กเอาต์ จากนั้นระบบจะคำนวณส่วนลดและสิทธิ์ส่งฟรีให้ตามเงื่อนไข'],
]

export default function Help() {
  const [open, setOpen] = useState(null)
  const [query, setQuery] = useState('')
  const [showContact, setShowContact] = useState(false)
  const faqRef = useRef(null)

  const handleTopic = (title) => {
    const queries = {
      'คำถามที่พบบ่อย': '',
      'การสั่งซื้อสินค้า': 'สั่งซื้อ',
      'การจัดส่งสินค้า': 'สถานะคำสั่งซื้อ',
      'การชำระเงิน': 'ชำระเงิน',
      'คูปองและส่วนลด': 'คูปอง',
    }
    setQuery(queries[title] ?? '')
    faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filteredFaqs = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return FAQS
    return FAQS.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(value))
  }, [query])

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <HomeHeader />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-500 via-orange-500 to-orange-400 p-5 text-white shadow-lg shadow-orange-500/20">
          <div className="flex items-center gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl">
              <i className="fa-solid fa-headset" />
            </div>
            <div>
              <p className="m-0 text-xs font-bold text-orange-100">PETSHOP SUPPORT</p>
              <h1 className="m-0 mt-1 text-xl font-extrabold leading-tight">มีอะไรให้เราช่วยไหม?</h1>
              <p className="m-0 mt-1 text-xs leading-5 text-orange-50">ค้นหาคำตอบเกี่ยวกับการใช้งาน PetShop ได้ที่นี่</p>
            </div>
          </div>

          <label className="relative mt-4 block">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-300" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาคำถามที่ต้องการ..."
              className="h-12 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/60"
            />
          </label>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-base font-extrabold text-gray-900">หัวข้อช่วยเหลือ</h2>
            <span className="text-xs font-medium text-gray-400">เลือกหัวข้อ</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {HELP_ITEMS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => handleTopic(item.title)}
                className={`flex min-h-[122px] flex-col items-start rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 active:scale-[0.98] ${index === 4 ? 'col-span-2 min-h-[92px] flex-row items-center' : ''}`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
                  <i className={`fa-solid ${item.icon}`} />
                </span>
                <span className={`${index === 4 ? 'ml-3' : 'mt-3'} min-w-0 flex-1`}>
                  <strong className="block text-sm font-extrabold text-gray-800">{item.title}</strong>
                  <small className="mt-1 block text-[11px] leading-5 text-gray-400">{item.desc}</small>
                </span>
                <i className={`${index === 4 ? 'ml-auto' : 'mt-2'} fa-solid fa-chevron-right text-[10px] text-gray-300`} />
              </button>
            ))}
          </div>
        </section>

        <section ref={faqRef} className="mt-7 scroll-mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-base font-extrabold text-gray-900">คำถามที่พบบ่อย</h2>
            <i className="fa-solid fa-circle-question text-sm text-orange-500" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            {filteredFaqs.length ? filteredFaqs.map(([question, answer]) => {
              const index = FAQS.findIndex(([item]) => item === question)
              const isOpen = open === index
              return (
                <div key={question} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left active:bg-gray-50"
                  >
                    <span className="text-sm font-bold text-gray-800">{question}</span>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full ${isOpen ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}`}>
                      <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {isOpen && <p className="m-0 px-4 pb-4 text-xs leading-6 text-gray-500">{answer}</p>}
                </div>
              )
            }) : (
              <div className="px-5 py-8 text-center text-xs text-gray-400">ไม่พบคำถามที่ตรงกับคำค้นหา</div>
            )}
          </div>
        </section>

        <section className="mt-6 mb-4 flex items-center gap-4 rounded-3xl border border-orange-100 bg-orange-50 p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-orange-500 shadow-sm">
            <i className="fa-solid fa-comments" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-sm font-extrabold text-gray-900">ยังไม่พบคำตอบ?</h2>
            <p className="m-0 mt-1 text-[11px] leading-5 text-gray-500">ติดต่อทีมช่วยเหลือของเราได้เลย</p>
          </div>
          <button type="button" onClick={() => setShowContact(true)} className="shrink-0 rounded-full bg-orange-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95">
            ติดต่อเรา
          </button>
        </section>
      </main>

      <BottomNavigation />

      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="help-contact-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowContact(false) }}>
          <div className="w-full max-w-[398px] rounded-[28px] bg-white p-5 shadow-2xl animate-[slideUp_220ms_ease-out]">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-headset text-xl" /></div>
            <h2 id="help-contact-title" className="mt-4 text-center text-base font-extrabold text-gray-900">ติดต่อทีมช่วยเหลือ</h2>
            <p className="mt-2 text-center text-xs leading-5 text-gray-500">เลือกวิธีที่ต้องการ แล้วเราจะเชื่อมต่อช่องทางจริงเมื่อระบบ Backend พร้อมใช้งาน</p>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => { setShowContact(false); setQuery(''); faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-sm font-bold text-white active:scale-95"><i className="fa-solid fa-circle-question" />ดูคำถามที่พบบ่อย</button>
              <button type="button" onClick={() => setShowContact(false)} className="h-11 w-full rounded-full bg-gray-100 text-sm font-bold text-gray-600 active:scale-95">ปิด</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  )
}
