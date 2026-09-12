export const PET_STORAGE_KEY = 'petshop-pets'
export const PETS_UPDATED_EVENT = 'petshop-pets-updated'

export const defaultPets = [
  { id: 1, name: 'มิกกี้', type: 'แมว', breed: 'แมวพันธุ์', age: '2 ปี', weight: '4 กก.', icon: 'fa-cat', gender: 'ตัวเมีย', color: 'pink', favorite: true, born: '15 พฤษภาคม 2567', neutered: 'ทำแล้ว', disease: 'ไม่มี', health: 'ไม่มี', note: '-' },
  { id: 2, name: 'ปุยหยุ่น', type: 'สุนัข', breed: 'ชิวาวาพันธุ์ยาว', age: '3 ปี', weight: '2.8 กก.', icon: 'fa-dog', gender: 'ตัวผู้', color: 'green', favorite: false, born: '10 มีนาคม 2566', neutered: 'ทำแล้ว', disease: 'ไม่มี', health: 'ไม่มี', note: '-' },
]

export function getPets() {
  try {
    const saved = window.localStorage.getItem(PET_STORAGE_KEY)
    return saved ? JSON.parse(saved) : defaultPets
  } catch {
    return defaultPets
  }
}

export function savePets(pets) {
  window.localStorage.setItem(PET_STORAGE_KEY, JSON.stringify(pets))
  window.dispatchEvent(new Event(PETS_UPDATED_EVENT))
}
