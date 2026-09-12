const pets = [
  { id: 1, name: 'โมจิ', type: 'แมว', icon: '🐱' },
  { id: 2, name: 'มะลิ', type: 'สุนัข', icon: '🐶' },
]

export default function ProfilePets() {
  return (
    <section className="bg-white px-5 pb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-bold text-gray-900">🐾 สัตว์เลี้ยงของฉัน</h2>
        <button type="button" className="text-[10px] text-gray-400">ทั้งหมด</button>
      </div>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pets.map((pet) => (
          <button key={pet.id} type="button" className="relative flex h-[46px] min-w-[126px] items-center gap-2 rounded-full bg-blue-500 p-1 text-left text-white">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-xl">{pet.icon}</span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[11px]">{pet.name}</strong>
              <small className="block text-[9px] text-blue-100">{pet.type}</small>
            </span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-gray-800">
              <i className="fa-solid fa-ellipsis-vertical text-sm" />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
