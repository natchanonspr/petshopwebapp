import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 60)
    const leaveTimer = window.setTimeout(() => setLeaving(true), 2050)
    const finishTimer = window.setTimeout(() => onFinish?.(), 2450)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(leaveTimer)
      window.clearTimeout(finishTimer)
    }
  }, [onFinish])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-hidden bg-orange-50 transition-opacity duration-[400ms] ease-out ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-label="Pet Shop"
    >
      <div className="splash-glow splash-glow-one" />
      <div className="splash-glow splash-glow-two" />

      <div
        className={`relative flex h-full w-full max-w-[430px] flex-col items-center justify-center px-8 transition-all duration-700 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <div className="splash-mascot-wrap" aria-hidden="true">
          <div className="splash-shadow" />
          <span className="splash-paw paw-one">🐾</span>
          <span className="splash-paw paw-two">🐾</span>

          <div className="splash-cat">
            <div className="cat-ear cat-ear-left" />
            <div className="cat-ear cat-ear-right" />
            <div className="cat-face">
              <span className="cat-eye cat-eye-left" />
              <span className="cat-eye cat-eye-right" />
              <span className="cat-nose" />
              <span className="cat-mouth" />
              <span className="cat-whisker whisker-left-one" />
              <span className="cat-whisker whisker-left-two" />
              <span className="cat-whisker whisker-right-one" />
              <span className="cat-whisker whisker-right-two" />
            </div>
          </div>
        </div>

        <div className="splash-brand">
          <div className="splash-logo-mark">
            <i className="fa-solid fa-paw" />
          </div>
          <h1 className="splash-title">Pet Shop</h1>
          <p className="splash-tagline">เพื่อนรักของน้อง ๆ</p>
        </div>

        <div className="splash-loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}
