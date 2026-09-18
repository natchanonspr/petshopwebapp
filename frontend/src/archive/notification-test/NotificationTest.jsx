import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addNotification, clearNotifications, isIOS, isStandalonePWA, notificationPermissionStatus, requestNotificationPermission } from '../../lib/notifications.js'
import { enableNotificationSound, isNotificationSoundEnabled, playNotificationSound, setNotificationSoundEnabled } from '../../lib/notificationSound.js'
import { sendNotificationRealtime } from '../../lib/notificationRealtime.js'

const presets = [
  { type: 'order', icon: 'fa-box-open', title: 'คำสั่งซื้อของคุณกำลังจัดส่ง 📦', detail: 'Royal Canin Adult 3kg กำลังเดินทางมาหาคุณ', label: 'ทดสอบคำสั่งซื้อ' },
  { type: 'promo', icon: 'fa-tag', title: 'คูปองส่วนลด 10% รอคุณอยู่ 🎉', detail: 'ใช้โค้ด PAWPAL10 ลดสูงสุด 100 บาท', label: 'ทดสอบโปรโมชั่น' },
  { type: 'pet', icon: 'fa-heart', title: 'ถึงเวลาดูแลน้องแล้ว 🐾', detail: 'อย่าลืมเตรียมอาหารมื้อถัดไปให้น้องนะ', label: 'ทดสอบแจ้งเตือนสัตว์เลี้ยง' },
  { type: 'system', icon: 'fa-bell', title: 'มีการแจ้งเตือนใหม่ 🔔', detail: 'ระบบ Pet Shop ส่งข้อความถึงคุณ', label: 'ทดสอบระบบ' },
]

export default function NotificationTest() {
  const [permission, setPermission] = useState(() => notificationPermissionStatus())
  const [soundEnabled, setSoundEnabled] = useState(() => isNotificationSoundEnabled())
  const iosNeedsHomeScreen = isIOS() && !isStandalonePWA()
  const [lastSent, setLastSent] = useState('ยังไม่มีการส่งแจ้งเตือน')
  const [wsHint, setWsHint] = useState('กำลังเชื่อมต่อ WebSocket…')

  const enable = async () => setPermission(await requestNotificationPermission())

  const toggleSound = async () => {
    const next = !soundEnabled
    if (next) await enableNotificationSound()
    setNotificationSoundEnabled(next)
    setSoundEnabled(next)
    if (next) await playNotificationSound()
  }

  const testSound = async () => {
    await enableNotificationSound()
    await playNotificationSound()
  }

  const send = async (preset) => {
    if (soundEnabled) await playNotificationSound()
    const notification = { ...preset, time: 'เมื่อสักครู่นี้', unread: true }
    addNotification({ ...notification, notifyBrowser: true, sound: false })
    const sent = sendNotificationRealtime(notification)
    setWsHint(sent ? '🟢 WebSocket เชื่อมต่อแล้ว — ส่งถึงเครื่องอื่น' : '🟠 WebSocket ยังไม่เชื่อมต่อ — รอสักครู่แล้วลองใหม่')
    setLastSent(sent ? `${preset.title} — ส่งไปยังเครื่องอื่นแล้ว` : `${preset.title} — WebSocket ยังไม่เชื่อมต่อ`)
  }

  const clearAll = () => {
    clearNotifications()
    setLastSent('เคลียร์แจ้งเตือนทั้งหมดแล้ว')
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <header className="shrink-0 bg-white px-5 pb-5 pt-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/notifications" aria-label="กลับไปการแจ้งเตือน" className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-700 active:scale-95"><i className="fa-solid fa-arrow-left" /></Link>
          <div><h1 className="m-0 text-xl font-bold">ทดสอบแจ้งเตือน</h1><p className="m-0 mt-0.5 text-xs text-slate-400">หน้าสำหรับยิง Notification ทดลอง</p></div>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section className="rounded-[24px] bg-white p-5 shadow-[0_3px_14px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3"><div><p className="m-0 text-sm font-bold">สถานะ Browser Notification</p><p className="m-0 mt-1 text-xs text-slate-400">ตอนนี้: {permission}</p></div><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${permission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>{permission === 'granted' ? 'พร้อมเด้ง' : iosNeedsHomeScreen ? 'ต้องเพิ่มไปหน้าหลัก' : 'ยังไม่เปิด'}</span></div>
          {iosNeedsHomeScreen && <div className="mt-4 rounded-2xl bg-orange-50 p-4 text-xs leading-5 text-orange-700"><p className="m-0 font-bold">📱 iPhone ต้องเพิ่ม Pet Shop ไปที่หน้าจอโฮมก่อน</p><p className="m-0 mt-1.5">ใน Safari กด Share → <b>Add to Home Screen / เพิ่มไปยังหน้าจอโฮม</b> → เปิด Pet Shop จากไอคอนบนหน้าจอโฮม → กลับมากดเปิดแจ้งเตือน</p></div>}
          {permission === 'denied' && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-xs leading-5 text-red-700">สิทธิ์ถูกปฏิเสธแล้ว ให้ไปที่ Settings → Notifications → Pet Shop แล้วเปิด Allow Notifications จากนั้นเปิด Pet Shop ใหม่</div>}
+          <button type="button" onClick={enable} disabled={permission === 'granted' || iosNeedsHomeScreen} className="mt-4 w-full rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white shadow-sm active:scale-[.99] disabled:bg-slate-200 disabled:text-slate-400"><i className="fa-solid fa-bell mr-2" />{permission === 'granted' ? 'เปิดแจ้งเตือนแล้ว' : iosNeedsHomeScreen ? 'เพิ่มไปหน้าจอโฮมก่อน' : 'เปิดสิทธิ์แจ้งเตือน'}</button>
        </section>
        <section className="mt-5 rounded-[24px] bg-white p-5 shadow-[0_3px_14px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3"><div><p className="m-0 text-sm font-bold">เสียงแจ้งเตือน</p><p className="m-0 mt-1 text-xs text-slate-400">เปิดเสียงเมื่อมี Notification ใหม่</p></div><button type="button" role="switch" aria-checked={soundEnabled} onClick={toggleSound} className={`relative h-7 w-12 rounded-full transition ${soundEnabled ? 'bg-orange-500' : 'bg-slate-200'}`}><span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${soundEnabled ? 'left-6' : 'left-1'}`} /></button></div>
          <button type="button" onClick={testSound} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-700 active:scale-[.99]"><i className="fa-solid fa-volume-high" /> ทดสอบเสียง</button>
        </section>
        <section className="mt-5"><h2 className="mb-3 text-base font-bold">กดเพื่อยิงแจ้งเตือน</h2><div className="space-y-3">{presets.map((preset) => <button key={preset.type} type="button" onClick={() => send(preset)} className="flex w-full items-center gap-3 rounded-[22px] border border-slate-100 bg-white p-4 text-left shadow-[0_3px_14px_rgba(15,23,42,0.05)] transition active:scale-[.99]"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500"><i className={`fa-solid ${preset.icon}`} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-700">{preset.label}</span><span className="mt-1 block truncate text-xs text-slate-400">{preset.detail}</span></span><i className="fa-solid fa-paper-plane text-slate-300" /></button>)}</div></section>
        <section className="mt-5 rounded-[22px] border border-slate-100 bg-white p-4"><p className="m-0 text-xs font-semibold text-slate-400">สถานะการเชื่อมต่อ</p><p className="m-0 mt-1 text-sm font-bold text-slate-700">{wsHint}</p><p className="m-0 mt-3 text-xs font-semibold text-slate-400">รายการล่าสุดที่ยิง</p><p className="m-0 mt-1 text-sm font-bold text-slate-700">{lastSent}</p></section>
        <button type="button" onClick={clearAll} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 transition active:scale-[.99]"><i className="fa-solid fa-trash-can" /> เคลียร์แจ้งเตือนทั้งหมด</button>
        <Link to="/notifications" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-white active:scale-[.99]"><i className="fa-solid fa-list" /> ดูหน้าการแจ้งเตือน</Link>
      </main>
    </div>
  )
}
