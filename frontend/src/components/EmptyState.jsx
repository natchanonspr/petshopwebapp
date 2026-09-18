export default function EmptyState({
  icon = 'fa-box-open',
  title = 'ยังไม่มีข้อมูล',
  description = 'ยังไม่มีรายการให้แสดงในตอนนี้',
  actionLabel,
  onAction,
  actionTo,
}) {
  const content = (
    <span className="inline-flex h-11 items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 active:scale-[0.98]">
      {actionLabel}
    </span>
  )

  return (
    <div className="rounded-[28px] border border-gray-100 bg-white px-5 py-14 text-center shadow-sm">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500">
        <i className={`fa-solid ${icon} text-2xl`} />
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-800">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-gray-400">{description}</p>
      {(actionLabel && (onAction || actionTo)) && (
        <div className="mt-5">
          {actionTo ? <a href={actionTo}>{content}</a> : <button type="button" onClick={onAction}>{content}</button>}
        </div>
      )}
    </div>
  )
}
