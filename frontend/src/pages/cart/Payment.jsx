import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getOrder } from '../../api/orders.js'
import { QRCodeSVG } from 'qrcode.react'
import { uploadPaymentSlip } from '../../api/payment.js'

export default function Payment() {
  const { orderId } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadSuccessOpen, setUploadSuccessOpen] = useState(false)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const data = await getOrder(orderId)

        console.log('Payment order:', data)

        setOrder(data)
      } catch (error) {
        console.error(
          'Load payment order error:',
          error,
        )

        setErrorMessage(
          error?.message ||
          'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้',
        )
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      loadOrder()
    } else {
      setLoading(false)
      setErrorMessage(
        'ไม่พบรหัสคำสั่งซื้อ',
      )
    }
  }, [orderId])

  useEffect(() => {
    if (!orderId || !order) {
      return
    }

    if (order.payment_status === 'paid') {
      const timer = window.setTimeout(() => {
        navigate(`/orders/${orderId}`)
      }, 800)

      return () => window.clearTimeout(timer)
    }

    if (order.payment_status !== 'reviewing' && order.payment_status !== 'submitted') {
      return
    }

    const refreshOrder = async () => {
      try {
        const data = await getOrder(orderId)
        setOrder(data)
      } catch (error) {
        console.error('Refresh payment status error:', error)
      }
    }

    const interval = window.setInterval(refreshOrder, 2000)
    refreshOrder()

    return () => window.clearInterval(interval)
  }, [orderId, order?.payment_status, navigate])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) {
      return
    }

    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setUploadError('รองรับเฉพาะไฟล์ JPG และ PNG')
      setFile(null)
      setPreviewUrl('')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('ไฟล์สลิปต้องมีขนาดไม่เกิน 5MB')
      setFile(null)
      setPreviewUrl('')
      return
    }

    setUploadError('')
    setFile(selectedFile)

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
  }

  const handleUploadSlip = async () => {
    if (!file) {
      setUploadError('กรุณาเลือกไฟล์สลิป')
      return
    }

    try {
      setUploading(true)
      setUploadError('')

      const data = await uploadPaymentSlip(orderId, file)

      console.log('Upload slip result:', data)

      setOrder((prev) => ({
        ...prev,
        payment_status: 'reviewing',
        payment_submitted_at: data?.payment_submitted_at,
      }))

      setFile(null)
      setPreviewUrl('')
      setUploadOpen(false)
      setUploadSuccessOpen(true)
    } catch (error) {
      console.error('Upload slip error:', error)

      setUploadError(
        error?.message ||
        'ไม่สามารถส่งสลิปได้',
      )
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-center justify-center bg-gray-50 text-gray-900 shadow-[0_0_40px_rgba(17,24,39,0.10)]">
        <p className="text-sm text-gray-400">
          กำลังโหลดข้อมูลคำสั่งซื้อ...
        </p>
      </main>
    )
  }

  if (errorMessage || !order) {
    return (
      <main className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-gray-50 px-5 py-5 text-gray-900 shadow-[0_0_40px_rgba(17,24,39,0.10)]">

        <header className="rounded-b-[28px] bg-white px-5 py-4 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>

            <h1 className="text-xl font-bold">
              ชำระเงิน
            </h1>
          </div>
        </header>

        <section className="mt-5 rounded-3xl bg-white p-6 text-center shadow-sm">

          <div className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-500">
            <i className="fa-solid fa-circle-exclamation text-xl" />
          </div>

          <h2 className="mt-4 font-bold text-gray-900">
            ไม่สามารถโหลดคำสั่งซื้อได้
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            {errorMessage || 'ไม่พบข้อมูลคำสั่งซื้อ'}
          </p>

          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="mt-5 w-full rounded-full bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
          >
            ไปที่คำสั่งซื้อของฉัน
          </button>
        </section>
      </main>
    )
  }

  const totalAmount = Number(
    order.total_amount ??
    order.total ??
    0,
  )

  const paymentMethod =
    order.payment_method || 'qr'

  const paymentStatus =
    order.payment_status || 'unpaid'

  const isUnpaid =
    paymentStatus === 'unpaid'

  const isReviewing =
    paymentStatus === 'submitted' ||
    paymentStatus === 'reviewing'

  const isPaid =
    paymentStatus === 'paid'

  const isRejected =
    paymentStatus === 'rejected'

  const paymentMethodName =
    paymentMethod === 'promptpay'
      ? 'พร้อมเพย์'
      : 'สแกน QR'

  return (
    <main className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-gray-50 text-gray-900 shadow-[0_0_40px_rgba(17,24,39,0.10)]">

      {/* HEADER */}
      <header className="shrink-0 rounded-b-[28px] bg-white px-5 py-4 shadow-md">
        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="ย้อนกลับ"
            className="grid size-10 place-items-center rounded-full bg-gray-100 text-gray-500"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>

          <div>
            <h1 className="text-xl font-bold">
              ชำระเงิน
            </h1>

            <p className="text-xs text-gray-400">
              Order #{order.order_id}
            </p>
          </div>

        </div>
      </header>

      {/* CONTENT */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* ORDER SUMMARY */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
                <i className="fa-solid fa-receipt" />
              </div>

              <div>
                <h2 className="font-bold">
                  คำสั่งซื้อ
                </h2>

                <p className="text-xs text-gray-400">
                  #{order.order_id}
                </p>
              </div>

            </div>

            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold ${isPaid
                ? 'bg-green-100 text-green-600'
                : isReviewing
                  ? 'bg-blue-100 text-blue-600'
                  : isRejected
                    ? 'bg-red-100 text-red-600'
                    : 'bg-orange-100 text-orange-600'
                }`}
            >
              {isPaid
                ? 'ชำระแล้ว'
                : isReviewing
                  ? 'กำลังตรวจสอบ'
                  : isRejected
                    ? 'สลิปถูกปฏิเสธ'
                    : 'รอชำระเงิน'}
            </span>

          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">

            <div className="flex items-center justify-between">

              <span className="text-sm text-gray-500">
                ยอดที่ต้องชำระ
              </span>

              <strong className="text-xl font-bold text-orange-500">
                ฿
                {totalAmount.toLocaleString(
                  'th-TH',
                  {
                    minimumFractionDigits: 2,
                  },
                )}
              </strong>

            </div>

          </div>
        </section>

        {/* PAYMENT METHOD */}
        {isUnpaid && (
          <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
                <i
                  className={
                    paymentMethod === 'promptpay'
                      ? 'fa-solid fa-mobile-screen-button'
                      : 'fa-solid fa-qrcode'
                  }
                />
              </div>

              <div>
                <h2 className="font-bold">
                  {paymentMethodName}
                </h2>

                <p className="text-xs text-gray-400">
                  ชำระเงินสำหรับคำสั่งซื้อนี้
                </p>
              </div>

            </div>

            {/* QR */}
            <div className="mt-5 rounded-3xl bg-gray-50 p-5">

              <div className="mx-auto flex size-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">

                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-3">
                  <QRCodeSVG
                    value={`PETSHOP-ORDER-${order.order_id}-AMOUNT-${totalAmount.toFixed(2)}`}
                    size={190}
                    level="M"
                  />
                </div>

              </div>

              <p className="mt-4 text-center text-sm font-semibold text-gray-600">
                สแกน QR Code เพื่อชำระเงิน
              </p>

              <p className="mt-1 text-center text-[11px] text-gray-400">
                QR นี้เป็น QR จำลองสำหรับระบบทดสอบ
              </p>

            </div>

            {/* PAYMENT INFO */}
            <div className="mt-4 rounded-2xl bg-orange-50 p-4">

              <div className="flex gap-3">

                <i className="fa-solid fa-circle-info mt-0.5 text-orange-500" />

                <div>
                  <p className="text-xs font-bold text-orange-700">
                    กรุณาตรวจสอบยอดเงิน
                  </p>

                  <p className="mt-1 text-xs leading-5 text-orange-600">
                    ตรวจสอบยอดเงินให้ตรงกับยอดที่ต้องชำระก่อนยืนยันการโอนเงิน
                  </p>
                </div>

              </div>

            </div>

          </section>
        )}

        {/* INSTRUCTION */}
        {isUnpaid && (
          <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">

            <h2 className="font-bold">
              วิธีการชำระเงิน
            </h2>

            <div className="mt-4 space-y-3">

              {[
                'เปิดแอปพลิเคชันธนาคารของคุณ',
                'เลือกเมนูสแกน QR Code',
                'สแกน QR Code ด้านบน',
                'ตรวจสอบยอดเงินก่อนยืนยันการชำระเงิน',
                'หลังชำระเงินแล้ว แนบสลิปเพื่อยืนยัน',
              ].map((text, index) => (
                <div
                  key={text}
                  className="flex items-start gap-3"
                >

                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-orange-50 text-xs font-bold text-orange-500">
                    {index + 1}
                  </span>

                  <p className="pt-1 text-sm leading-5 text-gray-500">
                    {text}
                  </p>

                </div>
              ))}

            </div>

          </section>
        )}

        {/* REVIEWING */}
        {isReviewing && (
          <section className="mt-4 rounded-3xl bg-white p-6 text-center shadow-sm">

            <div className="mx-auto grid size-16 place-items-center rounded-full bg-blue-50 text-blue-500">
              <i className="fa-solid fa-clock text-2xl" />
            </div>

            <h2 className="mt-4 font-bold">
              กำลังตรวจสอบการชำระเงิน
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              ระบบได้รับสลิปของคุณแล้ว
              <br />
              กรุณารอ Admin ตรวจสอบ
            </p>

          </section>
        )}

        {/* PAID */}
        {isPaid && (
          <section className="mt-4 rounded-3xl bg-white p-6 text-center shadow-sm">

            <div className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-green-500">
              <i className="fa-solid fa-check text-2xl" />
            </div>

            <h2 className="mt-4 font-bold">
              ชำระเงินเรียบร้อยแล้ว
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              การชำระเงินสำหรับคำสั่งซื้อ
              #{order.order_id}
              <br />
              ได้รับการยืนยันแล้ว
            </p>

          </section>
        )}

        {/* REJECTED */}
        {isRejected && (
          <section className="mt-4 rounded-3xl bg-white p-6 text-center shadow-sm">

            <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
              <i className="fa-solid fa-xmark text-2xl" />
            </div>

            <h2 className="mt-4 font-bold">
              ไม่สามารถยืนยันการชำระเงินได้
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              สลิปถูกปฏิเสธ
              <br />
              กรุณาตรวจสอบและส่งสลิปใหม่
            </p>

          </section>
        )}

      </div>

      {/* BOTTOM ACTION */}
      {isUnpaid && (
        <section className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm">

          {/* Header */}
          <button
            type="button"
            onClick={() => setUploadOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">

              <div className="grid size-10 place-items-center rounded-full bg-orange-50 text-orange-500">
                <i className="fa-solid fa-paperclip" />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  แนบหลักฐานการชำระเงิน
                </h2>

                <p className="text-xs text-gray-400">
                  หลังโอนเงินแล้ว แนบรูปสลิปที่นี่
                </p>
              </div>

            </div>

            <div className="grid size-9 place-items-center rounded-full bg-gray-100 text-gray-500">
              <i
                className={
                  uploadOpen
                    ? 'fa-solid fa-chevron-up'
                    : 'fa-solid fa-chevron-down'
                }
              />
            </div>
          </button>

          {/* Expand content */}
          {uploadOpen && (
            <div className="border-t border-gray-100 px-5 pb-5 pt-4">

              {/* Upload */}
              <label
                htmlFor="payment-slip"
                className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50 px-5 py-7 transition hover:bg-orange-100"
              >

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Payment slip preview"
                    className="max-h-72 w-full rounded-2xl object-contain"
                  />
                ) : (
                  <>
                    <div className="grid size-12 place-items-center rounded-full bg-white text-orange-500 shadow-sm">
                      <i className="fa-solid fa-image" />
                    </div>

                    <p className="mt-3 text-sm font-bold text-gray-700">
                      แตะเพื่อเพิ่มรูปสลิป
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      JPG หรือ PNG ไม่เกิน 5MB
                    </p>
                  </>
                )}

                <input
                  id="payment-slip"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />

              </label>

              {/* Selected file */}
              {file && (
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">

                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-green-50 text-green-500">
                    <i className="fa-solid fa-check" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-700">
                      {file.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      setPreviewUrl('')
                      setUploadError('')
                    }}
                    className="grid size-9 place-items-center rounded-full bg-red-50 text-red-500"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>

                </div>
              )}

              {/* Error */}
              {uploadError && (
                <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-600">
                  <i className="fa-solid fa-circle-exclamation mr-2" />
                  {uploadError}
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                disabled={!file || uploading}
                onClick={handleUploadSlip}
                className="mt-4 w-full rounded-full bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
              >
                {uploading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    กำลังส่งสลิป...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-upload mr-2" />
                    ส่งหลักฐานการชำระเงิน
                  </>
                )}
              </button>

            </div>
          )}

        </section>
      )}

      {isRejected && (

        <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">

          <button
            type="button"
            onClick={() =>
              navigate(`/payment/${orderId}/slip`)
            }
            className="w-full rounded-full bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
          >
            <i className="fa-solid fa-upload mr-2" />
            แนบสลิปใหม่
          </button>

        </div>)}

      {uploadSuccessOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-green-500">
              <i className="fa-solid fa-check text-2xl" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              ส่งสลิปเรียบร้อยแล้ว
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              ระบบได้รับสลิปของคุณแล้ว
              <br />
              กรุณารอ Admin ตรวจสอบการชำระเงิน
            </p>

            <button
              type="button"
              onClick={() => setUploadSuccessOpen(false)}
              className="mt-5 w-full rounded-full bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {(isReviewing || isPaid) && (
        <div className="absolute bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-gray-100 bg-white px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/orders/${order.order_id}`,
              )
            }
            className="w-full rounded-full bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
          >
            ดูรายละเอียดคำสั่งซื้อ
          </button>

        </div>
      )}

    </main>
  )
}
