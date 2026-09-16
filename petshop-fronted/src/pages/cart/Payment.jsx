import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Payment() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        // ตอนนี้ใช้ข้อมูลจำลองก่อน
        const mockOrder = {
          order_id: orderId,
          total_amount: 1070,
          payment_method: 'promptpay',
          payment_status: 'waiting_slip',
        }

        setOrder(mockOrder)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId])

  if (loading) {
    return <div>กำลังโหลด...</div>
  }

  if (!order) {
    return <div>ไม่พบคำสั่งซื้อ</div>
  }

  return (
    <div className="payment-page">
      <h1>ชำระเงิน</h1>

      <p>
        หมายเลขคำสั่งซื้อ: #{order.order_id}
      </p>

      <h2>
        ยอดที่ต้องชำระ: ฿
        {Number(order.total_amount).toLocaleString(
          'th-TH',
          {
            minimumFractionDigits: 2,
          },
        )}
      </h2>

      <div>
        <h3>PromptPay</h3>

        <div
          style={{
            width: 250,
            height: 250,
            border: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '20px 0',
          }}
        >
          QR CODE
        </div>

        <p>
          QR นี้เป็น QR จำลองสำหรับระบบทดสอบ
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          navigate(`/payment/${orderId}/slip`)
        }
      >
        ชำระเงินแล้ว แนบสลิป
      </button>
    </div>
  )
}