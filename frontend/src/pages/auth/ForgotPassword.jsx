import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  requestPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
} from '../../api/auth'

const OTP_LENGTH = 6
const RESEND_COUNTDOWN = 60

export default function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [otpState, setOtpState] = useState('idle')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN)
  const [isResendDisabled, setIsResendDisabled] = useState(true)

  const inputsRef = useRef([])
  const animationControls = useAnimationControls()

  // Countdown สำหรับ Resend OTP
  useEffect(() => {
    if (!isResendDisabled) return undefined

    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(timer)
          setIsResendDisabled(false)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isResendDisabled])

  // =========================
  // Request OTP
  // =========================
  const handlePhone = async (event) => {
    event.preventDefault()
    setError('')

    const cleanPhone = phone.replace(/\D/g, '')

    if (!/^0\d{9}$/.test(cleanPhone)) {
      setError('กรุณากรอกเบอร์โทร 10 หลัก')
      return
    }

    try {
      setIsLoading(true)

      const result = await requestPasswordResetOTP(cleanPhone)

      setPhone(cleanPhone)
      setCode('')
      setOtp(result?.otp || '')
      setOtpState('idle')
      setCountdown(RESEND_COUNTDOWN)
      setIsResendDisabled(true)
      setStep('code')

      setTimeout(() => {
        inputsRef.current[0]?.focus()
      }, 100)
    } catch (err) {
      setError(err.message || 'ไม่สามารถขอ OTP ได้')
    } finally {
      setIsLoading(false)
    }
  }

  // =========================
  // Verify OTP
  // =========================
  const handleCode = async (event) => {
    event.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(code)) {
      setOtpState('error')
      setError('กรุณากรอกรหัสยืนยัน 6 หลัก')
      shakeInputs()
      return
    }

    try {
      setIsLoading(true)

      await verifyPasswordResetOTP(phone, code)

      setOtpState('success')

      setTimeout(() => {
        setStep('password')
      }, 650)
    } catch (err) {
      setOtpState('error')
      setError(err.message || 'OTP ไม่ถูกต้อง')
      shakeInputs()
    } finally {
      setIsLoading(false)
    }
  }

  // =========================
  // Reset Password
  // =========================
  const handlePassword = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    try {
      setIsLoading(true)

      await resetPassword(phone, password)

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
    } finally {
      setIsLoading(false)
    }
  }

  // =========================
  // Shake OTP inputs
  // =========================
  const shakeInputs = async () => {
    await animationControls.start({
      x: [0, 6, -6, 6, -6, 0],
      transition: { duration: 0.3 },
    })

    setTimeout(() => setOtpState('idle'), 500)
  }

  // =========================
  // OTP input
  // =========================
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)

    const next = code.split('').slice(0, OTP_LENGTH)
    next[index] = digit

    const nextCode = next.join('').slice(0, OTP_LENGTH)

    setCode(nextCode)
    setError('')
    setOtpState('idle')

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    if (nextCode.length === OTP_LENGTH) {
      setTimeout(() => {
        document.getElementById('otp-form')?.requestSubmit()
      }, 50)
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      inputsRef.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault()
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event) => {
    event.preventDefault()

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)

    if (!pasted) return

    setCode(pasted)
    setError('')
    setOtpState('idle')

    const focusIndex = Math.min(
      pasted.length,
      OTP_LENGTH - 1,
    )

    setTimeout(() => {
      inputsRef.current[focusIndex]?.focus()
    }, 0)

    if (pasted.length === OTP_LENGTH) {
      setTimeout(() => {
        document.getElementById('otp-form')?.requestSubmit()
      }, 50)
    }
  }

  // =========================
  // Resend OTP
  // =========================
  const handleResend = async () => {
    if (isResendDisabled || isLoading) return

    setError('')
    setCode('')
    setOtpState('idle')

    try {
      setIsLoading(true)

      const result = await requestPasswordResetOTP(phone)

      setOtp(result?.otp || '')
      setCountdown(RESEND_COUNTDOWN)
      setIsResendDisabled(true)

      setTimeout(() => {
        inputsRef.current[0]?.focus()
      }, 50)
    } catch (err) {
      setError(err.message || 'ไม่สามารถส่ง OTP ใหม่ได้')
    } finally {
      setIsLoading(false)
    }
  }

  // =========================
  // Back
  // =========================
  const handleBack = () => {
    setError('')
    setOtpState('idle')

    if (step === 'password') {
      setStep('code')
      return
    }

    if (step === 'code') {
      setStep('phone')
      setCode('')
      setOtp('')
      return
    }

    navigate('/login')
  }

  return (
    <main className="min-h-[100svh] bg-gray-100 px-0 text-gray-800 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-white sm:min-h-[820px] sm:max-h-[900px] sm:rounded-[32px] sm:shadow-xl">
        <section className="relative flex min-h-[210px] flex-col items-center justify-center overflow-hidden bg-orange-500 px-6 text-white">
          <div className="absolute -right-16 -top-16 size-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-12 size-48 rounded-full bg-white/10" />

          <div className="relative z-10 text-center">
            <h1 className="text-3xl font-black tracking-tight">
              Petshop
            </h1>

            <p className="mt-2 text-sm text-white/90">
              กู้คืนการเข้าใช้งานบัญชีของคุณ
            </p>
          </div>
        </section>

        <section className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-[30px] bg-white px-5 pb-6 pt-7 sm:px-7">
          <button
            type="button"
            onClick={handleBack}
            className="mb-5 self-start text-sm font-semibold text-gray-500 hover:text-orange-500"
          >
            <i className="fa-solid fa-arrow-left mr-2 text-xs" />

            {step === 'phone'
              ? 'กลับหน้าเข้าสู่ระบบ'
              : 'ย้อนกลับ'}
          </button>

          <div className="mb-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-orange-50 text-orange-500">
              <i className="fa-solid fa-lock text-lg" />
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-gray-900">
              {step === 'phone' && 'ลืมรหัสผ่าน'}

              {step === 'code' &&
                (otpState === 'success'
                  ? 'ยืนยันสำเร็จ'
                  : 'ยืนยันเบอร์โทร')}

              {step === 'password' && 'ตั้งรหัสผ่านใหม่'}
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              {step === 'phone' &&
                'กรอกเบอร์โทรที่ใช้สมัครสมาชิก'}

              {step === 'code' &&
                `กรอกรหัสยืนยัน 6 หลักที่ส่งไปยัง ${phone}`}

              {step === 'password' &&
                'ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ'}
            </p>
          </div>

          {/* =========================
              PHONE
          ========================= */}
          {step === 'phone' && (
            <form
              onSubmit={handlePhone}
              className="space-y-4"
            >
              <Field
                label="เบอร์โทร"
                icon="fa-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setError('')
                }}
                placeholder="08xxxxxxxx"
                maxLength={10}
              />

              {error && (
                <ErrorMessage>
                  {error}
                </ErrorMessage>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'กำลังส่ง OTP...'
                  : 'ดำเนินการต่อ'}
              </button>
            </form>
          )}

          {/* =========================
              OTP
          ========================= */}
          {step === 'code' && (
            <form
              id="otp-form"
              onSubmit={handleCode}
              className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gray-50/80 p-6 shadow-sm"
            >
              <AnimatePresence mode="wait">
                {otpState === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="flex min-h-[250px] items-center justify-center"
                  >
                    <div className="flex w-full items-center justify-center gap-4">
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.5,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        transition={{
                          delay: 0.15,
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                        className="grid size-16 place-items-center rounded-full bg-green-500 text-white ring-4 ring-green-100"
                      >
                        <i className="fa-solid fa-check text-2xl" />
                      </motion.div>

                      <motion.p
                        initial={{
                          opacity: 0,
                          x: -10,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay: 0.25,
                          duration: 0.4,
                        }}
                        className="text-lg font-semibold text-green-600"
                      >
                        OTP Verified!
                      </motion.p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="mb-7 text-center text-sm text-gray-500">
                      เราได้ส่งรหัสยืนยัน 6 หลักไปยัง
                      <br />
                      <span className="font-semibold text-gray-800">
                        {phone}
                      </span>
                    </p>

                    {/* OTP */}
                    {otp && (
                      <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-center">
                        <p className="text-xs font-semibold text-orange-600">
                          Development Mode
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          OTP สำหรับทดสอบ
                        </p>

                        <p className="mt-1 text-2xl font-black tracking-[0.3em] text-orange-600">
                          {otp}
                        </p>
                      </div>
                    )}

                    <motion.div
                      animate={animationControls}
                      className="flex items-center justify-center gap-2 sm:gap-3"
                    >
                      {Array.from({
                        length: OTP_LENGTH,
                      }).map((_, index) => (
                        <motion.div
                          key={index}
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            delay: index * 0.05,
                            type: 'spring',
                            stiffness: 700,
                            damping: 20,
                          }}
                          className={`h-14 w-10 overflow-hidden rounded-xl bg-white ring-2 transition-all duration-300 sm:h-16 sm:w-12 ${
                            otpState === 'error'
                              ? 'ring-red-400'
                              : 'focus-within:ring-orange-400 ring-gray-200'
                          }`}
                        >
                          <input
                            ref={(element) => {
                              inputsRef.current[index] =
                                element
                            }}
                            value={code[index] || ''}
                            onChange={(event) =>
                              handleOtpChange(
                                index,
                                event.target.value,
                              )
                            }
                            onKeyDown={(event) =>
                              handleOtpKeyDown(
                                index,
                                event,
                              )
                            }
                            onPaste={handleOtpPaste}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            autoComplete="one-time-code"
                            aria-label={`รหัส OTP หลักที่ ${
                              index + 1
                            }`}
                            className="h-full w-full bg-transparent text-center text-2xl font-semibold text-gray-900 outline-none"
                            disabled={
                              otpState === 'success' ||
                              isLoading
                            }
                          />
                        </motion.div>
                      ))}
                    </motion.div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 8,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            y: -8,
                          }}
                          className="mt-4 text-center text-xs font-medium text-red-500"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-8 text-center text-xs text-gray-500">
                      ไม่ได้รับรหัส?{' '}

                      {isResendDisabled ? (
                        <span className="font-medium text-gray-400">
                          ส่งรหัสอีกครั้งใน {countdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={isLoading}
                          className="font-semibold text-orange-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading
                            ? 'กำลังส่ง...'
                            : 'ส่งรหัสอีกครั้ง'}
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="mt-5 h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading
                        ? 'กำลังตรวจสอบ...'
                        : 'ยืนยันรหัส'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}

          {/* =========================
              PASSWORD
          ========================= */}
          {step === 'password' && (
            <form
              onSubmit={handlePassword}
              className="space-y-4"
            >
              <Field
                label="รหัสผ่านใหม่"
                icon="fa-lock"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />

              <Field
                label="ยืนยันรหัสผ่านใหม่"
                icon="fa-lock"
                type="password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setError('')
                }}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
              />

              {error && (
                <ErrorMessage>
                  {error}
                </ErrorMessage>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-2xl bg-orange-500 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'กำลังเปลี่ยนรหัสผ่าน...'
                  : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </form>
          )}

          <p className="mt-auto pt-6 text-center text-xs text-gray-400">
            จำรหัสผ่านได้แล้ว?

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="ml-1 font-bold text-orange-500 hover:underline"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </section>
      </div>

      {/* =========================
          SUCCESS MODAL
      ========================= */}
      {submitted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[330px] rounded-2xl bg-white p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.16)]">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-green-50 text-green-500">
              <i className="fa-solid fa-check text-lg" />
            </div>

            <h3 className="mt-4 text-lg font-extrabold text-gray-900">
              เปลี่ยนรหัสผ่านสำเร็จ
            </h3>

            <p className="mt-1.5 text-sm text-gray-500">
              สามารถใช้รหัสผ่านใหม่เข้าสู่ระบบได้แล้ว
            </p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-5 h-11 w-full rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-[.98]"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

function ErrorMessage({ children }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-center text-xs font-semibold text-red-500">
      {children}
    </div>
  )
}

function Field({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-gray-600">
        {label}
      </span>

      <div className="flex h-12 items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-50">
        <i
          className={`fa-solid ${icon} mr-3 text-sm text-gray-400`}
        />

        <input
          required
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-300"
        />
      </div>
    </label>
  )
}
