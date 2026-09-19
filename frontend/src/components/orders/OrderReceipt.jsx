import { useMemo } from 'react'

const paymentStatusMap = {
    unpaid: 'รอชำระเงิน',
    reviewing: 'กำลังตรวจสอบ',
    paid: 'ชำระเงินแล้ว',
    rejected: 'สลิปถูกปฏิเสธ',
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function formatDateTime(value) {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return '-'
    }

    return date.toLocaleString('th-TH')
}

export default function OrderReceipt({
    open,
    onClose,
    order,
    store,
}) {
    const subtotal = useMemo(() => {
        if (order?.subtotal_amount !== undefined) {
            return Number(order.subtotal_amount || 0)
        }

        return (order?.items || []).reduce(
            (sum, item) =>
                sum +
                Number(item.order_price || 0) *
                Number(item.order_quantity || 0),
            0,
        )
    }, [order])

    const discount = Number(
        order?.discount_amount || 0,
    )

    const shipping = Number(
        order?.shipping_amount || 0,
    )

    const tax = Number(
        order?.tax_amount || 0,
    )

    const total = Number(
        order?.total_amount || 0,
    )

    const orderDisplayId =
        order?.displayId ||
        `#PP-${String(
            order?.order_id || '',
        ).padStart(4, '0')}`

    const paymentStatus =
        paymentStatusMap[order?.payment_status] ||
        order?.payment ||
        order?.payment_status ||
        'ไม่ระบุ'

    if (!open || !order) {
        return null
    }

    return (
        <>
            <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .order-receipt-print,
          .order-receipt-print * {
            visibility: visible !important;
          }

          .order-receipt-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .order-receipt-overlay {
            position: static !important;
            display: block !important;
            background: #fff !important;
            padding: 0 !important;
          }

          .order-receipt-header,
          .order-receipt-actions {
            display: none !important;
          }
        }
      `}</style>

            <div className="order-receipt-overlay fixed inset-0 z-[90] flex items-center justify-center bg-gray-950/50 p-4">

                <div className="order-receipt-container max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-gray-100 p-5 shadow-2xl">

                    {/* Preview Header */}
                    <div className="order-receipt-header mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Preview ใบเสร็จ
                            </h2>

                            <p className="mt-1 text-xs text-gray-400">
                                ตัวอย่างใบเสร็จสำหรับพิมพ์
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="grid size-9 place-items-center rounded-lg text-gray-400 transition hover:bg-white"
                            aria-label="ปิด"
                        >
                            <i className="fa-solid fa-xmark" />
                        </button>
                    </div>

                    {/* Receipt */}
                    <div className="order-receipt-print relative mx-auto max-w-[330px] bg-white px-5 py-6 text-gray-900 shadow-[0_8px_25px_rgba(30,30,50,0.10)]">

                        {/* Store */}
                        <div className="text-center">

                            <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-xl text-gray-700">
                                {store?.image ? (
                                    <img
                                        src={store.image}
                                        alt="โลโก้ร้าน"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <i className="fa-solid fa-paw text-3xl" />
                                )}
                            </div>

                            <h3 className="mt-2 text-base font-black uppercase tracking-tight">
                                {store?.name || 'PetShop'}
                            </h3>

                            <p className="mx-auto mt-1 max-w-[280px] whitespace-pre-line text-[9px] leading-4 text-gray-500">
                                {store?.address || '-'}
                            </p>

                            <p className="mt-0.5 text-[9px] text-gray-500">
                                โทร {store?.phone || '-'}
                            </p>

                            <p className="mt-0.5 text-[8px] text-gray-400">
                                เลขประจำตัวผู้เสียภาษี:{' '}
                                {store?.taxId || '-'}
                            </p>

                        </div>

                        <div className="my-4 border-t border-dashed border-gray-400" />

                        {/* Receipt heading */}
                        <div className="text-center">
                            <p className="text-xs font-black tracking-widest">
                                ใบเสร็จรับเงิน
                            </p>

                            <p className="mt-1 text-[8px] text-gray-400">
                                RECEIPT / PAYMENT CONFIRMATION
                            </p>
                        </div>

                        {/* Order information */}
                        <div className="mt-3 grid grid-cols-2 gap-1 text-[8px] text-gray-500">

                            <span>
                                เลขที่:{' '}
                                <b className="text-gray-700">
                                    {orderDisplayId}
                                </b>
                            </span>

                            <span className="text-right">
                                {formatDateTime(order.created_at)}
                            </span>

                        </div>

                        <div className="my-4 border-t border-gray-300" />

                        {/* Item heading */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-[8px] font-bold text-gray-500">
                            <span>รายการ</span>
                            <span>จำนวน</span>
                            <span>รวม</span>
                        </div>

                        {/* Items */}
                        <div className="mt-2 space-y-2.5">

                            {(order.items || []).map((item) => {
                                const price =
                                    Number(item.order_price || 0)

                                const quantity =
                                    Number(item.order_quantity || 0)

                                const itemTotal =
                                    price * quantity

                                return (
                                    <div
                                        key={item.order_item_id}
                                        className="grid grid-cols-[1fr_auto_auto] items-start gap-x-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold leading-3.5 text-gray-800">
                                                {item.product_name ||
                                                    `สินค้า #${item.product_id}`}
                                            </p>

                                            <p className="text-[8px] text-gray-400">
                                                ฿{formatMoney(price)} / ชิ้น
                                            </p>
                                        </div>

                                        <span className="text-[9px] text-gray-600">
                                            {quantity}
                                        </span>

                                        <span className="text-right text-[9px] font-bold">
                                            ฿{formatMoney(itemTotal)}
                                        </span>
                                    </div>
                                )
                            })}

                        </div>

                        <div className="my-4 border-t border-dashed border-gray-400" />

                        {/* Summary */}
                        <div className="space-y-1.5 text-[9px]">

                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    รวมค่าสินค้า
                                </span>

                                <span>
                                    ฿{formatMoney(subtotal)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    ส่วนลด
                                    {order.coupon_code
                                        ? ` (${order.coupon_code})`
                                        : ''}
                                </span>

                                <span>
                                    -฿{formatMoney(discount)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    ค่าจัดส่ง
                                </span>

                                <span>
                                    {shipping > 0
                                        ? `฿${formatMoney(shipping)}`
                                        : 'ฟรี'}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">
                                    VAT 7%
                                </span>

                                <span>
                                    ฿{formatMoney(tax)}
                                </span>
                            </div>

                            <div className="mt-2 flex items-end justify-between border-t-2 border-gray-900 pt-3">

                                <span className="text-[11px] font-black">
                                    ยอดชำระสุทธิ
                                </span>

                                <span className="text-lg font-black">
                                    ฿{formatMoney(total)}
                                </span>

                            </div>

                        </div>

                        {/* Payment */}
                        <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-[8px] text-gray-500">

                            <div className="flex justify-between">
                                <span>ชำระโดย</span>

                                <b className="text-gray-700">
                                    {order.payment_method ||
                                        'ไม่ระบุ'}
                                </b>
                            </div>

                            <div className="mt-1 flex justify-between">

                                <span>สถานะ</span>

                                <b
                                    className={
                                        order.payment_status === 'paid'
                                            ? 'text-emerald-600'
                                            : 'text-gray-700'
                                    }
                                >
                                    {paymentStatus}
                                </b>

                            </div>

                        </div>

                        {/* Footer */}
                        <div className="mt-5 border-t border-dashed border-gray-400 pt-3 text-center">

                            <p className="text-[9px] font-bold">
                                ขอบคุณที่ใช้บริการ
                            </p>

                            <p className="mt-1 text-[8px] text-gray-400">
                                Thank you for shopping with us
                            </p>

                            <p className="mt-2 text-[7px] tracking-[.2em] text-gray-300">
                                •• •••• ••• •••• ••
                            </p>

                        </div>

                    </div>

                    {/* Actions */}
                    <div className="order-receipt-actions mt-5 flex justify-end gap-3">

                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-lg border border-gray-200 px-5 text-sm font-bold text-gray-600 transition hover:bg-white"
                        >
                            ปิด
                        </button>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="h-10 rounded-lg bg-gray-900 px-5 text-sm font-bold text-white transition hover:bg-gray-800"
                        >
                            <i className="fa-solid fa-print mr-2" />
                            พิมพ์ใบเสร็จ
                        </button>

                    </div>

                </div>

            </div>
        </>
    )
}