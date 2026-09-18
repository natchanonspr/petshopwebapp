import { useEffect, useState } from 'react'
import { addProductReview, getProductRating, getProductReviews, replyToShopReview } from '../../lib/reviews.js'

export default function ProductReviews({ product }) {
  const [reviews, setReviews] = useState(() => getProductReviews(product.id))
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replySent, setReplySent] = useState(false)
  const summary = getProductRating(product.id, product.rating, product.reviews)

  useEffect(() => {
    const refresh = () => setReviews(getProductReviews(product.id))
    window.addEventListener('petshop-reviews-updated', refresh)
    return () => window.removeEventListener('petshop-reviews-updated', refresh)
  }, [product.id])

  const submit = () => {
    if (!comment.trim()) return
    addProductReview({ productId: product.id, customerId: Number(localStorage.getItem('petshop_customer_id') || 0) || undefined, userName: 'คุณสมชาย รักดี', rating, comment: comment.trim() })
    setComment('')
    setRating(5)
    setSent(true)
    window.setTimeout(() => setSent(false), 1800)
  }

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">รีวิวจากลูกค้า</h2>
        <span className="text-xs text-gray-400">{summary.reviews} รีวิว</span>
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-orange-50 p-4">
        <div className="text-center"><strong className="block text-3xl font-extrabold text-orange-500">{summary.rating.toFixed(1)}</strong><div className="text-xl leading-none tracking-tight text-orange-400">{'★'.repeat(Math.round(summary.rating))}{'☆'.repeat(5 - Math.round(summary.rating))}</div></div>
        <div className="text-xs text-gray-500">คะแนนเฉลี่ยจากผู้ใช้งานจริง<br />รีวิวและคะแนนมาจากลูกค้า</div>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 p-4">
        <p className="text-sm font-bold">เขียนรีวิวสินค้า</p>
        <div className="mt-3 flex gap-1.5">{[1,2,3,4,5].map(value => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} ดาว`} className={`text-4xl leading-none transition active:scale-90 ${value <= rating ? 'text-orange-400' : 'text-gray-200'}`}>★</button>)}</div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows="3" placeholder="บอกความรู้สึกเกี่ยวกับสินค้านี้..." className="mt-2 w-full resize-none rounded-xl border border-gray-200 p-3 text-xs outline-none focus:border-orange-300" />
        <button type="button" onClick={submit} className="mt-2 h-10 w-full rounded-full bg-orange-500 text-xs font-bold text-white active:scale-[0.99]">{sent ? 'ส่งรีวิวแล้ว ✓' : 'ส่งรีวิว'}</button>
      </div>

      <div className="mt-5 space-y-4">
        {reviews.map(review => <article key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-gray-800">{review.userName}</p><div className="mt-1 text-lg leading-none text-orange-400">{'★'.repeat(Number(review.rating))}{'☆'.repeat(5 - Number(review.rating))}</div></div><span className="text-[10px] text-gray-400">{review.date}</span></div>
          <p className="mt-2 text-sm leading-6 text-gray-600">{review.comment}</p>
          {review.reply && <div className="mt-3 rounded-xl bg-gray-50 p-3"><p className="text-[10px] font-bold text-orange-500">ร้านค้า</p><p className="mt-1 text-xs leading-5 text-gray-500">{review.reply}</p></div>}
          {review.customerReply && <div className="mt-2 rounded-xl bg-orange-50/70 p-3"><p className="text-[10px] font-bold text-orange-500">คุณตอบกลับ</p><p className="mt-1 text-xs leading-5 text-gray-600">{review.customerReply}</p></div>}
          {review.reply && !review.customerReply && <div className="mt-3 rounded-xl border border-orange-100 bg-white p-3"><p className="text-[10px] font-bold text-gray-600">ตอบกลับร้านค้า</p><textarea value={replyText} onChange={e=>setReplyText(e.target.value)} rows="2" placeholder="ตอบกลับร้านค้า..." className="mt-2 w-full resize-none rounded-lg border border-gray-200 p-2 text-xs outline-none focus:border-orange-300"/><button type="button" disabled={!replyText.trim()} onClick={()=>{replyToShopReview(review.id, replyText, 'คุณสมชาย รักดี');setReplyText('');setReplySent(true);window.setTimeout(()=>setReplySent(false),1800)}} className="mt-2 h-9 w-full rounded-full bg-orange-500 text-[11px] font-bold text-white disabled:opacity-40">{replySent ? 'ส่งข้อความแล้ว ✓' : 'ส่งข้อความตอบกลับ'}</button></div>}
        </article>)}
      </div>
    </section>
  )
}
