// Current signed-in user (from shared-auth). Returns {email, role, name} or null.
export async function fetchMe() {
  try {
    const res = await fetch('/auth/me', { credentials: 'same-origin' })
    if (!res.ok) return null
    const data = await res.json()
    return data && data.email ? data : null
  } catch {
    return null
  }
}
