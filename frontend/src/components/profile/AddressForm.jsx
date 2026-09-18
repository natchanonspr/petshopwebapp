import { useEffect, useMemo, useState } from 'react'

const THAILAND_GEOGRAPHY_URL = 'https://raw.githubusercontent.com/thailand-geography-data/thailand-geography-json/main/src/geography.json'
const THAILAND_GEOGRAPHY_CACHE = 'petshop_thailand_geography_v2'

// รายชื่อ 77 จังหวัดเป็น fallback เพื่อให้ช่องจังหวัดไม่หายแม้ API ภายนอกโหลดไม่ได้
const THAI_PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','ภูเก็ต','มหาสารคาม','มุกดาหาร','ยะลา','ยโสธร','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','สุโขทัย','หนองคาย','หนองบัวลำภู','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี','อ่างทอง','เชียงราย','เชียงใหม่','เพชรบุรี','เพชรบูรณ์','เลย','แพร่','แม่ฮ่องสอน','พระนครศรีอยุธยา'
].filter((name, index, list) => list.indexOf(name) === index)

function normalizeGeography(raw) {
  if (!Array.isArray(raw)) return { provinces: [], districts: [], subdistricts: [] }
  const provinces = [], districts = [], subdistricts = []
  const provinceName = (x) => x.name_th ?? x.name ?? x.province_name
  const districtName = (x) => x.name_th ?? x.name ?? x.amphure_name ?? x.district_name
  const subdistrictName = (x) => x.name_th ?? x.name ?? x.tambon_name ?? x.subdistrict_name
  raw.forEach((province) => {
    // รองรับทั้งโครงสร้างแบบ nested และ geography.json แบบ flat
    const flatProvinceId = province.provinceCode ?? province.province_code
    const flatDistrictId = province.districtCode ?? province.district_code
    const flatSubdistrictId = province.subdistrictCode ?? province.subdistrict_code
    const flatProvinceName = province.provinceNameTh ?? province.province_name_th
    const flatDistrictName = province.districtNameTh ?? province.district_name_th
    const flatSubdistrictName = province.subdistrictNameTh ?? province.subdistrict_name_th
    const flatZip = province.postalCode ?? province.postal_code ?? ''

    if (flatProvinceId != null && flatProvinceName) {
      provinces.push({ id: String(flatProvinceId), name: String(flatProvinceName) })
      if (flatDistrictId != null && flatDistrictName) {
        districts.push({ id: String(flatDistrictId), name: String(flatDistrictName), provinceId: String(flatProvinceId) })
        if (flatSubdistrictId != null && flatSubdistrictName) {
          subdistricts.push({ id: String(flatSubdistrictId), name: String(flatSubdistrictName), districtId: String(flatDistrictId), postalCode: String(flatZip || '') })
        }
      }
      return
    }

    const pid = province.id ?? province.province_id
    const pname = provinceName(province)
    const amphures = province.amphure ?? province.amphures ?? province.districts
    if (pid != null && pname && Array.isArray(amphures)) {
      provinces.push({ id: String(pid), name: String(pname) })
      amphures.forEach((district) => {
        const did = district.id ?? district.amphure_id ?? district.district_id
        const dname = districtName(district)
        if (did == null || !dname) return
        districts.push({ id: String(did), name: String(dname), provinceId: String(district.province_id ?? pid) })
        const tambons = district.tambon ?? district.tambons ?? district.subdistricts
        if (Array.isArray(tambons)) tambons.forEach((subdistrict) => {
          const sid = subdistrict.id ?? subdistrict.tambon_id ?? subdistrict.subdistrict_id
          const sname = subdistrictName(subdistrict)
          const zip = subdistrict.zip_code ?? subdistrict.postcode ?? subdistrict.postal_code ?? subdistrict.zipCode ?? ''
          if (sid != null && sname) subdistricts.push({ id: String(sid), name: String(sname), districtId: String(subdistrict.amphure_id ?? subdistrict.district_id ?? did), postalCode: String(zip || '') })
        })
      })
    }
  })
  const unique = (items) => Array.from(new Map(items.map((item) => [item.id, item])).values())
  return { provinces: unique(provinces), districts: unique(districts), subdistricts: unique(subdistricts) }
}

export default function AddressForm({ value, onChange, onSave, onCancel, editing }) {
  const [geography, setGeography] = useState({ provinces: [], districts: [], subdistricts: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const cached = JSON.parse(localStorage.getItem(THAILAND_GEOGRAPHY_CACHE) || 'null')
        if (cached?.provinces?.length && cached?.districts?.length && cached?.subdistricts?.length) {
          if (alive) setGeography(cached)
          return
        }
        const response = await fetch(THAILAND_GEOGRAPHY_URL)
        if (!response.ok) throw new Error('geography request failed')
        const normalized = normalizeGeography(await response.json())
        if (normalized.provinces.length) localStorage.setItem(THAILAND_GEOGRAPHY_CACHE, JSON.stringify(normalized))
        if (alive) setGeography(normalized)
      } catch {
        if (alive) setGeography({ provinces: THAI_PROVINCES.map((name, index) => ({ id: String(index + 1), name })), districts: [], subdistricts: [] })
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const districts = useMemo(() => geography.districts.filter((item) => String(item.provinceId) === String(value.provinceId)), [geography.districts, value.provinceId])
  const subdistricts = useMemo(() => geography.subdistricts.filter((item) => String(item.districtId) === String(value.districtId)), [geography.subdistricts, value.districtId])

  const field = (label, name, props = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-gray-600">{label}</span>
      <input {...props} name={name} value={value[name] || ''} onChange={(e) => onChange({ ...value, [name]: e.target.value })} className="h-11 w-full rounded-xl border-0 bg-gray-100 px-3 text-sm text-gray-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-200" />
    </label>
  )

  return (
    <form onSubmit={onSave} className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="m-0 text-base font-extrabold text-gray-900">{editing ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</h2><p className="m-0 mt-1 text-xs text-gray-400">กรอกข้อมูลสำหรับจัดส่งสินค้า</p></div>
        <span className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500"><i className="fa-solid fa-location-dot" /></span>
      </div>
      <div className="space-y-3">
        {field('ชื่อผู้รับ', 'recipient', { required: true, placeholder: 'ชื่อ-นามสกุล' })}
        {field('เบอร์โทรศัพท์', 'phone', { required: true, inputMode: 'tel', placeholder: '0812345678' })}
        {field('บ้านเลขที่ / หมู่ / ถนน', 'detail', { required: true, placeholder: 'เช่น 99/9 หมู่ 1 ถนน...' })}
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-gray-600">จังหวัด</span><select required disabled={loading} value={value.provinceId || ''} onChange={(e) => onChange({ ...value, provinceId: e.target.value, districtId: '', subdistrictId: '', postalCode: '' })} className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-orange-200"><option value="">{loading ? 'กำลังโหลดข้อมูล...' : 'เลือกจังหวัด'}</option>{geography.provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-gray-600">อำเภอ / เขต</span><select required disabled={!value.provinceId || loading} value={value.districtId || ''} onChange={(e) => onChange({ ...value, districtId: e.target.value, subdistrictId: '', postalCode: '' })} className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-orange-200"><option value="">เลือกอำเภอ / เขต</option>{districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-bold text-gray-600">ตำบล / แขวง</span><select required disabled={!value.districtId || loading} value={value.subdistrictId || ''} onChange={(e) => { const selected = subdistricts.find((item) => item.id === e.target.value); onChange({ ...value, subdistrictId: e.target.value, postalCode: selected?.postalCode || '' }) }} className="h-11 w-full rounded-xl bg-gray-100 px-3 text-sm outline-none disabled:opacity-50 focus:ring-2 focus:ring-orange-200"><option value="">เลือกตำบล / แขวง</option>{subdistricts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3">{field('รหัสไปรษณีย์', 'postalCode', { readOnly: true, placeholder: 'ระบบเติมให้อัตโนมัติ' })}<label className="flex items-end pb-0.5"><span className="flex h-11 w-full items-center justify-between rounded-xl bg-orange-50 px-3 text-xs font-bold text-orange-600">ตั้งเป็นที่อยู่หลัก<input type="checkbox" checked={Boolean(value.default)} onChange={(e) => onChange({ ...value, default: e.target.checked })} className="size-4 accent-orange-500" /></span></label></div>
      </div>
      <div className="mt-5 flex gap-2"><button type="button" onClick={onCancel} className="h-11 flex-1 rounded-full bg-gray-100 text-sm font-bold text-gray-600">ยกเลิก</button><button type="submit" className="h-11 flex-1 rounded-full bg-orange-500 text-sm font-bold text-white shadow-sm shadow-orange-500/20">{editing ? 'บันทึกการแก้ไข' : 'เพิ่มที่อยู่'}</button></div>
    </form>
  )
}
