import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { uploadPaymentSlip } from '../../api/payment'

export default function PaymentSlip() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('กรุณาเลือกไฟล์สลิป')
      return
    }

    try {
      setLoading(true)
      setError('')

      await uploadPaymentSlip(orderId, file)

      alert('ส่งสลิปเรียบร้อยแล้ว กรุณารอ Admin ตรวจสอบ')
      navigate(`/orders/${orderId}`)
    } catch (error) {
      console.error(error)
      setError(error?.message || 'ไม่สามารถส่งสลิปได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-gray-50 px-4 py-4 text-gray-900 sm:flex sm:items-center sm:justify-center sm:px-6">
      <section className="mx-auto flex w-full max-w-[430px] flex-col rounded-[28px] bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 grid size-10 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600"
          aria-label="ย้อนกลับ"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>

        <div className="text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-orange-50 text-orange-500">
            <i className="fa-solid fa-receipt text-xl" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold">แนบหลักฐานการชำระเงิน</h1>
          <p className="mt-1 text-sm text-gray-400">Order #{orderId}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center transition hover:border-orange-300 hover:bg-orange-50">
            <i className="fa-solid fa-cloud-arrow-up text-2xl text-orange-500" />
            <span className="mt-2 text-sm font-bold text-gray-700">
              {file ? 'เปลี่ยนไฟล์สลิป' : 'เลือกไฟล์สลิป'}
            </span>
            <span className="mt-1 break-all text-xs text-gray-400">
              {file ? file.name : 'รองรับไฟล์รูปภาพ'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null)
                setError('')
              }}
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="mt-1 flex min-h-12 w-full items-center justify-center rounded-full bg-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            {loading ? 'กำลังส่ง...' : 'ส่งหลักฐานการชำระเงิน'}
          </button>
        </form>
      </section>
    </main>
  )
}
