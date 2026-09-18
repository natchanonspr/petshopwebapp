export default function ProductInformation() {
  const details = [
    ['น้ำหนัก', '2 กก.'],
    ['อายุที่เหมาะสม', '1-7 ปี'],
    ['สำหรับ', 'พันธุ์ใหญ่'],
    ['ผลิตภัณฑ์', 'ฝรั่งเศส'],
  ]

  return (
    <section className="product-detail-card product-detail-information">
      <h2><span aria-hidden="true">📋</span> รายละเอียดสินค้า</h2>
      <p className="product-detail-description">
        อาหารสุนัขพันธุ์ใหญ่ สูตรบำรุงสุขภาพ โปรตีน 28% เหมาะสำหรับสุนัขอายุ 1-7 ปี
      </p>
      <div className="product-detail-specs">
        {details.map(([label, value]) => (
          <div className="product-detail-spec" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
