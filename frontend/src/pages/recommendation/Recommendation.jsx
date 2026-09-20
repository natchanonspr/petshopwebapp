import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import { getPets } from '../../api/pets.js'
import { getRecommendations } from '../../api/ai.js'

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

function scoreProduct(product, pet, age, weight, ai) {
  const petSpecies = pet.pet_species
  const petType = petSpecies === 'แมว' ? 'อาหารแมว' : 'อาหารสุนัข'
  if (product.category !== petType) return -1

  let score = 50
  const text = `${product.name} ${product.category}`.toLowerCase()
  const rules = Array.isArray(ai.rules) ? ai.rules.filter((rule) => rule.enabled).map((rule) => rule.label) : []
  const nutrition = Array.isArray(ai.nutrition) ? ai.nutrition : []
  const nutritionMatches = nutrition.filter((item) => String(item.pet || '').includes(petSpecies))

  if (rules.includes('อายุสัตว์')) {
    score += age < 1 ? (text.includes('puppy') || text.includes('kitten') || text.includes('เด็ก') ? 20 : 5) : 10
  }
  if (rules.includes('น้ำหนัก')) {
    score += weight >= 8 ? (text.includes('adult') || text.includes('โต') ? 12 : 4) : 8
  }
  if (rules.includes('สายพันธุ์') && pet.pet_breed) {
    score += text.includes(String(pet.pet_breed).toLowerCase()) ? 25 : 0
  }
  if (rules.includes('ข้อจำกัดด้านโภชนาการ')) {
    const matchingNutrition = nutritionMatches.find((item) => String(item.category || '').trim())
    if (matchingNutrition) {
      const category = String(matchingNutrition.category).toLowerCase()
      if (text.includes(category)) score += 25
      if (String(matchingNutrition.note || '').toLowerCase().includes('ควบคุม') && text.includes('weight')) score += 10
    }
  }
  // TODO: backend ไม่มี field คะแนนรีวิวสินค้า (rating) เลย ส่วนนี้เลยไม่มีผลต่อคะแนนจริง (ได้ 0 เสมอ) จนกว่าจะมีระบบรีวิวจริง
  score += Math.min(10, Math.round(getNumber(product.rating) * 2))
  return score
}

export default function Recommendation() {
  const [pets, setPets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')

  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    let active = true

    getPets()
      .then((nextPets) => {
        if (!active) return

        setPets(nextPets)

        setSelectedId((current) => {
          const stillExists =
            current != null &&
            nextPets.some(
              (pet) => String(pet.pet_id) === String(current),
            )

          return stillExists
            ? current
            : (nextPets[0]?.pet_id ?? null)
        })
      })
      .catch((err) => {
        if (active) {
          setLoadError(err?.message || 'โหลดข้อมูลไม่สำเร็จ')
        }
      })

    return () => {
      active = false
    }
  }, [])

  const selectedPet = useMemo(
    () => pets.find((pet) => String(pet.pet_id) === String(selectedId)),
    [pets, selectedId],
  )

  useEffect(() => {
    setResult(null)
    setError('')
  }, [selectedPet?.pet_id])

  const handleAnalyze = async (event) => {
    event.preventDefault()

    const ai = getAISettings()

    if (!ai.enabled) {
      setError('ขณะนี้ระบบ AI ถูกปิดใช้งานโดยผู้ดูแลระบบ')
      setResult(null)
      return
    }

    if (!selectedPet) {
      setError('กรุณาเลือกสัตว์เลี้ยงก่อน')
      setResult(null)
      return
    }

    setError('')
    setIsAnalyzing(true)
    try {
      const recommendation = await getRecommendations(selectedPet.pet_id)

      console.log('AI Recommendation:', recommendation)

      const recommendedProducts = (recommendation?.recommendations ?? [])
        .filter((item) => item?.product)
        .map((item) => ({
          ...item.product,
          reason: item.reason || 'AI แนะนำสินค้านี้จากข้อมูลของน้อง',
          daily_kcal: item.daily_kcal,
          daily_grams: item.daily_grams,
          grams_per_food: item.grams_per_food,
          food_per_day: item.food_per_day,
        }))

      setResult({
        pet: recommendation?.pet,
        provider: 'Gemini',
        rules: [],
        title:
          recommendation?.pet?.pet_species === 'แมว'
            ? 'อาหารสำหรับแมว'
            : 'อาหารสำหรับสุนัข',
        description:
          recommendedProducts.length > 0
            ? `AI วิเคราะห์ข้อมูลของ ${recommendation?.pet?.pet_name || selectedPet.pet_name} และพบสินค้าที่เหมาะสม`
            : 'AI ยังไม่พบสินค้าที่เหมาะสมจากรายการสินค้าที่มี',
        products: recommendedProducts,
      })
    } catch (err) {
      setResult(null)
      setError(err?.message || 'ไม่สามารถวิเคราะห์ด้วย AI ได้')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="z-10 shrink-0 border-b border-gray-100 bg-white px-5 pb-3 pt-3">
        <div className="flex items-center justify-between gap-3">
          <Link to="/home" aria-label="กลับหน้าหลัก" className="grid size-10 shrink-0 place-items-center rounded-full bg-gray-50 text-gray-600 transition active:scale-95">
            <i className="fa-solid fa-chevron-left text-sm" />
          </Link>
          <div className="min-w-0 text-center">
            <h1 className="m-0 text-lg font-extrabold text-gray-900">ผู้ช่วย AI</h1>
            <p className="m-0 mt-0.5 text-[10px] text-gray-400">คำแนะนำสำหรับสัตว์เลี้ยงของคุณ</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-sparkles text-sm" />
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="relative mb-4 overflow-hidden rounded-[28px] bg-orange-500 p-5 text-white shadow-lg shadow-orange-500/15">
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 -left-8 size-28 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-[22px] bg-white/15 text-3xl backdrop-blur">
              <i className="fa-solid fa-paw" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Petshop AI</span>
              <h2 className="mt-0.5 text-lg font-extrabold leading-tight">ช่วยเลือกสิ่งที่เหมาะกับน้อง</h2>
              <p className="mt-1 text-xs leading-5 text-white/85">ใช้ข้อมูลของน้องเพื่อสร้างคำแนะนำเฉพาะตัว</p>
            </div>
          </div>
          <div className="relative mt-4 flex items-center gap-2 text-[10px] font-semibold text-white/90">
            <span className="rounded-full bg-white/15 px-3 py-1.5"><i className="fa-solid fa-shield-heart mr-1" />ข้อมูลปลอดภัย</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5"><i className="fa-solid fa-bolt mr-1" />วิเคราะห์รวดเร็ว</span>
          </div>
        </section>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <section className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-orange-500">STEP 01</span>
                <h2 className="m-0 mt-0.5 text-base font-extrabold text-gray-900">เลือกน้องที่ต้องการวิเคราะห์</h2>
              </div>
              <Link to="/pets" className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-500">จัดการข้อมูล</Link>
            </div>
            {loadError && <p className="m-0 mb-3 text-xs font-medium text-red-500">{loadError}</p>}
            {pets.length ? (
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {pets.map((pet) => (
                  <button key={pet.pet_id} type="button" onClick={() => setSelectedId(pet.pet_id)} className={`relative flex w-[126px] shrink-0 flex-col items-center rounded-[20px] border p-3 transition active:scale-95 ${String(selectedId) === String(pet.pet_id) ? 'border-orange-400 bg-orange-50 shadow-sm shadow-orange-100' : 'border-gray-100 bg-white'}`}>
                    <span className="grid size-14 place-items-center overflow-hidden rounded-full bg-orange-50 text-2xl text-orange-300">
                      <i className={`fa-solid ${pet.pet_species === 'สุนัข' ? 'fa-dog' : 'fa-cat'}`} />
                    </span>
                    <strong className="mt-2 max-w-full truncate text-sm">{pet.pet_name}</strong>
                    <span className="mt-0.5 text-[10px] text-gray-400">{pet.pet_species}</span>
                  </button>
                ))}
              </div>
            ) : (
              <Link to="/pets" className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50 text-sm font-bold text-orange-500">+ เพิ่มสัตว์เลี้ยงก่อน</Link>
            )}
          </section>

          <section className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-3">
              <span className="text-[10px] font-bold text-orange-500">STEP 02</span>
              <h2 className="m-0 mt-0.5 text-base font-extrabold text-gray-900">ข้อมูลพื้นฐานของน้อง</h2>
              <p className="m-0 mt-1 text-[10px] text-gray-400">ข้อมูลจากโปรไฟล์สัตว์เลี้ยงของคุณ</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-gray-50 p-3">
                <span className="block text-[10px] font-bold text-gray-400">
                  วันเกิด
                </span>
                <strong className="mt-1 block text-sm text-gray-800">
                  {selectedPet?.pet_birthdate
                    ? new Date(selectedPet.pet_birthdate).toLocaleDateString('th-TH')
                    : '-'}
                </strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <span className="block text-[10px] font-bold text-gray-400">
                  น้ำหนัก
                </span>
                <strong className="mt-1 block text-sm text-gray-800">
                  {selectedPet?.pet_weight != null
                    ? `${selectedPet.pet_weight} กก.`
                    : '-'}
                </strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <span className="block text-[10px] font-bold text-gray-400">
                  สายพันธุ์
                </span>
                <strong className="mt-1 block truncate text-sm text-gray-800">
                  {selectedPet?.pet_breed || '-'}
                </strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <span className="block text-[10px] font-bold text-gray-400">
                  เพศ
                </span>
                <strong className="mt-1 block text-sm text-gray-800">
                  {selectedPet?.pet_gender || '-'}
                </strong>
              </div>

              <div className="rounded-2xl bg-gray-50 p-3">
                <span className="block text-[10px] font-bold text-gray-400">
                  ทำหมัน
                </span>
                <strong className="mt-1 block text-sm text-gray-800">
                  {selectedPet?.pet_neutered ? 'ทำหมันแล้ว' : 'ยังไม่ได้ทำหมัน'}
                </strong>
              </div>
            </div>
            {error && <p className="m-0 mt-2 text-xs font-medium text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAnalyzing ? (
                <>
                  <span
                    className="inline-block size-4 animate-spin rounded-full border-2 border-white border-r-transparent"
                    aria-hidden="true"
                  />
                  กำลังวิเคราะห์...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-sparkles" />
                  วิเคราะห์
                </>
              )}
            </button>
          </section>
        </form>

        {isAnalyzing && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-xs font-bold text-gray-500 shadow-sm">
            <span
              className="inline-block size-5 animate-spin rounded-full border-2 border-orange-500 border-r-transparent"
              aria-hidden="true"
            />
            <span>AI กำลังวิเคราะห์ข้อมูล...</span>
          </div>
        )}

        {result && (
          <section className="mt-4 overflow-hidden rounded-[26px] border border-orange-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-green-50 to-orange-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-green-500 shadow-sm"><i className="fa-solid fa-check" /></span>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-green-600">ANALYSIS COMPLETE</span>
                  <h2 className="m-0 mt-0.5 truncate text-base font-extrabold text-gray-900">คำแนะนำสำหรับ {selectedPet.pet_name}</h2>
                  <p className="m-0 text-[10px] text-gray-400">{result.title} · {result.provider}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="mt-3 text-xs leading-5 text-gray-600">{result.description}</p>
              {result.rules?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{result.rules.map((rule) => <span key={rule} className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600"><i className="fa-solid fa-check mr-1" />{rule}</span>)}</div>}
              <div className="mt-3 grid grid-cols-2 gap-2">
              </div>
              {result.products.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="m-0 text-sm font-bold">สินค้าที่น่าสนใจ</h3>

                    <Link
                      to="/products"
                      className="text-xs font-bold text-orange-500"
                    >
                      ดูทั้งหมด
                    </Link>
                  </div>

                  <div className="space-y-2">
                    {result.products.map((product) => (
                      <Link
                        key={product.product_id}
                        to={`/products/${product.product_id}`}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 active:bg-gray-50"
                      >
                        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-100">
                          {product.product_image ? (
                            <img
                              src={product.product_image}
                              alt={product.product_name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <i className="fa-solid fa-bowl-food text-lg text-gray-400" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-xs">
                            {product.product_name}
                          </strong>

                          <span className="block text-[10px] text-gray-400">
                            {product.category_name}
                          </span>

                          {product.reason && (
                            <span className="mt-1 block text-[10px] leading-4 text-gray-500">
                              {product.reason}
                              {product.daily_grams > 0 && (
                                <div className="mt-2 rounded-xl bg-orange-50 p-2.5">
                                  <div className="text-[10px] font-bold text-orange-600">
                                    ปริมาณแนะนำ
                                  </div>

                                  <div className="mt-1 text-[11px] font-bold text-gray-700">
                                    {product.daily_grams} กรัม/วัน
                                  </div>

                                  <div className="text-[10px] text-gray-500">
                                    แบ่ง {product.food_per_day} มื้อ × {product.grams_per_food} กรัม
                                    · {product.daily_kcal} kcal/วัน
                                  </div>
                                </div>
                              )}
                            </span>
                          )}
                        </span>

                        <strong className="shrink-0 text-sm text-orange-500">
                          ฿{Number(product.product_price).toLocaleString()}
                        </strong>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex gap-2">
                  <i className="fa-solid fa-circle-info mt-0.5 text-[11px] text-orange-400" />
                  <p className="m-0 text-[10px] leading-5 text-gray-400">คำแนะนำนี้เป็นข้อมูลเบื้องต้นจากอายุ น้ำหนัก และประเภทสัตว์เลี้ยง ไม่ใช่การวินิจฉัยทางการแพทย์ หากน้องมีโรคประจำตัวควรปรึกษาสัตวแพทย์</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <BottomNavigation />
    </div>
  )
}