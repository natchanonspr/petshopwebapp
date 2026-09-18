export default function ProductDescription({ product }) {
  const highlights = product.highlights || [
    'โปรตีนคุณภาพสูง',
    'ช่วยดูแลสุขภาพ',
    'เหมาะสำหรับสุนัขโต',
  ]

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="m-0 text-lg font-bold text-gray-900">รายละเอียดสินค้า</h2>
      <p className="m-0 mt-3 text-sm leading-6 text-gray-600">{product.description}</p>
      <ul className="m-0 mt-3 space-y-2 pl-5 text-sm leading-6 text-gray-600">
        {highlights.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}
