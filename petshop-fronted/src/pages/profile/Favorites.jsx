import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import ShopProductCard from '../../components/products/ShopProductCard.jsx'
import { FAVORITES_KEY, FAVORITES_UPDATED_EVENT } from '../../components/products/FavoriteButton.jsx'

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export default function Favorites() {
  const [favorites, setFavorites] = useState(readFavorites)
  const [showClearModal, setShowClearModal] = useState(false)

  useEffect(() => {
    const sync = () => setFavorites(readFavorites())
    window.addEventListener(FAVORITES_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="relative z-20 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-4 pb-4 pt-5 shadow-[0_3px_12px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <Link to="/profile" aria-label="กลับโปรไฟล์" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-700 transition active:scale-90"><i className="fa-solid fa-arrow-left text-[17px]" /></Link>
          <div className="text-center"><h1 className="m-0 text-[18px] font-extrabold text-gray-900">รายการโปรด</h1><p className="m-0 mt-0.5 text-[10px] text-gray-400">สินค้าที่คุณถูกใจ</p></div>
          <span className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-heart text-[17px]" /></span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {favorites.length > 0 ? (
          <>
            <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="m-0 text-lg font-bold text-gray-900">สินค้าที่ชอบ</h2><span className="text-sm text-gray-400">{favorites.length} รายการ</span></div><button type="button" onClick={() => setShowClearModal(true)} className="shrink-0 rounded-full bg-gray-100 px-3 py-2 text-[11px] font-bold text-gray-500 active:scale-95">ล้างทั้งหมด</button></div>
            <div className="grid grid-cols-2 gap-4 max-[380px]:gap-3 max-[340px]:gap-2">{favorites.map((product) => <ShopProductCard key={product.id} product={product} />)}</div>
          </>
        ) : (
          <div className="flex min-h-[65vh] flex-col items-center justify-center rounded-3xl bg-white px-6 text-center shadow-sm">
            <div className="grid size-20 place-items-center rounded-full bg-orange-50 text-orange-400"><i className="fa-regular fa-heart text-3xl" /></div>
            <h2 className="mt-4 text-base font-extrabold text-gray-900">ยังไม่มีรายการโปรด</h2>
            <p className="mt-1 max-w-[260px] text-xs leading-5 text-gray-400">กดหัวใจบนสินค้าที่ชอบ เพื่อเก็บไว้ดูและเลือกซื้อภายหลัง</p>
            <Link to="/products" className="mt-5 flex h-11 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white shadow-sm shadow-orange-500/20 active:scale-95">ไปเลือกสินค้า</Link>
          </div>
        )}
      </main>
      <BottomNavigation />

      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-5 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="clear-favorites-title">
          <div className="w-full max-w-[360px] rounded-[28px] bg-white p-5 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
              <i className="fa-solid fa-heart-crack text-2xl" />
            </div>
            <h2 id="clear-favorites-title" className="mt-4 text-lg font-extrabold text-gray-900">ล้างรายการโปรดทั้งหมด?</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">สินค้าที่บันทึกไว้ทั้งหมดจะถูกนำออกจากรายการโปรด คุณสามารถเพิ่มกลับได้ภายหลัง</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setShowClearModal(false)} className="h-11 rounded-2xl bg-gray-100 text-sm font-bold text-gray-600 active:scale-[0.98]">ยกเลิก</button>
              <button type="button" onClick={() => { localStorage.setItem(FAVORITES_KEY, '[]'); window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT)); setFavorites([]); setShowClearModal(false) }} className="h-11 rounded-2xl bg-red-500 text-sm font-bold text-white shadow-sm shadow-red-500/20 active:scale-[0.98]">ล้างทั้งหมด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
