export default function ProductInfoCard({ product, variants = [], selectedVariant, onVariantChange, quantity, onDecrease, onIncrease }) {
  const displayPrice = selectedVariant?.price ?? product.price

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="m-0 text-xl font-bold leading-tight text-gray-700">{product.displayName || product.name}</h2>
      <p className="m-0 mt-1 text-sm text-gray-400">{product.displayCategory || product.category}</p>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="tracking-[1px] text-amber-400">★★★★★</span>
        <span className="font-semibold text-gray-600">{product.rating}</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">ขายแล้ว {product.sold ?? product.reviews} ชิ้น</span>
      </div>

      <p className="m-0 mt-4 text-3xl font-bold leading-none text-orange-500">฿{Number(displayPrice).toLocaleString()}</p>

      {variants.length > 0 && (
        <div className="mt-5">
          <p className="m-0 mb-2 text-sm font-bold text-gray-700">ขนาด</p>
          <div className="grid grid-cols-3 gap-2">
            {variants.map((variant) => {
              const selected = selectedVariant?.label === variant.label
              return (
                <button
                  key={variant.label}
                  type="button"
                  onClick={() => onVariantChange(variant)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition-all active:scale-[0.98] ${
                    selected
                      ? 'border-orange-500 bg-orange-50 font-bold text-orange-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                  }`}
                >
                  <span className="text-sm">{variant.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-5">
        <p className="m-0 text-sm font-bold text-gray-800">จำนวน</p>
        <div className="flex h-10 items-center gap-4 rounded-xl bg-gray-100 px-2">
          <button type="button" onClick={onDecrease} disabled={quantity <= 1} className="grid size-8 place-items-center rounded-lg bg-white text-xl text-gray-700 shadow-sm active:scale-95 disabled:opacity-40" aria-label="ลดจำนวน">−</button>
          <span className="min-w-4 text-center font-bold text-gray-800">{quantity}</span>
          <button type="button" onClick={onIncrease} className="grid size-8 place-items-center rounded-lg bg-gray-900 text-xl text-white active:scale-95" aria-label="เพิ่มจำนวน">+</button>
        </div>
      </div>
    </section>
  )
}
