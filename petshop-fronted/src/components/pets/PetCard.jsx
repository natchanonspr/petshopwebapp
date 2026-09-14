import { Link } from 'react-router-dom'

function ageFromBirthdate(birthdate) {
  if (!birthdate) return '-'
  const born = new Date(birthdate)
  if (Number.isNaN(born.getTime())) return '-'
  const now = new Date()
  let years = now.getFullYear() - born.getFullYear()
  let months = now.getMonth() - born.getMonth()
  if (now.getDate() < born.getDate()) months -= 1
  if (months < 0) { years -= 1; months += 12 }
  if (years <= 0) return `${Math.max(months, 0)} เดือน`
  return `${years} ปี`
}

export default function PetCard({ pet, variant = 'compact', onEdit, onDelete, isMain = false, add = false }) {
  if (add) {
    return (
      <Link to="/pets" className="flex h-[142px] w-[121px] shrink-0 flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-slate-300 bg-white px-2 py-3 text-slate-400 active:bg-slate-50">
        <span className="grid size-14 place-items-center rounded-full bg-slate-50 text-slate-400"><i className="fa-solid fa-plus text-xl font-normal" /></span>
        <span className="text-xs font-medium">เพิ่มสัตว์เลี้ยง</span>
      </Link>
    )
  }

  const icon = pet.pet_species === 'สุนัข' ? 'fa-dog' : 'fa-cat'
  const image = pet.image ? (
    <img
      src={pet.image}
      alt={pet.pet_name || 'สัตว์เลี้ยง'}
      className="h-full w-full object-cover"
      onError={(event) => {
        event.currentTarget.style.display = 'none'
        event.currentTarget.nextElementSibling?.classList.remove('hidden')
      }}
    />
  ) : null
  const fallbackIcon = <i className={`fa-solid ${icon} text-orange-300`} />

  if (variant === 'full') {
    return (
      <article className="relative overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.07)]">
        <div className="p-3">
          <div className="flex gap-3">
            <div className="relative flex h-[142px] w-[128px] shrink-0 items-center justify-center overflow-hidden rounded-[19px] bg-orange-50">
              {pet.image ? image : null}
                <div className={pet.image ? 'hidden h-full w-full items-center justify-center text-[82px]' : 'flex h-full w-full items-center justify-center text-[82px]'}>{fallbackIcon}</div>
              </div>

            <div className="min-w-0 flex-1 py-2 pl-3 pr-10">
              <div className="min-w-0">
                <h3 className="m-0 truncate text-xl font-bold text-gray-900">
                  {pet.pet_name}{' '}
                  <span className={pet.pet_gender === 'ตัวเมีย' ? 'text-pink-500' : 'text-green-500'}>
                    {pet.pet_gender === 'ตัวเมีย' ? '♀' : '♂'}
                  </span>
                </h3>
                <p className="m-0 mt-0.5 truncate text-xs text-gray-600">{pet.pet_breed || 'ไม่ระบุสายพันธุ์'}</p>
              </div>

              <div className="mt-3 space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2"><i className="fa-solid fa-paw w-4 text-gray-400" /><span>{pet.pet_species}</span></div>
                <div className="flex items-center gap-2"><i className="fa-regular fa-calendar w-4 text-gray-400" /><span>{ageFromBirthdate(pet.pet_birthdate)}</span></div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-weight-scale w-4 text-gray-400" /><span>{pet.pet_weight ? `${pet.pet_weight} กก.` : '-'}</span></div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
            <Link to={`/pets/${pet.pet_id}`} className="flex h-12 flex-col items-center justify-center gap-0.5 border-r border-gray-100 bg-white text-orange-500 active:bg-orange-50">
              <i className="fa-regular fa-file-lines text-sm" /><span className="text-[10px] font-bold">ดูข้อมูล</span>
            </Link>
            <button type="button" onClick={() => onEdit?.(pet)} className="flex h-12 flex-col items-center justify-center gap-0.5 border-r border-gray-100 bg-white text-gray-700 active:bg-gray-50">
              <i className="fa-solid fa-pen text-sm" /><span className="text-[10px] font-bold">แก้ไขข้อมูล</span>
            </button>
            <button type="button" onClick={() => onDelete?.(pet)} className="flex h-12 flex-col items-center justify-center gap-0.5 bg-white text-red-500 active:bg-red-50">
              <i className="fa-regular fa-trash-can text-sm" /><span className="text-[10px] font-bold">ลบ</span>
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="relative h-[142px] w-[121px] shrink-0 rounded-[24px] border border-slate-100 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.07)] transition-transform active:scale-[0.98]">
      <Link to={`/pets/${pet.pet_id}`} className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[24px] px-2 py-3">
        <span className="grid size-14 place-items-center overflow-hidden rounded-full bg-orange-50 text-[23px]">
          {pet.image ? image : fallbackIcon}
        </span>
        <span className="text-center">
          <strong className="block text-sm font-bold leading-tight text-slate-800">{pet.pet_name}</strong>
          <span className="mt-1 block whitespace-nowrap text-[10px] font-medium leading-tight text-slate-400">{pet.pet_breed || pet.pet_species}</span>
        </span>
      </Link>
    </div>
  )
}
