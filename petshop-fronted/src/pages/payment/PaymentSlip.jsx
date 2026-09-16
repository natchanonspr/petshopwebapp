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

      setError(
        error?.message ||
        'ไม่สามารถส่งสลิปได้',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>แนบหลักฐานการชำระเงิน</h1>

      <p>
        Order #{orderId}
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null)
          }}
        />

        {file && (
          <p>
            ไฟล์ที่เลือก: {file.name}
          </p>
        )}

        {error && (
          <p style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'กำลังส่ง...'
            : 'ส่งหลักฐานการชำระเงิน'}
        </button>
      </form>
    </div>
  )
}