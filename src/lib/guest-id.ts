const GUEST_ID_KEY = 'kurio-guest-id'

export function getGuestId() {
  if (typeof localStorage === 'undefined') return 'server-guest-id'
  let guestId = localStorage.getItem(GUEST_ID_KEY)
  if (!guestId) {
    guestId = crypto.randomUUID()
    localStorage.setItem(GUEST_ID_KEY, guestId)
  }
  return guestId
}
