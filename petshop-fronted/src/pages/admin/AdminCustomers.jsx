import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminUsers, deleteAdminUser } from '../../api/users.js'

function formatDate(value) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return '—'
    }

    return date.toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function getDisplayName(user) {
    return (
        user?.username ||
        user?.name ||
        `User #${user?.user_id ?? '—'}`
    )
}

function getDisplayEmail(user) {
    return user?.email || 'ไม่มีอีเมล'
}

function getDisplayPhone(user) {
    return user?.phone || 'ไม่มีเบอร์โทร'
}

function StatCard({
    label,
    value,
    icon,
}) {
    return (
        <div className="rounded-xl border border-[#ececf2] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <i className={`fa-solid ${icon}`} />
                </div>

                <div>
                    <p className="text-[11px] text-gray-400">
                        {label}
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                        {value.toLocaleString('th-TH')}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default function AdminCustomers() {
    const navigate = useNavigate()

    const [users, setUsers] = useState([])
    const [search, setSearch] = useState('')

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [deleteTarget, setDeleteTarget] =
        useState(null)

    const [deleting, setDeleting] =
        useState(false)

    const loadUsers = async () => {
        try {
            setLoading(true)
            setError('')

            const data = await getAdminUsers()

            setUsers(
                Array.isArray(data)
                    ? data
                    : [],
            )
        } catch (err) {
            console.error(
                'load admin users error:',
                err,
            )

            setError(
                err?.message ||
                'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้',
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const filteredUsers = useMemo(() => {
        const keyword =
            search.trim().toLowerCase()

        if (!keyword) {
            return users
        }

        return users.filter((user) => {
            const searchableText = [
                user?.user_id,
                user?.username,
                user?.name,
                user?.email,
                user?.phone,
            ]
                .map((value) =>
                    String(value ?? ''),
                )
                .join(' ')
                .toLowerCase()

            return searchableText.includes(
                keyword,
            )
        })
    }, [users, search])

    const handleDelete = async () => {
        if (!deleteTarget) {
            return
        }

        try {
            setDeleting(true)
            setError('')

            await deleteAdminUser(
                deleteTarget.user_id,
            )

            setUsers((prev) =>
                prev.filter(
                    (user) =>
                        Number(user.user_id) !==
                        Number(deleteTarget.user_id),
                ),
            )

            setDeleteTarget(null)
        } catch (err) {
            console.error(
                'delete admin user error:',
                err,
            )

            setError(
                err?.message ||
                'ไม่สามารถลบผู้ใช้งานได้',
            )
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-4 pb-20 md:pb-6">

            {/* =========================
          Header
      ========================= */}
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] text-gray-400">
                        <Link
                            to="/home/admin"
                            className="hover:text-gray-700"
                        >
                            หน้าหลัก
                        </Link>

                        <i className="fa-solid fa-chevron-right text-[8px]" />

                        <span>
                            ผู้ใช้งาน
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">
                        จัดการผู้ใช้งาน
                    </h1>

                    <p className="mt-1 text-xs text-gray-400">
                        ข้อมูลลูกค้าจากระบบสมาชิก
                    </p>
                </div>
            </div>

            {/* =========================
          Summary
      ========================= */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard
                    label="ผู้ใช้งานทั้งหมด"
                    value={users.length}
                    icon="fa-users"
                />

                <StatCard
                    label="ผลการค้นหา"
                    value={filteredUsers.length}
                    icon="fa-magnifying-glass"
                />
            </div>

            {/* =========================
          Search
      ========================= */}
            <section className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-sm">
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400" />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="ค้นหาชื่อ เบอร์โทร อีเมล หรือ User ID..."
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-10 text-[11px] text-gray-700 outline-none transition focus:border-violet-300 focus:bg-white"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            aria-label="ล้างการค้นหา"
                        >
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    )}
                </div>
            </section>

            {/* =========================
          Error
      ========================= */}
            {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-500">
                    <div className="flex items-center justify-between gap-3">
                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={loadUsers}
                            className="shrink-0 underline"
                        >
                            ลองใหม่
                        </button>
                    </div>
                </div>
            )}

            {/* =========================
          Table
      ========================= */}
            <section className="overflow-hidden rounded-xl border border-[#ececf2] bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <div>
                        <h2 className="text-sm font-extrabold text-gray-900">
                            รายชื่อลูกค้า
                        </h2>

                        <p className="mt-0.5 text-[10px] text-gray-400">
                            แสดง {filteredUsers.length} จาก {users.length} รายการ
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadUsers}
                        disabled={loading}
                        className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-violet-600 disabled:opacity-50"
                        title="รีเฟรช"
                    >
                        <i
                            className={`fa-solid fa-rotate-right text-[11px] ${loading
                                    ? 'animate-spin'
                                    : ''
                                }`}
                        />
                    </button>
                </div>

                {loading ? (
                    <div className="p-14 text-center text-xs text-gray-400">
                        <i className="fa-solid fa-spinner fa-spin mr-2" />
                        กำลังโหลดข้อมูลลูกค้า...
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-[11px]">

                                <thead className="bg-[#fafafa] text-[9px] font-bold text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">
                                            ผู้ใช้งาน
                                        </th>

                                        <th className="px-4 py-3">
                                            เบอร์โทร
                                        </th>

                                        <th className="px-4 py-3">
                                            อีเมล
                                        </th>

                                        <th className="px-4 py-3">
                                            วันที่สมัคร
                                        </th>

                                        <th className="px-4 py-3">
                                            User ID
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            จัดการ
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map(
                                        (user) => (
                                            <tr
                                                key={user.user_id}
                                                className="border-t border-gray-50 transition hover:bg-violet-50/30"
                                            >

                                                {/* User */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-50 text-violet-600">
                                                            {user.picture_url ? (
                                                                <img
                                                                    src={
                                                                        user.picture_url
                                                                    }
                                                                    alt=""
                                                                    className="size-full object-cover"
                                                                />
                                                            ) : (
                                                                <i className="fa-solid fa-user text-[10px]" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-gray-800">
                                                                {getDisplayName(
                                                                    user,
                                                                )}
                                                            </p>

                                                            <p className="mt-0.5 truncate text-[9px] text-gray-400">
                                                                {getDisplayEmail(
                                                                    user,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Phone */}
                                                <td className="px-4 py-3 text-gray-600">
                                                    {getDisplayPhone(
                                                        user,
                                                    )}
                                                </td>

                                                {/* Email */}
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-600">
                                                        {getDisplayEmail(
                                                            user,
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Created */}
                                                <td className="px-4 py-3 text-gray-500">
                                                    {formatDate(
                                                        user.created_at,
                                                    )}
                                                </td>

                                                {/* User ID */}
                                                <td className="px-4 py-3">
                                                    <span className="font-bold text-violet-600">
                                                        #
                                                        {String(
                                                            user.user_id,
                                                        ).padStart(
                                                            5,
                                                            '0',
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-center gap-1">

                                                        {/* View */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/home/admin/customers/${user.user_id}`,
                                                                )
                                                            }
                                                            className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                                                            title="ดูรายละเอียด"
                                                        >
                                                            <i className="fa-regular fa-eye text-[10px]" />
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    user,
                                                                )
                                                            }
                                                            className="grid size-8 place-items-center rounded-lg border border-red-100 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                                                            title="ลบผู้ใช้งาน"
                                                        >
                                                            <i className="fa-solid fa-trash text-[10px]" />
                                                        </button>

                                                    </div>
                                                </td>

                                            </tr>
                                        ),
                                    )}
                                </tbody>

                            </table>
                        </div>

                        {filteredUsers.length === 0 && (
                            <div className="p-14 text-center">
                                <div className="mx-auto grid size-14 place-items-center rounded-full bg-gray-50 text-gray-300">
                                    <i className="fa-solid fa-users text-xl" />
                                </div>

                                <p className="mt-3 text-sm font-semibold text-gray-500">
                                    ไม่พบผู้ใช้งาน
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    ลองเปลี่ยนคำค้นหา
                                </p>
                            </div>
                        )}
                    </>
                )}

                <div className="border-t border-[#f0f0f3] px-4 py-3 text-center text-[10px] text-gray-400">
                    แสดง {filteredUsers.length} จาก{' '}
                    {users.length} ผู้ใช้งาน
                </div>
            </section>

            {/* =========================
          Delete Confirmation
      ========================= */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/45 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-sm overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(31,24,70,0.22)]">

                        <div className="h-1.5 w-full bg-red-500" />

                        <div className="p-6 text-center">

                            <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-500">
                                <i className="fa-solid fa-trash-can text-xl" />
                            </span>

                            <h2 className="mt-4 text-lg font-extrabold text-gray-900">
                                ลบผู้ใช้งาน?
                            </h2>

                            <p className="mt-2 text-sm font-bold text-gray-700">
                                {getDisplayName(
                                    deleteTarget,
                                )}
                            </p>

                            <p className="mt-2 text-xs leading-5 text-gray-500">
                                การลบผู้ใช้งานจะลบข้อมูล User
                                ออกจากระบบ
                            </p>

                            <div className="mt-6 flex gap-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setDeleteTarget(null)
                                    }
                                    disabled={deleting}
                                    className="h-11 flex-1 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="h-11 flex-1 rounded-xl bg-red-500 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin mr-2" />
                                            กำลังลบ...
                                        </>
                                    ) : (
                                        'ยืนยันลบ'
                                    )}
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}