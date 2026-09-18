import { Link } from 'react-router-dom'

export default function AIRecommendation() {
  return (
    <section className="relative mb-8 flex min-h-40 items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-600/15">
      <div className="absolute -right-10 -top-12 size-32 rounded-full bg-white/10 blur-xl" />
      <div className="absolute bottom-[-42px] right-8 size-20 rounded-full bg-white/10 blur-lg" />
      <div className="relative z-10 w-[68%]">
        <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold">
          <i className="fa-solid fa-robot" /> AI ฟีเจอร์ใหม่
        </span>
        <h2 className="m-0 text-lg font-bold leading-tight">การแนะนำอาหารโดย AI</h2>
        <p className="m-0 text-xs leading-snug text-white/90">รับคำแนะนำสำหรับสัตว์เลี้ยงของคุณ</p>
        <Link to="/recommendation" className="relative z-20 mt-3 inline-flex min-h-9 min-w-[86px] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-bold !text-black shadow-sm"><span className="!text-black">ลองเลย</span><i className="fa-solid fa-arrow-right !text-black" /></Link>
      </div>
      <div className="relative z-10 w-[76px] text-center text-[46px] drop-shadow-md">
        <i className="fa-solid fa-wand-magic-sparkles" />
      </div>
    </section>
  )
}
