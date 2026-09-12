import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAdminData, saveAdminData } from '../../admin/data.js'

const AI_KEY = 'petshop_ai_management_v1'
const DEFAULT_AI = {
  enabled: true,
  provider: 'gemini',
  autoReview: true,
  rules: [
    { id: 1, label: 'อายุสัตว์', description: 'ใช้ช่วงอายุในการคัดเลือกอาหาร', enabled: true },
    { id: 2, label: 'สายพันธุ์', description: 'ใช้สายพันธุ์และขนาดตัวในการวิเคราะห์', enabled: true },
    { id: 3, label: 'น้ำหนัก', description: 'คำนวณความเหมาะสมจากน้ำหนักตัว', enabled: true },
    { id: 4, label: 'ข้อจำกัดด้านโภชนาการ', description: 'หลีกเลี่ยงส่วนผสมที่ไม่เหมาะสม', enabled: true },
    { id: 5, label: 'ประวัติการซื้อ', description: 'ใช้พฤติกรรมการซื้อเพื่อปรับ Recommendation', enabled: true },
  ],
  nutrition: [
    { id: 1, pet: 'แมว', category: 'อาหารทั่วไป', protein: '30%', fat: '12%', note: 'เหมาะสำหรับแมวโตทั่วไป' },
    { id: 2, pet: 'สุนัข', category: 'อาหารทั่วไป', protein: '24%', fat: '12%', note: 'เหมาะสำหรับสุนัขโตทั่วไป' },
    { id: 3, pet: 'แมว', category: 'ควบคุมน้ำหนัก', protein: '35%', fat: '9%', note: 'เน้นโปรตีนและควบคุมพลังงาน' },
  ],
  recommendations: [
    { id: 1, date: 'วันนี้ 14:25', customer: 'ลูกค้าตัวอย่าง', provider: 'Gemini', result: 'แนะนำอาหารแมวโต', correct: null },
    { id: 2, date: 'วันนี้ 12:10', customer: 'ลูกค้าตัวอย่าง', provider: 'Gemini', result: 'แนะนำอาหารควบคุมน้ำหนัก', correct: true },
    { id: 3, date: 'เมื่อวาน 18:40', customer: 'ลูกค้าตัวอย่าง', provider: 'Luna', result: 'แนะนำอาหารสุนัขโต', correct: false },
  ],
}

function readAI() {
  try {
    const saved = JSON.parse(localStorage.getItem(AI_KEY) || 'null')
    if (!saved) return structuredClone(DEFAULT_AI)
    return { ...structuredClone(DEFAULT_AI), ...saved, rules: saved.rules || DEFAULT_AI.rules, nutrition: saved.nutrition || [], recommendations: saved.recommendations || [] }
  } catch { return structuredClone(DEFAULT_AI) }
}

function persistAI(next) {
  localStorage.setItem(AI_KEY, JSON.stringify(next))
  const data = loadAdminData()
  saveAdminData({ ...data, ai: { ...data.ai, enabled: next.enabled, provider: next.provider, foodRules: next.rules.filter(r => r.enabled).map(r => r.label) } })
}

const providerInfo = {
  luna: { name: 'Luna', icon: 'fa-moon', description: 'เหมาะสำหรับการทดลองระบบ AI ของ PetShop และสามารถเปลี่ยนภายหลังได้' },
  gemini: { name: 'Gemini', icon: 'fa-g', description: 'ตัวเลือกสำหรับงาน Recommendation และการวิเคราะห์ข้อมูล' },
}

export default function AdminSettings() {
  const [ai, setAI] = useState(readAI)
  const [tab, setTab] = useState('overview')
  const [nutritionForm, setNutritionForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const refresh = () => setAI(readAI())
    window.addEventListener('storage', refresh)
    window.addEventListener('petshop-admin-data-updated', refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('petshop-admin-data-updated', refresh) }
  }, [])

  const update = (patch) => { const next = { ...ai, ...patch }; setAI(next); persistAI(next) }
  const toggleRule = (id) => update({ rules: ai.rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) })
  const review = (id, correct) => update({ recommendations: ai.recommendations.map(r => r.id === id ? { ...r, correct } : r) })
  const removeNutrition = (id) => update({ nutrition: ai.nutrition.filter(x => x.id !== id) })
  const saveNutrition = (form) => {
    const item = { ...form, id: form.id || Date.now() }
    update({ nutrition: form.id ? ai.nutrition.map(x => x.id === form.id ? item : x) : [item, ...ai.nutrition] })
    setNutritionForm(null)
  }

  const enabledRuleCount = ai.rules.filter(r => r.enabled).length

  const accuracy = useMemo(() => {
    const reviewed = ai.recommendations.filter(r => typeof r.correct === 'boolean')
    if (!reviewed.length) return 0
    return Math.round((reviewed.filter(r => r.correct).length / reviewed.length) * 100)
  }, [ai.recommendations])
  const correctCount = ai.recommendations.filter(r => r.correct === true).length
  const wrongCount = ai.recommendations.filter(r => r.correct === false).length

  const selectProvider = (provider) => {
    setSaving(true)
    const next = { ...ai, provider }
    setAI(next)
    persistAI(next)
    window.setTimeout(() => setSaving(false), 350)
  }

  return <div className="space-y-5 pb-20 md:pb-6">
    <div>
      <div className="text-xs text-gray-400"><Link to="/home/admin">หน้าหลัก</Link> <i className="fa-solid fa-chevron-right mx-1 text-[9px]"/>AI Management</div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-extrabold">AI Management</h1><p className="mt-1 text-sm text-gray-400">จัดการผู้ให้บริการ AI, เงื่อนไข Recommendation และตรวจสอบความแม่นยำ</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${ai.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{ai.enabled ? '● AI เปิดใช้งาน' : '○ AI ปิดใช้งาน'}</span></div>
    </div>

    <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200"><i className="fa-solid fa-wand-magic-sparkles text-xl"/></div><div className="min-w-[220px] flex-1"><h2 className="text-lg font-extrabold">PetShop AI</h2><p className="mt-1 text-xs text-gray-500">เลือก AI Provider ที่จะใช้กับระบบ Recommendation โดยไม่ผูกระบบกับผู้ให้บริการรายเดียว</p></div><button onClick={() => update({ enabled: !ai.enabled })} className={`rounded-xl px-4 py-2.5 text-xs font-bold ${ai.enabled ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{ai.enabled ? 'ปิดใช้งาน AI' : 'เปิดใช้งาน AI'}</button></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {Object.entries(providerInfo).map(([key, info]) => <button key={key} onClick={() => selectProvider(key)} className={`rounded-2xl border p-4 text-left transition ${ai.provider === key ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100' : 'border-gray-200 bg-white hover:border-violet-200'}`}><div className="flex items-center gap-3"><span className={`grid size-11 place-items-center rounded-xl ${ai.provider === key ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}><i className={`fa-solid ${info.icon}`}/></span><div className="flex-1"><div className="text-sm font-extrabold">{info.name}</div><div className="mt-0.5 text-xs text-gray-400">{info.description}</div></div>{ai.provider === key && <i className="fa-solid fa-circle-check text-violet-600"/>}</div></button>)}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs text-gray-500"><i className="fa-solid fa-circle-info text-violet-500"/> Provider ปัจจุบัน: <b className="text-gray-800">{providerInfo[ai.provider]?.name || 'ยังไม่เลือก'}</b>{saving && <span className="ml-auto text-violet-500">กำลังบันทึก...</span>}</div>
    </section>

    <div className="flex gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">{[['overview','ภาพรวม'],['rules','เงื่อนไขวิเคราะห์'],['nutrition','ฐานโภชนาการ'],['recommendations','Recommendation']].map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${tab === key ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{label}</button>)}</div>

    {tab === 'overview' && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon="fa-bolt" label="AI Provider" value={providerInfo[ai.provider]?.name || '-'}/><Metric icon="fa-list-check" label="เงื่อนไขที่เปิด" value={`${enabledRuleCount}/${ai.rules.length}`}/><Metric icon="fa-database" label="ข้อมูลโภชนาการ" value={ai.nutrition.length}/><Metric icon="fa-bullseye" label="Accuracy" value={`${accuracy}%`}/><section className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-extrabold">สถิติการใช้งาน AI</h2><p className="mt-1 text-xs text-gray-400">ข้อมูลจาก Recommendation ที่ Admin ตรวจสอบแล้ว</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">ทั้งหมด {ai.recommendations.length} ครั้ง</span></div><div className="mt-4 grid gap-3 md:grid-cols-3"><Stat label="Recommendation" value={ai.recommendations.length} icon="fa-wand-magic-sparkles"/><Stat label="ตรวจถูกต้อง" value={correctCount} icon="fa-circle-check"/><Stat label="ตรวจไม่ถูกต้อง" value={wrongCount} icon="fa-circle-xmark"/></div></section></div>}

    {tab === 'rules' && <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-base font-extrabold">เงื่อนไขวิเคราะห์อาหาร</h2><p className="mt-1 text-xs text-gray-400">กำหนดข้อมูลที่ AI ต้องนำมาพิจารณาก่อน Recommendation</p></div><span className="text-xs font-bold text-violet-600">เปิด {ai.rules.filter(r => r.enabled).length} รายการ</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{ai.rules.map(rule => <div key={rule.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-4"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><i className="fa-solid fa-sliders"/></span><div className="flex-1"><div className="text-sm font-bold">{rule.label}</div><p className="mt-1 text-xs text-gray-400">{rule.description}</p></div><button onClick={() => toggleRule(rule.id)} className={`h-6 w-11 rounded-full p-1 transition ${rule.enabled ? 'bg-violet-600' : 'bg-gray-200'}`}><span className={`block size-4 rounded-full bg-white transition ${rule.enabled ? 'translate-x-5' : ''}`}/></button></div>)}</div></section>}

    {tab === 'nutrition' && <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-extrabold">ฐานข้อมูลโภชนาการสัตว์</h2><p className="mt-1 text-xs text-gray-400">ข้อมูลอ้างอิงสำหรับระบบ Recommendation</p></div><button onClick={() => setNutritionForm({ pet: 'แมว', category: '', protein: '', fat: '', note: '' })} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white"><i className="fa-solid fa-plus mr-2"/>เพิ่มข้อมูล</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b border-gray-100 text-gray-400"><th className="px-3 py-3">สัตว์</th><th>หมวด</th><th>โปรตีน</th><th>ไขมัน</th><th>หมายเหตุ</th><th className="text-right">จัดการ</th></tr></thead><tbody>{ai.nutrition.map(item => <tr key={item.id} className="border-b border-gray-50"><td className="px-3 py-3 font-bold">{item.pet}</td><td>{item.category || '-'}</td><td>{item.protein || '-'}</td><td>{item.fat || '-'}</td><td className="text-gray-500">{item.note || '-'}</td><td className="text-right"><button onClick={() => setNutritionForm(item)} className="mr-2 rounded-lg bg-gray-50 px-2.5 py-1.5 font-bold text-gray-500">แก้ไข</button><button onClick={() => removeNutrition(item.id)} className="rounded-lg bg-red-50 px-2.5 py-1.5 font-bold text-red-500">ลบ</button></td></tr>)}</tbody></table></div></section>}

    {tab === 'recommendations' && <RecommendationHistory recommendations={ai.recommendations} onReview={review} correctCount={correctCount} wrongCount={wrongCount}/>}

    {nutritionForm && <NutritionModal form={nutritionForm} onClose={() => setNutritionForm(null)} onSave={saveNutrition}/>} 
  </div>
}

function RecommendationHistory({ recommendations, onReview, correctCount, wrongCount }) {
  const [filter, setFilter] = useState('all')
  const filtered = recommendations.filter((item) => filter === 'all' || (filter === 'reviewed' ? typeof item.correct === 'boolean' : item.correct === false))
  return <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-base font-extrabold">ประวัติ AI Recommendation</h2><p className="mt-1 text-xs text-gray-400">ดูข้อมูลที่ AI ใช้วิเคราะห์ สินค้าที่เลือก และตรวจสอบความถูกต้อง</p></div>
      <div className="flex gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">ถูก {correctCount}</span><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">ผิด {wrongCount}</span></div>
    </div>
    <div className="mt-4 flex gap-2"><button onClick={() => setFilter('all')} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === 'all' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>ทั้งหมด</button><button onClick={() => setFilter('reviewed')} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === 'reviewed' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>ตรวจแล้ว</button><button onClick={() => setFilter('wrong')} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === 'wrong' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}>ต้องปรับปรุง</button></div>
    <div className="mt-4 space-y-3">
      {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400"><i className="fa-solid fa-robot mb-2 text-2xl text-gray-300"/><div>ยังไม่มีรายการในหมวดนี้</div></div>}
      {filtered.map(item => <div key={item.id} className="rounded-2xl border border-gray-100 p-4 transition hover:border-violet-100 hover:bg-violet-50/20">
        <div className="flex flex-wrap items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><i className="fa-solid fa-robot"/></span><div className="min-w-[220px] flex-1"><div className="text-sm font-extrabold">{item.result}</div><div className="mt-1 text-xs text-gray-400">{item.customer} · {item.date} · Provider {item.provider}</div><div className="mt-3 flex flex-wrap gap-1.5">{(item.rules || []).map(rule => <span key={rule} className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500">{rule}</span>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-3"><Info label="สัตว์" value={item.petType || '-'}/><Info label="อายุ" value={item.age != null ? `${item.age} ปี` : '-'}/><Info label="น้ำหนัก" value={item.weight != null ? `${item.weight} กก.` : '-'}/></div>{item.scores?.length > 0 && <div className="mt-3 rounded-xl bg-gray-50 p-3"><div className="mb-2 text-[10px] font-bold text-gray-400">คะแนนสินค้าที่ AI เลือก</div><div className="space-y-1.5">{item.scores.map(score => <div key={score.productId} className="flex items-center justify-between text-xs"><span>สินค้า #{score.productId}</span><b className="text-violet-600">{score.score} คะแนน</b></div>)}</div></div>}</div><div className="flex shrink-0 gap-2"><button onClick={() => onReview(item.id, true)} className={`rounded-lg px-3 py-2 text-xs font-bold ${item.correct === true ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}><i className="fa-solid fa-check mr-1"/>ถูกต้อง</button><button onClick={() => onReview(item.id, false)} className={`rounded-lg px-3 py-2 text-xs font-bold ${item.correct === false ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'}`}><i className="fa-solid fa-xmark mr-1"/>ไม่ถูกต้อง</button></div></div>
      </div>)}
    </div>
  </section>
}
function Info({ label, value }) { return <div className="rounded-xl bg-gray-50 p-2.5"><div className="text-[10px] text-gray-400">{label}</div><div className="mt-1 text-xs font-bold text-gray-700">{value}</div></div> }
function Metric({ icon, label, value }) { return <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><i className={`fa-solid ${icon}`}/></div><div className="mt-3 text-xs text-gray-400">{label}</div><div className="mt-1 text-xl font-extrabold">{value}</div></div> }
function Stat({ icon, label, value }) { return <div className="rounded-xl bg-gray-50 p-4"><i className={`fa-solid ${icon} text-violet-600`}/><div className="mt-2 text-xs text-gray-400">{label}</div><div className="mt-1 text-lg font-extrabold">{value}</div></div> }
function NutritionModal({ form, onClose, onSave }) { const [value,setValue]=useState(form); const field=(key,label,placeholder)=><label className="block"><span className="mb-1 block text-xs font-bold">{label}</span><input value={value[key] || ''} onChange={e=>setValue({...value,[key]:e.target.value})} placeholder={placeholder} className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-violet-400"/></label>; return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h3 className="text-base font-extrabold">{form.id ? 'แก้ไขข้อมูลโภชนาการ' : 'เพิ่มข้อมูลโภชนาการ'}</h3><button onClick={onClose} className="grid size-8 place-items-center rounded-lg bg-gray-100 text-gray-500"><i className="fa-solid fa-xmark"/></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{field('pet','สัตว์','เช่น แมว')}{field('category','หมวด','เช่น อาหารทั่วไป')}{field('protein','โปรตีน','เช่น 30%')}{field('fat','ไขมัน','เช่น 12%')}<label className="sm:col-span-2">{field('note','หมายเหตุ','ข้อมูลเพิ่มเติม')}</label></div><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold">ยกเลิก</button><button onClick={()=>onSave(value)} className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white">บันทึก</button></div></div></div> }
