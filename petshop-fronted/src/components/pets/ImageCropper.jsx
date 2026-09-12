import { useEffect, useState } from 'react'

export default function ImageCropper({ src, onCancel, onCrop }) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState(null)

  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [src])

  const move = (event) => {
    if (!dragging || !start) return
    const point = event.touches?.[0] || event
    setPosition({ x: start.x + point.clientX - start.clientX, y: start.y + point.clientY - start.clientY })
  }

  const finish = () => {
    setDragging(false)
    setStart(null)
  }

  const crop = () => {
    const image = new Image()
    image.onload = () => {
      const size = 500
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const scale = Math.max(size / image.width, size / image.height) * zoom
      const width = image.width * scale
      const height = image.height * scale
      const x = (size - width) / 2 + position.x
      const y = (size - height) / 2 + position.y
      ctx.drawImage(image, x, y, width, height)
      onCrop(canvas.toDataURL('image/jpeg', 0.9))
    }
    image.src = src
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 min-[431px]:items-center">
      <div className="w-full max-w-[430px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="px-5 pt-5">
          <h1 className="text-lg font-bold text-gray-900">Crop Image </h1>
          </div>

        <div className="px-5">
          <div
            className="relative mx-auto aspect-square max-w-[330px] touch-none overflow-hidden rounded-full bg-gray-100 ring-4 ring-orange-100"
            onWheel={(e) => {
              e.preventDefault()
              setZoom((current) => Math.min(3, Math.max(1, Number((current - e.deltaY * 0.002).toFixed(2)))))
            }}
            onMouseDown={(e) => { setDragging(true); setStart({ clientX: e.clientX, clientY: e.clientY, ...position }) }}
            onMouseMove={move}
            onMouseUp={finish}
            onMouseLeave={finish}
            onTouchStart={(e) => { const p = e.touches[0]; setDragging(true); setStart({ clientX: p.clientX, clientY: p.clientY, ...position }) }}
            onTouchMove={move}
            onTouchEnd={finish}
          >
            <img src={src} alt="ตัวอย่างรูปที่ครอป" draggable="false" className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none" style={{ width: `${Math.max(100, 100 * zoom)}%`, height: 'auto', transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }} />
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/80" />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <i className="fa-solid fa-minus text-xs text-gray-400" />
            <input aria-label="ซูมรูป" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-orange-500" />
            <i className="fa-solid fa-plus text-xs text-gray-400" />
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400">ลากรูปเพื่อจัดตำแหน่ง · เลื่อนแถบเพื่อซูม</p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 pt-4">
          <button type="button" onClick={onCancel} className="h-12 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700">ยกเลิก</button>
          <button type="button" onClick={crop} className="h-12 rounded-2xl bg-orange-500 text-sm font-bold text-white">ใช้รูปนี้</button>
        </div>
      </div>
    </div>
  )
}
