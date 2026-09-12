import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PetCard from '../pets/PetCard.jsx'
import { getPets } from '../../api/pets.js'

export default function PetSection() {
  const [pets, setPets] = useState([])

  useEffect(() => {
    let active = true
    getPets()
      .then((data) => { if (active) setPets(data) })
      .catch((err) => console.error('load pets (home) error:', err))
    return () => { active = false }
  }, [])

  return (
    <section className="mb-2">
      <div className="mb-3 flex items-center justify-between px-0.5">
        <h2 className="m-0 text-base font-bold leading-tight text-slate-900">สัตว์เลี้ยงของคุณ</h2>
        <Link
          to="/pets"
          className="text-sm font-medium text-orange-500 transition-opacity active:opacity-70"
        >
          ดูทั้งหมด <i className="fa-solid fa-chevron-right ml-0.5 text-[10px]" />
        </Link>
      </div>

      <div className="flex min-w-0 gap-3 overflow-x-auto overflow-y-hidden px-1 py-2 pr-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        {pets.map((pet) => (
          <PetCard key={pet.pet_id} pet={pet} />
        ))}
        <PetCard add />
      </div>
    </section>
  )
}
