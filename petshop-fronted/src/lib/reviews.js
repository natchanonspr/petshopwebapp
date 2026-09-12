import { addNotification } from './notifications.js'

const KEY = 'petshop_product_reviews_v1'

const seedReviews = [
  { id: 1, productId: 1, userName: 'คุณสมชาย รักดี', rating: 5, comment: 'น้องหมาชอบมาก กินหมดชามเลยครับ', date: '2026-09-01', reply: 'ขอบคุณสำหรับรีวิวครับ ❤️' },
  { id: 2, productId: 1, userName: 'คุณหญิงอร พงษ์ดี', rating: 4, comment: 'ส่งไว แพ็กของดี สินค้าตรงตามที่สั่งค่ะ', date: '2026-09-02' },
  { id: 3, productId: 2, userName: 'คุณธนพล ใจดี', rating: 5, comment: 'แมวที่บ้านชอบรสนี้มากค่ะ', date: '2026-09-03', reply: 'ขอบคุณที่อุดหนุนร้านเรานะคะ 🐱' },
]

export function getReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    return Array.isArray(saved) ? saved : JSON.parse(JSON.stringify(seedReviews))
  } catch { return JSON.parse(JSON.stringify(seedReviews)) }
}

export function getProductReviews(productId) {
  return getReviews().filter(review => String(review.productId) === String(productId))
}

export function getProductRating(productId, fallbackRating = 0, fallbackReviews = 0) {
  const reviews = getProductReviews(productId)
  if (!reviews.length) return { rating: Number(fallbackRating) || 0, reviews: Number(fallbackReviews) || 0 }
  const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
  return { rating: Number(average.toFixed(1)), reviews: reviews.length }
}

export function addProductReview(review) {
  const reviews = getReviews()
  reviews.unshift({ id: Date.now(), date: new Date().toISOString().slice(0, 10), ...review })
  localStorage.setItem(KEY, JSON.stringify(reviews))
  window.dispatchEvent(new CustomEvent('petshop-reviews-updated'))
  addNotification({ audience: 'admin', type: 'system', icon: 'fa-star', title: 'มีรีวิวสินค้าใหม่ ⭐', detail: `${review.userName || 'ลูกค้า'} ให้ ${review.rating} ดาวและรีวิวสินค้า`, meta: { productId: review.productId, reviewId: reviews[0].id }, notifyBrowser: true })
  return reviews[0]
}

export function replyToReview(reviewId, reply) {
  const text = reply.trim()
  if (!text) return
  const reviews = getReviews()
  const target = reviews.find(review => String(review.id) === String(reviewId))
  if (!target) return
  target.reply = text
  localStorage.setItem(KEY, JSON.stringify(reviews))
  window.dispatchEvent(new CustomEvent('petshop-reviews-updated'))
  addNotification({ audience: 'customer', customerId: target.customerId, type: 'system', icon: 'fa-store', title: 'ร้านค้าตอบรีวิวของคุณ 💬', detail: `ร้านค้าตอบกลับว่า “${text}”`, meta: { productId: target.productId, reviewId: target.id }, notifyBrowser: true })
}

export function replyToShopReview(reviewId, reply, userName = 'คุณสมชาย รักดี') {
  const text = reply.trim()
  if (!text) return
  const reviews = getReviews()
  const target = reviews.find(review => String(review.id) === String(reviewId))
  if (!target) return
  target.customerReply = text
  target.customerReplyUserName = userName
  target.customerReplyDate = new Date().toISOString().slice(0, 10)
  localStorage.setItem(KEY, JSON.stringify(reviews))
  window.dispatchEvent(new CustomEvent('petshop-reviews-updated'))
  addNotification({ audience: 'admin', type: 'system', icon: 'fa-comment-dots', title: 'ลูกค้าตอบกลับรีวิว 💬', detail: `${userName} ตอบกลับรีวิวสินค้า`, meta: { productId: target.productId, reviewId: target.id }, notifyBrowser: true })
}

export function deleteProductReview(reviewId) {
  const reviews = getReviews().filter(review => String(review.id) !== String(reviewId))
  localStorage.setItem(KEY, JSON.stringify(reviews))
  window.dispatchEvent(new CustomEvent('petshop-reviews-updated'))
}

export { KEY as REVIEWS_KEY }
