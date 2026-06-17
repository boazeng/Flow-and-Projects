// Server sync — mirrors localStorage to the central backend so data is shared
// across devices/browsers instead of living in one browser.
//
// Strategy (deliberately low-touch): the components keep using localStorage as
// their synchronous source of truth. We just:
//   1. on startup, pull all keys from the server into localStorage (before React
//      renders), then
//   2. patch localStorage.setItem/removeItem so every write is also pushed to
//      the server (debounced per key).
//
// The whole app is served behind Google auth, so by the time this runs the user
// is already authenticated and the session cookie is sent automatically.

const API = '/api/state'
const origSet = localStorage.setItem.bind(localStorage)
const origRemove = localStorage.removeItem.bind(localStorage)

// Only mirror this app's own keys (cashflow-*, flow-*, parking*).
const shouldSync = (key) => /^(cashflow-|flow-|parking)/.test(key)

const timers = {}

function pushKey(key) {
  clearTimeout(timers[key])
  timers[key] = setTimeout(async () => {
    const value = localStorage.getItem(key)
    if (value == null) return
    try {
      await fetch(`${API}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ value }),
      })
    } catch (e) {
      console.warn('serverSync: push failed for', key, e)
    }
  }, 500)
}

function deleteKey(key) {
  fetch(`${API}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch((e) => console.warn('serverSync: delete failed for', key, e))
}

function patch() {
  localStorage.setItem = function (key, value) {
    origSet(key, value)
    if (shouldSync(key)) pushKey(key)
  }
  localStorage.removeItem = function (key) {
    origRemove(key)
    if (shouldSync(key)) deleteKey(key)
  }
}

// Pull server state into localStorage, then enable write-through. Always
// resolves — if the server is unreachable we fall back to local data so the
// app still works.
export async function bootstrapFromServer() {
  try {
    const res = await fetch(API, { credentials: 'same-origin' })
    if (res.ok) {
      const data = await res.json()
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string') origSet(k, v) // origSet → no echo back to server
      }
    }
  } catch (e) {
    console.warn('serverSync: bootstrap failed, using local data', e)
  }
  patch()
}
