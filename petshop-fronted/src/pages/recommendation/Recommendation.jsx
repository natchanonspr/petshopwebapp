import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import { PETS_UPDATED_EVENT, defaultPets, getPets } from '../../data/pets.js'
import { products } from '../../data/products.js'
import { logActivity } from '../../admin/activity.js'

const AI_KEY = 'petshop_ai_management_v1'

function getAISettings() {
  const fallback = {
    enabled: true,
    provider: 'gemini',
    rules: [
      { label: 'อายุสัตว์', enabled: true },
      { label: 'สายพันธุ์', enabled: true },
      { label: 'น้ำหนัก', enabled: true },
      { label: 'ข้อจำกัดด้านโภชนาการ', enabled: true },
    ],
    nutrition: [],
    recommendations: [],
  }
  try {
    const saved = JSON.parse(localStorage.getItem(AI_KEY) || 'null')
    return saved ? { ...fallback, ...saved, rules: Array.isArray(saved.rules) ? saved.rules : fallback.rules, nutrition: Array.isArray(saved.nutrition) ? saved.nutrition : [] } : fallback
  } catch {
    return fallback
  }
}

function saveRecommendationLog(entry) {
  try {
    const current = getAISettings()
    const recommendations = Array.isArray(current.recommendations) ? current.recommendations : []
    localStorage.setItem(AI_KEY, JSON.stringify({ ...current, recommendations: [entry, ...recommendations].slice(0, 100) }))
    window.dispatchEvent(new Event('petshop-ai-updated'))
  } catch {}
}

function getNumber(value) {
  const number = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(number) ? number : 0
}

function scoreProduct(product, pet, age, weight, ai) {
  const petType = pet.type === 'แมว' ? 'อาหารแมว' : 'อาหารสุนัข'
  if (product.category !== petType) return -1

  let score = 50
  const text = `${product.name} ${product.category}`.toLowerCase()
  const rules = Array.isArray(ai.rules) ? ai.rules.filter((rule) => rule.enabled).map((rule) => rule.label) : []
  const nutrition = Array.isArray(ai.nutrition) ? ai.nutrition : []
  const nutritionMatches = nutrition.filter((item) => String(item.pet || '').includes(pet.type))

  if (rules.includes('อายุสัตว์')) {
    score += age < 1 ? (text.includes('puppy') || text.includes('kitten') || text.includes('เด็ก') ? 20 : 5) : 10
  }
  if (rules.includes('น้ำหนัก')) {
    score += weight >= 8 ? (text.includes('adult') || text.includes('โต') ? 12 : 4) : 8
  }
  if (rules.includes('สายพันธุ์') && pet.breed) {
    score += text.includes(String(pet.breed).toLowerCase()) ? 25 : 0
  }
  if (rules.includes('ข้อจำกัดด้านโภชนาการ')) {
    const matchingNutrition = nutritionMatches.find((item) => String(item.category || '').trim())
    if (matchingNutrition) {
      const category = String(matchingNutrition.category).toLowerCase()
      if (text.includes(category)) score += 25
      if (String(matchingNutrition.note || '').toLowerCase().includes('ควบคุม') && text.includes('weight')) score += 10
    }
  }
  score += Math.min(10, Math.round(getNumber(product.rating) * 2))
  return score
}

export default function Recommendation() {
  const [pets, setPets] = useState(defaultPets)
  const [selectedId, setSelectedId] = useState(null)
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPets = () => {
      const nextPets = getPets()
      setPets(nextPets)

      setSelectedId((current) => {
        const stillExists = current != null && nextPets.some((pet) => String(pet.id) === String(current))
        return stillExists ? current : (nextPets[0]?.id ?? null)
      })
    }

    loadPets()
    window.addEventListener(PETS_UPDATED_EVENT, loadPets)
    window.addEventListener('storage', loadPets)

    return () => {
      window.removeEventListener(PETS_UPDATED_EVENT, loadPets)
      window.removeEventListener('storage', loadPets)
    }
  }, [])

  const selectedPet = useMemo(
    () => pets.find((pet) => String(pet.id) === String(selectedId)),
    [pets, selectedId],
  )

  // Sync the editable AI inputs whenever the selected pet's saved data changes.
  // This is intentionally based on age/weight as well as id, so editing a pet
  // and returning to this page immediately uses the newest values.
  useEffect(() => {
    if (!selectedPet) {
      setAge('')
      setWeight('')
      setResult(null)
      return
    }

    setAge(String(getNumber(selectedPet.age) || ''))
    setWeight(String(getNumber(selectedPet.weight) || ''))
    setResult(null)
    setError('')
  }, [selectedPet?.id, selectedPet?.age, selectedPet?.weight])

  const handleAnalyze = (event) => {
    event.preventDefault()
    const nextAge = Number(age)
    const nextWeight = Number(weight)
    const ai = getAISettings()

    if (!ai.enabled) {
      setError('ขณะนี้ระบบ AI ถูกปิดใช้งานโดยผู้ดูแลระบบ')
      setResult(null)
      return
    }

    if (!selectedPet) {
      setError('กรุณาเลือกสัตว์เลี้ยงก่อน')
      return
    }
    if (!Number.isFinite(nextAge) || nextAge < 0) {
      setError('กรุณากรอกอายุให้ถูกต้อง')
      return
    }
    if (!Number.isFinite(nextWeight) || nextWeight <= 0) {
      setError('กรุณากรอกน้ำหนักให้มากกว่า 0 กก.')
      return
    }

    const isCat = selectedPet.type === 'แมว'
    const activeRules = Array.isArray(ai.rules) ? ai.rules.filter((rule) => rule.enabled).map((rule) => rule.label) : []
    const nutrition = Array.isArray(ai.nutrition) ? ai.nutrition : []
    const petWord = isCat ? 'แมว' : 'สุนัข'
    const scoredProducts = products
      .map((product) => ({ product, score: scoreProduct(product, selectedPet, nextAge, nextWeight, ai) }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score)
    const suggestedProducts = scoredProducts.slice(0, 2).map((item) => item.product)
    const calories = Math.round(nextWeight * (isCat ? 35 : 30))
    const meal = Math.round(calories / 2)

    setError('')
    const providerName = ai.provider === 'luna' ? 'Luna' : 'Gemini'
    const nutritionRule = nutrition.find((item) => String(item.pet || '').includes(petWord))
    const recommendationResult = isCat ? 'แนะนำอาหารแมวตามข้อมูลน้อง' : 'แนะนำอาหารสุนัขตามข้อมูลน้อง'
    setResult({
      provider: providerName,
      rules: activeRules,
      calories,
      meal,
      title: isCat ? 'อาหารสำหรับแมว' : 'อาหารสำหรับสุนัข',
      description:
        nextAge < 1
          ? 'น้องยังอยู่ในวัยเด็ก ควรเลือกอาหารที่เหมาะกับช่วงวัยและแบ่งเป็นมื้อเล็ก ๆ'
          : nutritionRule?.note || `คำแนะนำเบื้องต้นจากข้อมูล ${activeRules.length ? activeRules.join(', ') : 'อายุและน้ำหนัก'} ของน้อง`,
      products: suggestedProducts,
    })

    logActivity('recommendation', `วิเคราะห์อาหารสำหรับ ${selectedPet.name}`, { petId: selectedPet.id, petType: selectedPet.type, age: nextAge, weight: nextWeight, provider: providerName })
    saveRecommendationLog({
      id: Date.now(),
      date: new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }),
      customer: 'ลูกค้าปัจจุบัน',
      provider: providerName,
      result: recommendationResult,
      correct: null,
      petType: selectedPet.type,
      age: nextAge,
      weight: nextWeight,
      rules: activeRules,
      productIds: scoredProducts.slice(0, 2).map((item) => item.product.id),
      scores: scoredProducts.slice(0, 2).map((item) => ({ productId: item.product.id, score: item.score })),
    })
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="z-10 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <Link to="/home" aria-label="กลับหน้าหลัก" className="grid size-12 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 active:scale-95">
            <i className="fa-solid fa-arrow-left" />
          </Link>
          <div className="min-w-0 text-center">
            <h1 className="m-0 text-xl font-bold text-gray-900">AI แนะนำอาหาร</h1>
            <p className="m-0 mt-0.5 text-xs text-gray-400">วิเคราะห์ข้อมูลน้องเพื่อช่วยเลือกอาหาร</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-wand-magic-sparkles" />
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="mb-4 rounded-[24px] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-500/15">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/20"><i className="fa-solid fa-robot" /></span>
            <div>
              <h2 className="m-0 text-base font-bold">คุยกับ AI ผู้ช่วยดูแลน้อง</h2>
              <p className="m-0 mt-1 text-xs leading-5 text-white/90">เลือกน้อง แล้วกรอกอายุและน้ำหนัก เพื่อรับคำแนะนำเบื้องต้น</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <section className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-base font-bold text-gray-900">1. เลือกสัตว์เลี้ยง</h2>
              <Link to="/pets" className="text-xs font-bold text-orange-500">จัดการข้อมูล</Link>
            </div>
            {pets.length ? (
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {pets.map((pet) => (
                  <button key={pet.id} type="button" onClick={() => setSelectedId(pet.id)} className={`flex w-[118px] shrink-0 flex-col items-center rounded-2xl border p-3 transition active:scale-95 ${String(selectedId) === String(pet.id) ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-white'}`}>
                    <span className="grid size-14 place-items-center overflow-hidden rounded-full bg-orange-50 text-2xl text-orange-300">
                      {pet.image ? <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" /> : <i className={`fa-solid ${pet.icon || (pet.type === 'สุนัข' ? 'fa-dog' : 'fa-cat')}`} />}
                    </span>
                    <strong className="mt-2 max-w-full truncate text-sm">{pet.name}</strong>
                    <span className="mt-0.5 text-[10px] text-gray-400">{pet.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <Link to="/pets" className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50 text-sm font-bold text-orange-500">+ เพิ่มสัตว์เลี้ยงก่อน</Link>
            )}
          </section>

          <section className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-gray-900">2. ข้อมูลน้อง</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1.5 block text-xs font-bold">อายุ (ปี)</span><input type="number" min="0" step="0.1" value={age} onChange={(e) => setAge(e.target.value)} placeholder="เช่น 2" className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-orange-400 focus:bg-white" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-bold">น้ำหนัก (กก.)</span><input type="number" min="0.1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="เช่น 4" className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-orange-400 focus:bg-white" /></label>
            </div>
            {error && <p className="m-0 mt-2 text-xs font-medium text-red-500">{error}</p>}
            <button type="submit" className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-500/20 active:scale-[0.99]">
              <i className="fa-solid fa-wand-magic-sparkles" /> วิเคราะห์และแนะนำอาหาร
            </button>
          </section>
        </form>

        {result && (
          <section className="mt-4 rounded-[24px] border border-orange-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-green-50 text-green-500"><i className="fa-solid fa-check" /></span><div><h2 className="m-0 text-base font-bold">ผลการวิเคราะห์สำหรับ {selectedPet.name}</h2><p className="m-0 text-[10px] text-gray-400">{result.title} · {result.provider}</p></div></div>
            <p className="mt-3 text-xs leading-5 text-gray-600">{result.description}</p>
            {result.rules?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{result.rules.map((rule) => <span key={rule} className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600"><i className="fa-solid fa-check mr-1" />{rule}</span>)}</div>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-orange-50 p-3 text-center"><strong className="block text-lg text-orange-500">~{result.calories}</strong><span className="text-[10px] text-gray-500">พลังงาน/วัน (ประมาณ)</span></div>
              <div className="rounded-2xl bg-gray-50 p-3 text-center"><strong className="block text-lg text-gray-800">~{result.meal}</strong><span className="text-[10px] text-gray-500">พลังงาน/มื้อ × 2</span></div>
            </div>
            {result.products.length > 0 && <div className="mt-4"><div className="mb-2 flex items-center justify-between"><h3 className="m-0 text-sm font-bold">สินค้าที่น่าสนใจ</h3><Link to="/products" className="text-xs font-bold text-orange-500">ดูทั้งหมด</Link></div><div className="space-y-2">{result.products.map((product) => <Link key={product.id} to={`/products/${product.id}`} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 active:bg-gray-50"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gray-100 text-lg text-gray-400"><i className={`fa-solid ${product.icon}`} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{product.name}</strong><span className="text-[10px] text-gray-400">คะแนน {product.rating} · {product.reviews} รีวิว</span></span><strong className="text-sm text-orange-500">฿{product.price.toLocaleString()}</strong></Link>)}</div></div>}
            <p className="mt-4 rounded-2xl bg-gray-50 p-3 text-[10px] leading-5 text-gray-400">หมายเหตุ: ผลลัพธ์นี้เป็นคำแนะนำเบื้องต้นจากข้อมูลอายุ น้ำหนัก และประเภทสัตว์เลี้ยง ไม่ใช่การวินิจฉัยทางการแพทย์ หากน้องมีโรคประจำตัวหรือมีข้อจำกัดด้านอาหาร ควรปรึกษาสัตวแพทย์</p>
          </section>
        )}
      </main>
      <BottomNavigation />
    </div>
  )
}
