import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminUsers, updateAdminUserRole, deleteAdminUser } from '../../api/users.js'

const CUSTOMERS_PER_PAGE = 20

function getRole(user) {
  return user?.user_role || user?.role || 'user'
}

function getName(user) {
  return (
    user?.username ||
    user?.name ||
    `User #${user?.user_id ?? '-'}`
  )
}

function getEmail(user) {
  return user?.email || 'ไม่มีอีเมล'
}

function getPhone(user) {
  return user?.phone || 'ไม่มีเบอร์โทร'
}

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

function RoleBadge({ role }) {
  const isAdmin = role === 'admin'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${isAdmin
        ? 'bg-violet-50 text-violet-600'
        : 'bg-gray-100 text-gray-600'
        }`}
    >
      <i
        className={`fa-solid ${isAdmin
          ? 'fa-user-shield'
          : 'fa-user'
          } mr-1.5`}
      />

      {isAdmin ? 'Admin' : 'User'}
    </span>
  )
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
          <i
            className={`fa-solid ${icon}`}
          />
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
  const [roleFilter, setRoleFilter] = useState('ทั้งหมด')
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [roleTarget, setRoleTarget] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)

  const [savingRole, setSavingRole] = useState(false)

  const [deleting, setDeleting] = useState(false)

  // =========================
  // Load users
  // =========================
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

  // =========================
  // Filter
  // =========================
  const filteredUsers = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    return users.filter((user) => {
      const role = getRole(user)

      const matchRole =
        roleFilter === 'ทั้งหมด' ||
        (roleFilter === 'Admin' &&
          role === 'admin') ||
        (roleFilter === 'User' &&
          role === 'user')

      const searchableText = [
        user?.user_id,
        user?.username,
        user?.name,
        user?.email,
        user?.phone,
        role,
      ]
        .map((value) =>
          String(value ?? ''),
        )
        .join(' ')
        .toLowerCase()

      const matchSearch =
        !keyword ||
        searchableText.includes(
          keyword,
        )

      return (
        matchRole &&
        matchSearch
      )
    })
  }, [
    users,
    search,
    roleFilter,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length /
      CUSTOMERS_PER_PAGE,
    ),
  )

  const paginatedUsers = useMemo(() => {
    const start =
      (currentPage - 1) *
      CUSTOMERS_PER_PAGE

    return filteredUsers.slice(
      start,
      start + CUSTOMERS_PER_PAGE,
    )
  }, [
    filteredUsers,
    currentPage,
  ])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, roleFilter])

  const pageStart =
    filteredUsers.length === 0
      ? 0
      : (currentPage - 1) *
      CUSTOMERS_PER_PAGE +
      1

  const pageEnd = Math.min(
    currentPage *
    CUSTOMERS_PER_PAGE,
    filteredUsers.length,
  )

  // =========================
  // Summary
  // =========================
  const adminCount = useMemo(() => {
    return users.filter(
      (user) =>
        getRole(user) === 'admin',
    ).length
  }, [users])

  const userCount = useMemo(() => {
    return users.filter(
      (user) =>
        getRole(user) === 'user',
    ).length
  }, [users])

  // =========================
  // Change role
  // =========================
  const handleChangeRole = async () => {
    if (!roleTarget) return

    const currentRole =
      getRole(roleTarget)

    const nextRole =
      currentRole === 'admin'
        ? 'user'
        : 'admin'

    try {
      setSavingRole(true)
      setError('')

      await updateAdminUserRole(
        roleTarget.user_id,
        nextRole,
      )

      setUsers((prev) =>
        prev.map((user) =>
          Number(user.user_id) ===
            Number(roleTarget.user_id)
            ? {
              ...user,
              user_role: nextRole,
              role: nextRole,
            }
            : user,
        ),
      )

      setRoleTarget(null)
    } catch (err) {
      console.error(
        'update user role error:',
        err,
      )

      setError(
        err?.message ||
        'ไม่สามารถเปลี่ยน Role ได้',
      )

      setRoleTarget(null)
    } finally {
      setSavingRole(false)
    }
  }

  // =========================
  // Delete user
  // =========================
  const handleDeleteUser = async () => {
    if (!deleteTarget) return

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
        'delete user error:',
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


      </div>

      {/* =========================
          Summary
      ========================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <StatCard
          label="ผู้ใช้งานทั้งหมด"
          value={users.length}
          icon="fa-users"
        />

        <StatCard
          label="Customer / User"
          value={userCount}
          icon="fa-user"
        />

        <StatCard
          label="Admin"
          value={adminCount}
          icon="fa-user-shield"
        />

      </div>

      {/* =========================
          Search / Filter
      ========================= */}
      <section className="rounded-xl border border-[#ececf2] bg-white p-3 shadow-sm">

        <div className="flex flex-col gap-2 md:flex-row">

          <div className="relative flex-1">

            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="ค้นหาชื่อ เบอร์โทร อีเมล หรือ User ID..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-10 text-[11px] text-gray-700 outline-none transition focus:border-violet-300 focus:bg-white"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch('')
                }
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="ล้างการค้นหา"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            )}

          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value,
              )
            }
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-[11px] font-semibold text-gray-600 outline-none focus:border-violet-300"
          >
            <option value="ทั้งหมด">
              ทั้งหมด
            </option>

            <option value="User">
              User / Customer
            </option>

            <option value="Admin">
              Admin
            </option>
          </select>

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
              รายชื่อผู้ใช้งาน
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-400">
              แสดง {filteredUsers.length} จาก{' '}
              {users.length} รายการ
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
            กำลังโหลดข้อมูลผู้ใช้งาน...
          </div>
        ) : (
          <>

            <div className="max-h-[600px] overflow-auto">

              <table className="w-full min-w-[1050px] text-left text-[11px]">

                <thead className="sticky top-0 z-10 bg-[#fafafa] text-[9px] font-bold text-gray-400">
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
                      Role
                    </th>

                    <th className="px-4 py-3 text-center">
                      จัดการ
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {paginatedUsers.map(
                    (user) => {
                      const role =
                        getRole(user)

                      const isAdmin =
                        role === 'admin'

                      return (
                        <tr
                          key={
                            user.user_id
                          }
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
                                  <i
                                    className={`fa-solid ${isAdmin
                                      ? 'fa-user-shield'
                                      : 'fa-user'
                                      } text-[10px]`}
                                  />
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="truncate font-bold text-gray-800">
                                  {getName(
                                    user,
                                  )}
                                </p>

                                <p className="mt-0.5 truncate text-[9px] text-gray-400">
                                  User ID #
                                  {String(
                                    user.user_id,
                                  ).padStart(
                                    5,
                                    '0',
                                  )}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3 text-gray-600">
                            {getPhone(
                              user,
                            )}
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-gray-600">
                            {getEmail(
                              user,
                            )}
                          </td>

                          {/* Created */}
                          <td className="px-4 py-3 text-gray-500">
                            {formatDate(
                              user.created_at,
                            )}
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3">
                            <RoleBadge
                              role={role}
                            />
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">

                            <div className="flex justify-center gap-1">

                              {/* Detail */}
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/home/admin/customers/${user.user_id}`,
                                  )
                                }
                                title="ดูรายละเอียด"
                                className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                              >
                                <i className="fa-regular fa-eye text-[10px]" />
                              </button>

                              {/* Role */}
                              <button
                                type="button"
                                onClick={() =>
                                  setRoleTarget(
                                    user,
                                  )
                                }
                                title={
                                  isAdmin
                                    ? 'เปลี่ยนเป็น User'
                                    : 'เปลี่ยนเป็น Admin'
                                }
                                className={`grid size-8 place-items-center rounded-lg border transition ${isAdmin
                                  ? 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                  : 'border-violet-100 text-violet-500 hover:bg-violet-50'
                                  }`}
                              >
                                <i
                                  className={`fa-solid ${isAdmin
                                    ? 'fa-user'
                                    : 'fa-user-shield'
                                    } text-[10px]`}
                                />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    user,
                                  )
                                }
                                title="ลบผู้ใช้งาน"
                                className="grid size-8 place-items-center rounded-lg border border-red-100 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <i className="fa-solid fa-trash text-[10px]" />
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    },
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
                  ลองเปลี่ยนคำค้นหาหรือ Role
                </p>

              </div>
            )}

          </>
        )}

        <div className="flex flex-col gap-3 border-t border-[#f0f0f3] px-4 py-3 text-[10px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            แสดง {pageStart}-{pageEnd} จาก{' '}
            {filteredUsers.length} ผู้ใช้งาน
          </span>

          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(page - 1, 1),
                )
              }
              disabled={currentPage === 1}
              className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="fa-solid fa-chevron-left text-[10px]" />
            </button>

            <span className="min-w-[75px] text-center font-semibold text-gray-500">
              หน้า {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(
                    page + 1,
                    totalPages,
                  ),
                )
              }
              disabled={
                currentPage === totalPages
              }
              className="grid size-8 place-items-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>
        </div>

      </section>

      {/* =========================
          Change Role Confirm
      ========================= */}
      {roleTarget && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/45 p-4 backdrop-blur-sm">

          <div className="w-full max-w-sm overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(31,24,70,0.22)]">

            <div className="h-1.5 w-full bg-violet-600" />

            <div className="p-6 text-center">

              <span className="mx-auto grid size-16 place-items-center rounded-full bg-violet-50 text-violet-600">
                <i
                  className={`fa-solid ${getRole(roleTarget) ===
                    'admin'
                    ? 'fa-user'
                    : 'fa-user-shield'
                    } text-xl`}
                />
              </span>

              <h2 className="mt-4 text-lg font-extrabold text-gray-900">
                {getRole(
                  roleTarget,
                ) === 'admin'
                  ? 'เปลี่ยนเป็น User?'
                  : 'เปลี่ยนเป็น Admin?'}
              </h2>

              <p className="mt-2 text-sm font-bold text-gray-700">
                {getName(
                  roleTarget,
                )}
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                {getRole(
                  roleTarget,
                ) === 'admin'
                  ? 'ผู้ใช้งานนี้จะไม่สามารถเข้าถึงส่วนจัดการ Admin ได้หลังจากได้รับ Token ใหม่'
                  : 'ผู้ใช้งานนี้จะได้รับสิทธิ์เข้าถึงส่วนจัดการ Admin หลังจากได้รับ Token ใหม่'}
              </p>

              <div className="mt-6 flex gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setRoleTarget(
                      null,
                    )
                  }
                  disabled={savingRole}
                  className="h-11 flex-1 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={
                    handleChangeRole
                  }
                  disabled={savingRole}
                  className="h-11 flex-1 rounded-xl bg-violet-600 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingRole ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    'ยืนยัน'
                  )}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* =========================
          Delete Confirm
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
                {getName(
                  deleteTarget,
                )}
              </p>

              <p className="mt-2 text-xs leading-5 text-red-400">
                การลบจะเรียก API ของระบบโดยตรง
                หาก User มีข้อมูลที่ผูกด้วย Foreign Key
                อาจไม่สามารถลบได้
              </p>

              <div className="mt-6 flex gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget(
                      null,
                    )
                  }
                  disabled={deleting}
                  className="h-11 flex-1 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteUser
                  }
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