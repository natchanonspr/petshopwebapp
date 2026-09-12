import { useEffect } from 'react'
import { loadAdminData, saveAdminData } from '../admin/data.js'
import { processScheduledCouponNotifications } from '../admin/coupons.js'

const CURRENT_USER_KEY = 'petshop_current_user_id'
const CUSTOMER_ID_KEY = 'petshop_customer_id'
const BACKUP_KEY = 'petshop_admin_data_backup_v1'
const EXCLUDED_KEYS = new Set(['petshop_admin_data_v1', BACKUP_KEY, 'petshop_admin_auth', 'petshop_thailand_geography_v2', 'petshop_checkout_discount'])

function readJson(key, fallback) { try { const raw=localStorage.getItem(key); if(raw==null)return fallback; const v=JSON.parse(raw); return v??fallback } catch { return fallback } }
function normalize(v){return String(v||'').trim().toLowerCase()}

function buildCustomerSnapshot(){
  const snapshot={}
  for(let i=0;i<localStorage.length;i+=1){const key=localStorage.key(i);if(!key||EXCLUDED_KEYS.has(key)||!key.startsWith('petshop'))continue;snapshot[key]=readJson(key,localStorage.getItem(key))}
  return snapshot
}

function backupAdminData(data){try{if(!localStorage.getItem(BACKUP_KEY))localStorage.setItem(BACKUP_KEY,JSON.stringify({savedAt:new Date().toISOString(),data}))}catch{} }

function findUser(data,profile){
  const users=data.users||[]
  const customerId=Number(profile.customerId||localStorage.getItem(CUSTOMER_ID_KEY)||0)
  const currentId=Number(localStorage.getItem(CURRENT_USER_KEY)||0)
  const email=normalize(profile.email), phone=normalize(profile.phone)
  if(customerId){
    const byId=users.find(x=>Number(x.customerId||x.id)===customerId)
    if(!byId)return null
    if(email && normalize(byId.email) && normalize(byId.email)!==email)return null
    if(phone && normalize(byId.phone) && normalize(byId.phone)!==phone)return null
    return byId
  }
  if(email){const u=users.find(x=>normalize(x.email)===email);if(u)return u}
  if(phone){const u=users.find(x=>normalize(x.phone)===phone);if(u)return u}
  if(currentId){const u=users.find(x=>Number(x.id)===currentId);if(u)return u}
  return null
}

function syncCustomerToAdmin(){
  const profile=readJson('petshop_profile',{})
  const data=loadAdminData()
  const user=findUser(data,profile)
  if(!user)return

  // The User ID and Customer ID are now the same canonical identifier.
  const canonicalId=Number(user.customerId||user.id)
  if(!canonicalId)return
  if(Number(user.id)!==canonicalId && (data.users||[]).some(x=>Number(x.id)===canonicalId && x!==user))return
  try{localStorage.setItem(CUSTOMER_ID_KEY,String(canonicalId));localStorage.setItem(CURRENT_USER_KEY,String(canonicalId))}catch{}

  const addresses=readJson('petshop_addresses',[]), payments=readJson('petshop_payment_methods',[]), pets=readJson('petshop-pets',[]), favorites=readJson('petshop_favorites',[]), notifications=readJson('petshop.notifications.v1',[]), customerOrders=readJson('petshop_orders',[]), activity=readJson('petshop_customer_activity_v1',[])
  const canonicalName=String(profile.name||user.name||'').trim()||user.name
  const canonicalEmail=String(profile.email||user.email||'').trim()||user.email
  const canonicalPhone=String(profile.phone||user.phone||'').trim()||user.phone
  const nextUser={...user,id:canonicalId,customerId:canonicalId,name:canonicalName,...(canonicalPhone?{phone:canonicalPhone}:{}),...(canonicalEmail?{email:canonicalEmail}:{}),...(profile.gender?{gender:profile.gender}:{}),...(profile.birthDate?{birthDate:profile.birthDate}:{}),...(profile.avatar?{avatar:profile.avatar}:{}),addresses:Array.isArray(addresses)?addresses:[],paymentMethods:Array.isArray(payments)?payments:[],pets:Array.isArray(pets)?pets:[],favorites:Array.isArray(favorites)?favorites:[],notifications:Array.isArray(notifications)?notifications:[],activity:Array.isArray(activity)?activity.filter(item=>!item.customerId||Number(item.customerId)===canonicalId):[],customerData:buildCustomerSnapshot()}

  const linkedOrders=Array.isArray(customerOrders)?customerOrders.filter(order=>{
    const oid=Number(order?.userId||order?.customerId||0), on=normalize(order?.address?.name||order?.name||order?.customer), op=normalize(order?.address?.phone||order?.phone)
    return oid===canonicalId||(op&&canonicalPhone&&op===normalize(canonicalPhone))||(on&&on===normalize(canonicalName))
  }).map(order=>({...order,userId:canonicalId,customerId:canonicalId,customer:canonicalName})):[]
  nextUser.orders=linkedOrders.length||user.orders||0
  nextUser.lastActive='ล่าสุด'

  const otherOrders=(data.orders||[]).filter(order=>Number(order.userId||order.customerId||0)!==canonicalId)
  const nextData={...data,users:(data.users||[]).map(item=>item.id===user.id?nextUser:item),orders:[...linkedOrders,...otherOrders]}
  if(JSON.stringify(data)===JSON.stringify(nextData))return
  backupAdminData(data)
  saveAdminData(nextData)
}

export default function AdminUserSync(){
  useEffect(()=>{
    const sync=()=>{try{syncCustomerToAdmin(); processScheduledCouponNotifications()}catch{}}
    sync()
    const events=['storage','petshop-profile-updated','petshop-address-updated','petshop-payment-updated','petshop-pets-updated','petshop-favorites-updated','petshop-orders-updated','petshop:notifications']
    events.forEach(e=>window.addEventListener(e,sync));const timer=window.setInterval(sync,1000)
    return()=>{events.forEach(e=>window.removeEventListener(e,sync));window.clearInterval(timer)}
  },[])
  return null
}
