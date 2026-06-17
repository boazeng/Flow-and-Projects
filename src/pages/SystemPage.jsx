import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMe } from '../auth'
import './CashflowPage.css'

const ROLES = ['admin', 'approver', 'user']
const ROLE_LABELS = { admin: 'מנהל', approver: 'מאשר', user: 'משתמש' }

export default function SystemPage() {
  const navigate = useNavigate()
  const [me, setMe] = useState(undefined)        // undefined = loading
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('user')

  useEffect(() => {
    fetchMe().then((u) => {
      setMe(u)
      if (u?.role === 'admin') loadUsers()
      else setLoading(false)
    })
  }, [])

  const loadUsers = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/auth/users', { credentials: 'same-origin' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users || [])
    } catch { setError('שגיאה בטעינת המשתמשים') }
    setLoading(false)
  }

  const saveUser = async (email, patch) => {
    const ex = users.find((u) => u.email === email) || {}
    const body = {
      email,
      role: patch.role ?? ex.role ?? 'user',
      name: patch.name ?? ex.name ?? '',
      active: patch.active ?? ex.active ?? true,
    }
    const res = await fetch('/auth/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', body: JSON.stringify(body),
    })
    if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.detail || 'השמירה נכשלה'); return }
    loadUsers()
  }

  const addUser = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) { alert('אימייל לא תקין'); return }
    await saveUser(email, { role: newRole, active: true, name: '' })
    setNewEmail(''); setNewRole('user')
  }

  const deleteUser = async (email) => {
    if (!window.confirm(`להסיר את ${email} מרשימת המורשים?`)) return
    const res = await fetch('/auth/users/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', body: JSON.stringify({ email }),
    })
    if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.detail || 'המחיקה נכשלה'); return }
    loadUsers()
  }

  if (me === undefined) {
    return <div className="cf"><div className="container"><p style={{ padding: '2rem', color: '#64748b' }}>טוען…</p></div></div>
  }
  if (!me || me.role !== 'admin') {
    return (
      <div className="cf"><div className="container">
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>אין גישה</h2>
          <p style={{ color: '#64748b', marginBottom: '1.25rem' }}>העמוד מיועד למנהלי מערכת בלבד.</p>
          <button onClick={() => navigate('/')} style={btnPrimary}>חזרה לתזרים</button>
        </div>
      </div></div>
    )
  }

  return (
    <div className="cf"><div className="container">
      <div className="cf-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>⚙️</span>
          <h1 className="cf-title" style={{ margin: 0 }}>ניהול מערכת</h1>
        </div>
        <button onClick={() => navigate('/')} style={btnGhost}>← חזרה לתזרים</button>
      </div>

      <div className="cf-tabs" style={{ marginBottom: '1.25rem' }}>
        <button className={`cf-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>משתמשי מערכת</button>
      </div>

      {tab === 'users' && (
        <div className="cf-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email"
              placeholder="הוסף אימייל (Gmail)…" onKeyDown={(e) => { if (e.key === 'Enter') addUser() }}
              style={{ ...field, minWidth: '260px' }} />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={field}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            <button onClick={addUser} style={btnPrimary}>+ הוסף משתמש</button>
          </div>

          {loading ? <p style={{ color: '#64748b' }}>טוען…</p>
            : error ? <p style={{ color: '#dc2626' }}>{error}</p>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', direction: 'rtl' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={th}>אימייל</th>
                    <th style={th}>שם</th>
                    <th style={th}>רמת הרשאה</th>
                    <th style={th}>סטטוס</th>
                    <th style={th}>כניסה אחרונה</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>אין משתמשים</td></tr>}
                  {users.map((u, i) => {
                    const self = u.email === me.email
                    return (
                      <tr key={u.email} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>{u.email}{self && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}> (אתה)</span>}</td>
                        <td style={td}>{u.name || '—'}</td>
                        <td style={td}>
                          <select value={u.role} disabled={self} onChange={(e) => saveUser(u.email, { role: e.target.value })}
                            style={{ ...field, padding: '4px 8px', opacity: self ? 0.6 : 1 }}>
                            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                        </td>
                        <td style={td}>
                          <button disabled={self} onClick={() => saveUser(u.email, { active: u.active ? false : true })}
                            style={{ ...badge, background: u.active ? '#dcfce7' : '#fee2e2', color: u.active ? '#15803d' : '#b91c1c', cursor: self ? 'default' : 'pointer', opacity: self ? 0.6 : 1 }}>
                            {u.active ? 'פעיל' : 'מושבת'}
                          </button>
                        </td>
                        <td style={{ ...td, color: '#94a3b8', fontSize: '0.8rem' }}>{u.last_login_at ? String(u.last_login_at).slice(0, 10) : '—'}</td>
                        <td style={td}>{!self && <button onClick={() => deleteUser(u.email)} title="הסר" style={delBtn}>✕</button>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

          <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            רמות הרשאה: <b>מנהל</b> — גישה מלאה כולל ניהול משתמשים · <b>מאשר</b> / <b>משתמש</b> — גישה למערכת בלבד.
          </p>
        </div>
      )}
    </div></div>
  )
}

const field = { border: '1px solid #cbd5e1', borderRadius: '8px', padding: '7px 12px', fontSize: '0.9rem', fontFamily: 'inherit', direction: 'rtl' }
const btnPrimary = { padding: '7px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhost = { padding: '7px 16px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const th = { padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#475569' }
const td = { padding: '10px 12px', textAlign: 'right', color: '#1e293b' }
const badge = { border: 'none', borderRadius: '999px', padding: '3px 14px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit' }
const delBtn = { border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '15px', fontWeight: 700 }
