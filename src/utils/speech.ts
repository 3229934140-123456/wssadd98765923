let lastSpeakTime = 0
let lastSpeakText = ''
const SPEAK_COOLDOWN = 15000

const SPEAK_CONTENTS: Record<string, { title: string; detail: string }> = {
  'warning-high': {
    title: '温度接近上限',
    detail: '请注意检查车门是否关好，确认制冷机油量是否充足，查看停车环境是否有暴晒。'
  },
  'warning-low': {
    title: '温度接近下限',
    detail: '请注意检查温度传感器是否正常，确认制冷机设定是否偏低，避免货品冻坏。'
  },
  'danger-high': {
    title: '温度已超上限',
    detail: '请立即停车检查！请检查车厢门是否关好，确认制冷机是否正常运行，必要时联系调度说明情况。'
  },
  'danger-low': {
    title: '温度已超下限',
    detail: '请立即调节制冷温度！检查温控系统是否故障，防止货品冻坏造成损失。'
  }
}

export function speakWarning(status: string, force: boolean = false): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  const content = SPEAK_CONTENTS[status]
  if (!content) return

  const now = Date.now()
  if (!force && now - lastSpeakTime < SPEAK_COOLDOWN && lastSpeakText === status) {
    return
  }

  try {
    window.speechSynthesis.cancel()

    const text = `${content.title}。${content.detail}`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => {
      console.log('[Speech] speaking:', status)
    }
    utterance.onerror = (e) => {
      console.warn('[Speech] error:', e)
    }

    window.speechSynthesis.speak(utterance)
    lastSpeakTime = now
    lastSpeakText = status
  } catch (e) {
    console.warn('[Speech] speak failed:', e)
  }
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }
  try {
    window.speechSynthesis.cancel()
  } catch (e) {
    console.warn('[Speech] stop failed:', e)
  }
}

export function isSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window
}
