import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
export default function AdminLogin() {
    const [email, setEmail] = useState('petshop');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState(''); const nav = useNavigate();
    const loc = useLocation(); 
    const submit = e => { e.preventDefault(); 
    if (email === 'petshop' && password === 'admin123') { localStorage.setItem('petshop_admin_auth', 'true'); nav(loc.state?.from || '/home/admin', { replace: true }) } 
    else setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง') }; return <div className="min-h-screen grid place-items-center bg-[#f8f9fc] p-4">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-xl">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 text-violet-600">
                <i className="fa-solid fa-paw text-xl" /></div><h1 className="mt-4 text-center text-2xl font-extrabold">Pet Shop Admin</h1>
                <p className="mt-1 text-center text-sm text-gray-400">เข้าสู่ระบบผู้ดูแลระบบ</p><div className="mt-6 space-y-3"><input value={email} onChange={e => setEmail(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-violet-400" placeholder="อีเมล" />
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none focus:border-violet-400" placeholder="รหัสผ่าน" /></div>{error && <p className="mt-3 text-sm text-red-500">{error}</p>}<button className="mt-5 h-11 w-full rounded-xl bg-violet-600 font-bold text-white hover:bg-violet-700">เข้าสู่ระบบ</button>
        <p className="mt-3 text-center text-xs text-gray-400">Demo: petshop / admin123</p></form></div>
}
