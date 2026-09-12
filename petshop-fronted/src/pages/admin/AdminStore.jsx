import { Link } from 'react-router-dom'
import StoreProfileCard from '../../components/StoreProfileCard.jsx'

export default function AdminStore() {
  return <div className="space-y-5 pb-20 md:pb-6">
    <div>
      <div className="text-[10px] text-gray-400"><Link to="/home/admin" className="hover:text-violet-600">หน้าหลัก</Link> <i className="fa-solid fa-chevron-right mx-2 text-[8px]"/>ข้อมูลร้านค้า</div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><span className="rounded-lg bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-600">STORE MANAGEMENT</span><span className="text-[10px] text-gray-400">ตั้งค่าร้านค้า</span></div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">ข้อมูลร้านค้า</h1>
          <p className="mt-1 text-xs text-gray-400">จัดการข้อมูลร้าน โลโก้ และตรวจสอบรูปแบบใบเสร็จได้จากหน้าเดียว</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"><span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-emerald-500"><i className="fa-solid fa-circle-check text-[11px]"/></span><div><p className="text-[9px] font-bold text-gray-400">STORE STATUS</p><p className="text-[10px] font-extrabold text-gray-700">ข้อมูลร้านพร้อมใช้งาน</p></div></div>
      </div>
    </div>

    <StoreProfileCard />

    <section className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 md:p-5">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm"><i className="fa-solid fa-circle-info"/></span>
        <div>
          <h2 className="text-xs font-extrabold text-gray-800">ข้อมูลร้านค้าจะถูกนำไปใช้ที่ไหน?</h2>
          <p className="mt-1 text-[10px] leading-5 text-gray-500">ชื่อร้าน ที่อยู่ เบอร์โทรศัพท์ เลขประจำตัวผู้เสียภาษี และโลโก้ จะถูกเก็บเป็นข้อมูลร้านหลัก และซิงก์ไปยังใบเสร็จใน Order Success ของระบบโดยอัตโนมัติ</p>
        </div>
      </div>
    </section>
  </div>
}
