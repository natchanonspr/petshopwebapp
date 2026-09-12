import { useEffect, useState } from 'react'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import PetCard from '../../components/pets/PetCard.jsx'
import PetsHeader from '../../components/pets/PetsHeader.jsx'
import { getPets, createPet, updatePet, deletePet } from '../../api/pets.js'

const PET_ERROR_SHAKE_STYLES = `
@keyframes petshop-error-shake {
  0% { transform: translateX(0); }
  28.57% { transform: translateX(6px); }
  57.14% { transform: translateX(-6px); }
  78.57% { transform: translateX(4px); }
  100% { transform: translateX(0); }
}
.petshop-shake { animation: petshop-error-shake 280ms linear; }
@media (prefers-reduced-motion: reduce) {
  .petshop-shake { animation: none !important; }
}
`

const emptyForm = {
  pet_name: '',
  pet_species: 'แมว',
  pet_breed: '',
  pet_birthdate: '',
  pet_weight: '',
  pet_gender: 'ตัวผู้',
  pet_neutered: false,
  pet_disease: '',
  pet_health: '',
  description: '',
}

export default function Pets() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [shakeFields, setShakeFields] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (document.getElementById('petshop-error-shake')) return
    const style = document.createElement('style')
    style.id = 'petshop-error-shake'
    style.textContent = PET_ERROR_SHAKE_STYLES
    document.head.appendChild(style)
  }, [])

  useEffect(() => {
    loadPets()
  }, [])

  async function loadPets() {
    setLoading(true)
    try {
      const data = await getPets()
      setPets(data)
    } catch (error) {
      console.error(error)
      alert(error.message || 'โหลดข้อมูลสัตว์เลี้ยงไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setErrors({})
    setShakeFields({})
    setIsOpen(true)
  }

  const openEdit = (pet) => {
    setEditingId(pet.pet_id)
    setErrors({})
    setShakeFields({})
    setForm({
      pet_name: pet.pet_name || '',
      pet_species: pet.pet_species || 'แมว',
      pet_breed: pet.pet_breed || '',
      pet_birthdate: pet.pet_birthdate ? String(pet.pet_birthdate).slice(0, 10) : '',
      pet_weight: pet.pet_weight ?? '',
      pet_gender: pet.pet_gender || 'ตัวผู้',
      pet_neutered: Boolean(pet.pet_neutered),
      pet_disease: pet.pet_disease || '',
      pet_health: pet.pet_health || '',
      description: pet.description || '',
    })
    setIsOpen(true)
  }

  const closeForm = () => {
    setIsOpen(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    setErrors({})
    setShakeFields({})
  }

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const savePet = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.pet_name.trim()) nextErrors.pet_name = 'กรุณากรอกชื่อสัตว์เลี้ยง'
    if (!form.pet_species) nextErrors.pet_species = 'กรุณาเลือกประเภทสัตว์'
    if (!form.pet_breed.trim()) nextErrors.pet_breed = 'กรุณากรอกสายพันธุ์'
    if (!form.pet_birthdate) nextErrors.pet_birthdate = 'กรุณาเลือกวันเกิด'
    if (form.pet_weight === '') nextErrors.pet_weight = 'กรุณากรอกน้ำหนัก'
    else if (Number(form.pet_weight) <= 0) nextErrors.pet_weight = 'น้ำหนักต้องมากกว่า 0 กก.'
    if (!form.pet_gender) nextErrors.pet_gender = 'กรุณาเลือกเพศ'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setShakeFields({})
      window.requestAnimationFrame(() => {
        setShakeFields({ ...nextErrors })
        window.setTimeout(() => setShakeFields({}), 320)
      })
      return
    }

    const petData = {
      pet_name: form.pet_name.trim(),
      pet_species: form.pet_species,
      pet_breed: form.pet_breed.trim(),
      pet_birthdate: form.pet_birthdate,
      pet_weight: Number(form.pet_weight),
      pet_gender: form.pet_gender,
      pet_neutered: Boolean(form.pet_neutered),
      pet_disease: form.pet_disease.trim(),
      pet_health: form.pet_health.trim(),
      description: form.description.trim(),
    }

    setSaving(true)
    try {
      if (editingId) {
        const updated = await updatePet(editingId, petData)
        setPets((current) => current.map((p) => (p.pet_id === editingId ? updated : p)))
      } else {
        const created = await createPet(petData)
        setPets((current) => [created, ...current])
      }
      closeForm()
    } catch (error) {
      console.error(error)
      alert(error.message || 'บันทึกข้อมูลไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const deletePetHandler = async (pet) => {
    if (!window.confirm(`ต้องการลบ ${pet.pet_name} หรือไม่?`)) return
    try {
      await deletePet(pet.pet_id)
      setPets((current) => current.filter((item) => item.pet_id !== pet.pet_id))
    } catch (error) {
      console.error(error)
      alert(error.message || 'ลบข้อมูลไม่สำเร็จ')
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <PetsHeader />
      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-base font-bold text-gray-900">สัตว์เลี้ยงทั้งหมด</h2>
          <p className="m-0 text-xs font-medium text-gray-400">{pets.length} ตัว</p>
        </div>

        {loading ? (
          <p className="py-10 text-center text-xs text-gray-400">กำลังโหลดข้อมูล...</p>
        ) : pets.length > 0 ? (
          <div className="space-y-4">
            {pets.map((pet) => (
              <PetCard key={pet.pet_id} pet={pet} variant="full" onEdit={openEdit} onDelete={deletePetHandler} />
            ))}
          </div>
        ) : (
          <button type="button" onClick={openAdd} className="flex min-h-[170px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-orange-200 bg-white text-center active:bg-orange-50">
            <span className="grid size-14 place-items-center rounded-full bg-orange-50 text-2xl text-orange-500"><i className="fa-solid fa-plus" /></span>
            <strong className="mt-3 text-sm text-orange-500">เพิ่มสัตว์เลี้ยง</strong>
            <span className="mt-1 text-xs text-gray-400">เพิ่มข้อมูลน้องเพื่อรับคำแนะนำที่แม่นยำยิ่งขึ้น</span>
          </button>
        )}

        {pets.length > 0 && (
          <button type="button" onClick={openAdd} className="mt-4 flex min-h-[125px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-gray-200 bg-white text-center active:bg-gray-50">
            <span className="grid size-11 place-items-center rounded-full bg-orange-500 text-xl text-white"><i className="fa-solid fa-plus" /></span>
            <strong className="mt-2 text-sm text-orange-500">เพิ่มสัตว์เลี้ยง</strong>
            <span className="mt-1 text-[10px] text-gray-400">เพิ่มข้อมูลน้องเพื่อรับคำแนะนำที่แม่นยำยิ่งขึ้น</span>
          </button>
        )}
      </main>
      <BottomNavigation />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/40 p-3 min-[431px]:items-center">
          <form noValidate onSubmit={savePet} className="max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="m-0 mt-1 text-lg font-bold">{editingId ? 'แก้ไขข้อมูลน้อง' : 'เพิ่มสัตว์เลี้ยง'}</h2>
              <button type="button" onClick={closeForm} className="grid size-9 place-items-center rounded-full bg-gray-100"><i className="fa-solid fa-xmark" /></button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">ชื่อสัตว์เลี้ยง</span>
                <input
                  value={form.pet_name}
                  onChange={(e) => { setField('pet_name', e.target.value); if (errors.pet_name) setErrors((c) => ({ ...c, pet_name: '' })) }}
                  aria-invalid={!!errors.pet_name}
                  className={`h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm outline-none focus:bg-white ${errors.pet_name ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'} ${shakeFields.pet_name ? 'petshop-shake' : ''}`}
                />
                {errors.pet_name && <span className="mt-1 block text-[11px] font-medium text-red-500">{errors.pet_name}</span>}
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-bold">ประเภทสัตว์</span>
                <div className="grid grid-cols-2 gap-2">
                  {['สุนัข', 'แมว'].map((species) => (
                    <button
                      key={species}
                      type="button"
                      onClick={() => { setField('pet_species', species); setErrors((c) => ({ ...c, pet_species: '' })) }}
                      className={`h-11 rounded-xl border text-sm font-bold ${form.pet_species === species ? 'border-orange-400 bg-orange-50 text-orange-500' : 'border-gray-200 bg-white text-gray-600'} ${shakeFields.pet_species ? 'petshop-shake' : ''}`}
                    >
                      {species === 'สุนัข' ? '🐶' : '🐱'} {species}
                    </button>
                  ))}
                </div>
                {errors.pet_species && <span className="mt-1 block text-[11px] font-medium text-red-500">{errors.pet_species}</span>}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">สายพันธุ์</span>
                <input
                  value={form.pet_breed}
                  onChange={(e) => { setField('pet_breed', e.target.value); if (errors.pet_breed) setErrors((c) => ({ ...c, pet_breed: '' })) }}
                  aria-invalid={!!errors.pet_breed}
                  className={`h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm outline-none focus:bg-white ${errors.pet_breed ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'} ${shakeFields.pet_breed ? 'petshop-shake' : ''}`}
                />
                {errors.pet_breed && <span className="mt-1 block text-[11px] font-medium text-red-500">{errors.pet_breed}</span>}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold">วันเกิด</span>
                  <input
                    type="date"
                    value={form.pet_birthdate}
                    onChange={(e) => { setField('pet_birthdate', e.target.value); if (errors.pet_birthdate) setErrors((c) => ({ ...c, pet_birthdate: '' })) }}
                    aria-invalid={!!errors.pet_birthdate}
                    className={`h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm outline-none ${errors.pet_birthdate ? 'border-red-400' : 'border-gray-200'} ${shakeFields.pet_birthdate ? 'petshop-shake' : ''}`}
                  />
                  {errors.pet_birthdate && <span className="mt-1 block text-[11px] font-medium text-red-500">{errors.pet_birthdate}</span>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold">น้ำหนัก (กก.)</span>
                  <input
                    type="number" min="0.1" step="0.1"
                    value={form.pet_weight}
                    onChange={(e) => { setField('pet_weight', e.target.value); if (errors.pet_weight) setErrors((c) => ({ ...c, pet_weight: '' })) }}
                    aria-invalid={!!errors.pet_weight}
                    className={`h-11 w-full rounded-xl border bg-gray-50 px-3 text-sm outline-none ${errors.pet_weight ? 'border-red-400' : 'border-gray-200'} ${shakeFields.pet_weight ? 'petshop-shake' : ''}`}
                  />
                  {errors.pet_weight && <span className="mt-1 block text-[11px] font-medium text-red-500">{errors.pet_weight}</span>}
                </label>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold">เพศ</span>
                <div className="grid grid-cols-2 gap-2">
                  {['ตัวผู้', 'ตัวเมีย'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => { setField('pet_gender', gender); setErrors((c) => ({ ...c, pet_gender: '' })) }}
                      className={`h-11 rounded-xl border text-sm font-bold ${form.pet_gender === gender ? 'border-orange-400 bg-orange-50 text-orange-500' : 'border-gray-200 bg-white text-gray-600'} ${shakeFields.pet_gender ? 'petshop-shake' : ''}`}
                    >
                      {gender === 'ตัวผู้' ? '♂' : '♀'} {gender}
                    </button>
                  ))}
                </div>
                {errors.pet_gender && <span className="mt-1 block text-[11px] font-medium text-red-500">{errors.pet_gender}</span>}
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-bold">การทำหมัน</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setField('pet_neutered', true)} className={`h-11 rounded-xl border text-sm font-bold ${form.pet_neutered === true ? 'border-orange-400 bg-orange-50 text-orange-500' : 'border-gray-200 bg-white text-gray-600'}`}>✓ ทำแล้ว</button>
                  <button type="button" onClick={() => setField('pet_neutered', false)} className={`h-11 rounded-xl border text-sm font-bold ${form.pet_neutered === false ? 'border-orange-400 bg-orange-50 text-orange-500' : 'border-gray-200 bg-white text-gray-600'}`}>ยังไม่ได้ทำ</button>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">โรคประจำตัว</span>
                <input value={form.pet_disease} onChange={(e) => setField('pet_disease', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm" placeholder="เช่น ไม่มี, โรคไต, เบาหวาน" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">ปัญหาสุขภาพ</span>
                <input value={form.pet_health} onChange={(e) => setField('pet_health', e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm" placeholder="เช่น ไม่มี, แพ้อาหาร" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">หมายเหตุ</span>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows="3" className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm" placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับน้อง" />
              </label>
            </div>

            <button type="submit" disabled={saving} className="mt-5 h-12 w-full rounded-2xl bg-orange-500 text-sm font-bold text-white disabled:opacity-60">
              {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลน้อง'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
