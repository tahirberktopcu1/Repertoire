export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  new Notification(title, {
    body,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: tag || undefined,
  })
}

export function checkRehearsalReminders(
  rehearsals: { id: string; title: string | null; date: string; start_time: string; location: string | null }[]
) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  rehearsals.forEach((rehearsal) => {
    const rehearsalDate = new Date(rehearsal.date + 'T00:00:00')
    const diffDays = Math.round((rehearsalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const name = rehearsal.title || 'Prova'
    const time = rehearsal.start_time.slice(0, 5)
    const loc = rehearsal.location ? ` - ${rehearsal.location}` : ''

    // Bugun zaten bildirim gonderildi mi kontrol et
    const sentKey = `reminder-${rehearsal.id}-${diffDays}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(sentKey)) return

    if (diffDays === 2) {
      sendNotification(
        '2 Gün Sonra Prova Var!',
        `${name} — ${rehearsal.date} ${time}${loc}`,
        sentKey
      )
      sessionStorage.setItem(sentKey, '1')
    } else if (diffDays === 1) {
      sendNotification(
        'Yarin Prova Var!',
        `${name} — Yarın saat ${time}${loc}`,
        sentKey
      )
      sessionStorage.setItem(sentKey, '1')
    } else if (diffDays === 0) {
      sendNotification(
        'Bugün Prova Günü!',
        `${name} — Bugün saat ${time}${loc}`,
        sentKey
      )
      sessionStorage.setItem(sentKey, '1')
    }
  })
}
