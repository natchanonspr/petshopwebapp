import { Link } from 'react-router-dom'

export default function PetCard({ pet, add = false }) {
  if (add) {
    return (
      <Link
        to="/pets"
        className="flex h-[142px] w-[121px] shrink-0 flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-slate-300 bg-white px-2 py-3 text-slate-400 transition-colors active:bg-slate-50"
      >
        <span className="grid size-14 place-items-center rounded-full bg-slate-50 text-slate-400">
          <i className="fa-solid fa-plus text-xl font-normal" />
        </span>

        <span className="text-xs font-medium">
          เพิ่มสัตว์เลี้ยง
        </span>
      </Link>
    )
  }

  console.log('========== PET CARD ==========')
  console.log('pet:', pet)
  console.log('pet_id:', pet?.pet_id)

  if (!pet?.pet_id) {
    console.error('PetCard ไม่มี pet_id:', pet)
    return null
  }

  const icon =
    pet.pet_species === 'สุนัข'
      ? 'fa-dog'
      : 'fa-cat'

  return (
    <Link
      to={`/pets/${pet.pet_id}`}
      className="flex h-[142px] w-[121px] shrink-0 flex-col items-center justify-center gap-2 rounded-[24px] border border-slate-100 bg-white px-2 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.07)] transition-transform active:scale-[0.98]"
    >
      <span className="grid size-14 place-items-center overflow-hidden rounded-full bg-orange-50 text-[23px] text-orange-500">
        {pet.image ? (
          <img
            src={pet.image}
            alt={pet.pet_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <i className={`fa-solid ${icon}`} />
        )}
      </span>

      <span className="text-center">
        <strong className="block text-sm font-bold leading-tight text-slate-800">
          {pet.pet_name}
        </strong>

        <span className="mt-1 block whitespace-nowrap text-[10px] font-medium leading-tight text-slate-400">
          {pet.pet_species}
        </span>
      </span>
    </Link>
  )
}