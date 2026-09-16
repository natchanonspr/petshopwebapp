import { Link } from 'react-router-dom'
import StoreProfileCard from '../../components/StoreProfileCard.jsx'

export default function AdminStore() {
  return <div className="space-y-4 pb-20 md:pb-6">
    <div>
      <div className="text-[10px] text-gray-400"><Link to="/home/admin" className="hover:text-violet-600">หน้าหลัก</Link> <i className="fa-solid fa-chevron-right mx-2 text-[8px]"/>ข้อมูลร้านค้า</div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">ข้อมูลร้านค้า</h1>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-500">
            <i className="fa-solid fa-circle-check text-[11px]"/>
            </span><div><p className="text-[9px] font-bold text-gray-400">STORE STATUS</p>
            <p className="text-[10px] font-extrabold text-gray-700">ข้อมูลร้านพร้อมใช้งาน</p></div></div>
      </div>
    </div>

    <StoreProfileCard />

    <section className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 md:p-5">
     
    </section>
  </div>
}
