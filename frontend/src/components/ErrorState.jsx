export default function ErrorState({
  title = 'เกิดข้อผิดพลาด',
  description = 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
  onRetry,
}) {
  return (
    <div className="rounded-[28px] border border-red-100 bg-white px-5 py-14 text-center shadow-sm">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
        <i className="fa-solid fa-triangle-exclamation text-2xl" />
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-800">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-gray-400">{description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.98]">
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  )
}
