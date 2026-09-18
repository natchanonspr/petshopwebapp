const SOUND_KEY = 'petshop.notification.sound.enabled'

let audioContext = null
let notificationAudio = null

export function isNotificationSoundEnabled() {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(SOUND_KEY) !== 'false'
}

export function setNotificationSoundEnabled(enabled) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SOUND_KEY, String(enabled))
}

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioContext) audioContext = new AudioContextClass()
  return audioContext
}

export async function enableNotificationSound() {
  const context = getAudioContext()
  if (!context) return false
  if (context.state === 'suspended') await context.resume()
  return context.state === 'running'
}

export async function playNotificationSound() {
  if (!isNotificationSoundEnabled()) return false

  if (typeof window !== 'undefined') {
    try {
      if (!notificationAudio) notificationAudio = new Audio('/sounds/pop.mp3')
      notificationAudio.currentTime = 0
      notificationAudio.volume = 0.50
      await notificationAudio.play()
      return true
    } catch {
      // Fall back to Web Audio when the browser blocks the audio file.
    }
  }

  const context = getAudioContext()
  if (!context) return false
  if (context.state === 'suspended') {
    try { await context.resume() } catch { return false }
  }
  if (context.state !== 'running') return false

  const now = context.currentTime
  const gain = context.createGain()
  const oscillator = context.createOscillator()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, now)
  oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.08)
  oscillator.frequency.exponentialRampToValueAtTime(990, now + 0.18)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.25)
  return true
}
