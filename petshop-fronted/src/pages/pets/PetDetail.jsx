import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'
import ImageCropper from '../../components/pets/ImageCropper.jsx'
import NotificationBadge from '../../components/profile/NotificationBadge.jsx'
import CartBadge from '../../components/cart/CartBadge.jsx'
import { getPet, updatePet, deletePet } from '../../api/pets.js'

function InfoRow({ icon, label, value }) { return <div className="flex min-h-[42px] items-center gap-3 border-b border-gray-100 px-4 last:border-b-0"><i className={`fa-solid ${icon} w-4 text-center text-gray-500`} /><span className="text-xs font-medium text-gray-700">{label}</span><span className="ml-auto text-right text-xs font-medium text-gray-800">{value}</span></div> }
function Section({ icon, title, children }) { return <section className="mb-5"><h2 className="mb-2.5 flex items-center gap-2 text-base font-bold text-gray-900"><i className={`fa-regular ${icon} text-orange-500`} />{title}</h2><div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.06)]">{children}</div></section> }

export default function PetDetail() {
  const navigate = useNavigate(); const { petId } = useParams()
  const [pet, setPet] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false); const [isEditing, setIsEditing] = useState(false); const [editForm, setEditForm] = useState(null); const [cropSrc, setCropSrc] = useState('')
  const updateEdit = (key, value) => setEditForm((current) => ({ ...current, [key]: value }))
  useEffect(() => {
    async function loadPet() {
      try {
        const petData = await getPet(petId)

        console.log("ข้อมูลสัตว์เลี้ยงจาก Backend:", petData)

        setPet(petData)
        setEditForm(petData)
      } catch (error) {
        console.error("Load pet error:", error)
        alert("ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้")
      }
    }

    if (petId) {
      loadPet()
    }
  }, [petId])
  const chooseImage = (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const reader = new FileReader(); reader.onload = () => setCropSrc(reader.result); reader.readAsDataURL(file) }
  const saveEdit = async (event) => {
    event.preventDefault()

    if (!editForm?.pet_name?.trim()) {
      alert("กรุณากรอกชื่อสัตว์เลี้ยง")
      return
    }

    try {
      const petData = {
        pet_name: editForm.pet_name.trim(),
        pet_species: editForm.pet_species || "",
        pet_breed: editForm.pet_breed || "",
        pet_weight: Number(editForm.pet_weight) || 0,
        pet_gender: editForm.pet_gender || "",
        pet_birthdate: editForm.pet_birthdate || null,
        pet_neutered: Boolean(editForm.pet_neutered),
        pet_disease: editForm.pet_disease || "",
        pet_health: editForm.pet_health || "",
        description: editForm.description || "",
      }

      console.log("กำลังส่งข้อมูลไป Backend:", petData)

      const updatedPet = await updatePet(petId, petData)

      console.log("Backend ส่งกลับ:", updatedPet)

      setPet(updatedPet)
      setEditForm(updatedPet)
      setIsEditing(false)
      setMenuOpen(false)

      alert("บันทึกข้อมูลสำเร็จ")

    } catch (error) {
      console.error("Update pet error:", error)
      alert("ไม่สามารถบันทึกข้อมูลได้")
    }
  }
  const isFemale = pet?.pet_gender === 'ตัวเมีย'

  return <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
    <header className="z-20 shrink-0 rounded-b-[28px] border-b border-gray-100 bg-white px-5 pb-4 pt-3 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="ย้อนกลับ" className="grid size-12 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-95"><i className="fa-solid fa-arrow-left" /></button>
          <h1 className="m-0 truncate text-xl font-bold leading-tight text-gray-900">ข้อมูลน้อง</h1>
        </div>
        <div className="flex shrink-0 gap-2.5">
          <a href="/notifications" aria-label="การแจ้งเตือน" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-90"><NotificationBadge><i className="fa-regular fa-bell" /></NotificationBadge></a>
          <a href="/cart" aria-label="ตะกร้าสินค้า" className="relative z-20 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500"><CartBadge><i className="fa-solid fa-cart-shopping" /></CartBadge></a>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="เมนูเพิ่มเติม" className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500 transition active:scale-90"><i className="fa-solid fa-ellipsis-vertical" /></button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="ปิดเมนู"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />

                <div className="absolute right-0 top-11 z-40 w-40 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_25px_rgba(15,23,42,0.14)]">

                  {/* แก้ไข */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      setEditForm({ ...pet })
                      setIsEditing(true)
                    }}
                    className="flex h-12 w-full items-center gap-3 px-4 text-sm font-bold"
                  >
                    <i className="fa-solid fa-pen w-4 text-center text-orange-500" />
                    แก้ไข
                  </button>

                  {/* ลบ */}
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false)

                      if (!window.confirm(`ต้องการลบ ${pet.pet_name} หรือไม่?`)) {
                        return
                      }

                      try {
                        await deletePet(petId)

                        alert('ลบข้อมูลสำเร็จ')
                        navigate('/pets')
                      } catch (error) {
                        console.error('Delete pet error:', error)
                        alert('ไม่สามารถลบข้อมูลได้')
                      }
                    }}
                    className="flex h-12 w-full items-center gap-3 border-t border-gray-100 px-4 text-sm font-bold text-red-500"
                  >
                    <i className="fa-regular fa-trash-can w-4 text-center" />
                    ลบ
                  </button>

                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {isEditing ? (
        <form onSubmit={saveEdit} className="space-y-4 pb-4">
          <section className="rounded-[24px] bg-white p-4 shadow-[0_3px_14px_rgba(15,23,42,0.06)]">
            <h2 className="mb-4 text-lg font-bold">แก้ไขข้อมูลน้อง</h2>

            <div className="mb-4 flex flex-col items-center">
              <label className="relative cursor-pointer">
                <div className="grid size-28 place-items-center overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 text-4xl text-orange-300 shadow-sm">
                  {editForm?.image ? (
                    <img
                      src={editForm.image}
                      alt={editForm.pet_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <i
                      className={`fa-solid ${editForm?.pet_species === 'สุนัข'
                        ? 'fa-dog'
                        : 'fa-cat'
                        }`}
                    />
                  )}
                </div>

                <span className="absolute bottom-0 right-0 grid size-10 place-items-center rounded-full border-4 border-white bg-orange-500 text-white">
                  <i className="fa-solid fa-camera text-sm" />
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={chooseImage}
                />
              </label>

              <span className="mt-2 text-[11px] text-gray-400">
                แตะรูปเพื่อเปลี่ยนรูปน้อง
              </span>
            </div>

            <div className="space-y-3">

              {/* ชื่อ */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">
                  ชื่อสัตว์เลี้ยง
                </span>

                <input
                  required
                  value={editForm?.pet_name ?? ''}
                  onChange={(e) =>
                    updateEdit('pet_name', e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                />
              </label>

              {/* ประเภทสัตว์ */}
              <div>
                <span className="mb-1.5 block text-xs font-bold">
                  ประเภทสัตว์
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {['สุนัข', 'แมว'].map((species) => (
                    <button
                      key={species}
                      type="button"
                      onClick={() =>
                        updateEdit('pet_species', species)
                      }
                      className={`h-11 rounded-xl border text-sm font-bold ${editForm?.pet_species === species
                        ? 'border-orange-400 bg-orange-50 text-orange-500'
                        : 'border-gray-200 bg-white text-gray-600'
                        }`}
                    >
                      {species === 'สุนัข' ? '🐶' : '🐱'} {species}
                    </button>
                  ))}
                </div>
              </div>

              {/* สายพันธุ์ */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">
                  สายพันธุ์
                </span>

                <input
                  value={editForm?.pet_breed ?? ''}
                  onChange={(e) =>
                    updateEdit('pet_breed', e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                />
              </label>

              {/* น้ำหนัก */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">
                  น้ำหนัก (กก.)
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editForm?.pet_weight ?? ''}
                  onChange={(e) =>
                    updateEdit('pet_weight', e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                />
              </label>

              {/* เพศ */}
              <div>
                <span className="mb-1.5 block text-xs font-bold">
                  เพศ
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {['ตัวผู้', 'ตัวเมีย'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() =>
                        updateEdit('pet_gender', gender)
                      }
                      className={`flex h-11 w-full items-center justify-center gap-1 rounded-xl border text-sm font-bold ${editForm?.pet_gender === gender
                        ? 'border-orange-400 bg-orange-50 text-orange-500'
                        : 'border-gray-200 bg-white text-gray-600'
                        }`}
                    >
                      <span className="leading-none">
                        {gender === 'ตัวผู้' ? '♂' : '♀'}
                      </span>
                      <span>{gender}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* วันเกิด */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">
                  วันเกิด
                </span>

                <input
                  type="date"
                  value={
                    editForm?.pet_birthdate
                      ? String(editForm.pet_birthdate).slice(0, 10)
                      : ''
                  }
                  onChange={(e) =>
                    updateEdit('pet_birthdate', e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                />
              </label>

              {/* การทำหมัน */}
              <div>
                <span className="mb-1.5 block text-xs font-bold">
                  การทำหมัน
                </span>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      updateEdit('pet_neutered', true)
                    }
                    className={`h-11 rounded-xl border text-sm font-bold ${editForm?.pet_neutered === true
                      ? 'border-orange-400 bg-orange-50 text-orange-500'
                      : 'border-gray-200 bg-white text-gray-600'
                      }`}
                  >
                    ✓ ทำแล้ว
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateEdit('pet_neutered', false)
                    }
                    className={`h-11 rounded-xl border text-sm font-bold ${editForm?.pet_neutered === false
                      ? 'border-orange-400 bg-orange-50 text-orange-500'
                      : 'border-gray-200 bg-white text-gray-600'
                      }`}
                  >
                    ยังไม่ได้ทำ
                  </button>

                </div>
              </div>

              {/* โรคประจำตัว */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">
                  โรคประจำตัว
                </span>

                <input
                  value={editForm?.pet_disease ?? ''}
                  onChange={(e) =>
                    updateEdit('pet_disease', e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                  placeholder="เช่น ไม่มี, โรคไต, เบาหวาน"
                />
              </label>

              {/* ปัญหาสุขภาพ */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">
                  ปัญหาสุขภาพ
                </span>

                <input
                  value={editForm?.pet_health ?? ''}
                  onChange={(e) =>
                    updateEdit('pet_health', e.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm"
                  placeholder="เช่น ไม่มี, แพ้อาหาร"
                />
              </label>

              {/* หมายเหตุ */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold">
                  หมายเหตุ
                </span>

                <textarea
                  value={editForm?.description ?? ''}
                  onChange={(e) =>
                    updateEdit('description', e.target.value)
                  }
                  rows="3"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                  placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับน้อง"
                />
              </label>

            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setEditForm({ ...pet })
              }}
              className="h-12 rounded-2xl border border-gray-200 bg-white text-sm font-bold"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="h-12 rounded-2xl bg-orange-500 text-sm font-bold text-white"
            >
              บันทึกการแก้ไข
            </button>

          </div>
        </form>
      ) : (
        <>
          <Section icon="fa-paw" title="ข้อมูลทั่วไป">
            <InfoRow
              icon="fa-signature"
              label="ชื่อ"
              value={pet?.pet_name || "-"}
            />

            <InfoRow
              icon="fa-paw"
              label="ประเภท"
              value={pet?.pet_species || "-"}
            />

            <InfoRow
              icon="fa-dna"
              label="สายพันธุ์"
              value={pet?.pet_breed || "-"}
            />

            <InfoRow
              icon="fa-weight-scale"
              label="น้ำหนัก"
              value={pet?.pet_weight ? `${pet.pet_weight} กก.` : "-"}
            />

            <InfoRow
              icon="fa-venus-mars"
              label="เพศ"
              value={pet?.pet_gender || "-"}
            />
          </Section>

          <Section icon="fa-heart" title="สุขภาพ">
            <InfoRow
              icon="fa-calendar"
              label="วันเกิด"
              value={pet?.pet_birthdate
                ? String(pet.pet_birthdate).slice(0, 10)
                : "-"}
            />

            <InfoRow
              icon="fa-scissors"
              label="การทำหมัน"
              value={pet?.pet_neutered ? "ทำแล้ว" : "ยังไม่ได้ทำ"}
            />

            <InfoRow
              icon="fa-notes-medical"
              label="โรคประจำตัว"
              value={pet?.pet_disease || "-"}
            />

            <InfoRow
              icon="fa-heart-pulse"
              label="ปัญหาสุขภาพ"
              value={pet?.pet_health || "-"}
            />
          </Section>

          <Section icon="fa-note-sticky" title="หมายเหตุ">
            <div className="px-4 py-4 text-sm text-gray-700">
              {pet?.description || "ไม่มีข้อมูล"}
            </div>
          </Section>
        </>
      )}
    </main>
    <BottomNavigation />
    {cropSrc && <ImageCropper src={cropSrc} onCancel={() => setCropSrc('')} onCrop={(image) => { updateEdit('image', image); setCropSrc('') }} />}
  </div>
}
