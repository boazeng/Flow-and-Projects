import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import EditableTable from '../components/EditableTable'
import ParkingProjectsEmbed from './ParkingProjectsEmbed'
import TactLogo from '../components/TactLogo'
import { fetchMe } from '../auth'
import './CashflowPage.css'

const COMPANIES = [
  { id: 'all', label: 'כל החברות' },
  { id: 'חניה אורבנית', label: 'חניה אורבנית' },
  { id: 'אחזקה אורבנית', label: 'אחזקה אורבנית' },
  { id: 'אנרגיה ירוקה', label: 'אנרגיה ירוקה' },
]

const COMPANY_LIST = ['חניה אורבנית', 'אחזקה אורבנית', 'אנרגיה ירוקה']

const COMPANY_OPTIONS = [
  { v: 'חניה אורבנית', l: 'חניה' },
  { v: 'אחזקה אורבנית', l: 'אחזקה' },
  { v: 'אנרגיה ירוקה', l: 'אנרגיה' },
]

const RECURRENCE_LABEL = { monthly: 'חודשי', quarterly: 'רבעוני', annual: 'שנתי', 'one-time': 'חד פעמי' }

const COMPANY_BANKS = {
  all: [
    { key: 'חניה_פועלים',    label: 'פועלים (חניה)' },
    { key: 'אחזקה_דיסקונט', label: 'דיסקונט (אחזקה)' },
    { key: 'אחזקה_מזרחי',   label: 'מזרחי (אחזקה)' },
    { key: 'אנרגיה_פועלים', label: 'פועלים (אנרגיה)' },
  ],
  'חניה אורבנית':   [{ key: 'חניה_פועלים',    label: 'בנק פועלים' }],
  'אחזקה אורבנית':  [{ key: 'אחזקה_דיסקונט', label: 'בנק דיסקונט' }, { key: 'אחזקה_מזרחי', label: 'בנק מזרחי' }],
  'אנרגיה ירוקה': [{ key: 'אנרגיה_פועלים', label: 'בנק פועלים' }],
}

const DEFAULT_CATEGORIES = [
  'שכירות', 'ארנונה', 'דמי ניהול', 'שכר', 'שיווק', 'התקנות',
  'תקשורת', 'לקוחות', 'ספקים', 'מסים', 'רכב', 'החזר הלוואה', 'שונות',
]

function projectDays(items, ym) {
  const [y, m] = ym.split('-').map(Number)
  const result = []
  for (const item of items) {
    const start = item.start_month
    if (!start) continue
    if (ym < start) continue
    if (item.end_month && ym > item.end_month) continue
    const [sy, sm] = start.split('-').map(Number)
    const diff = (y - sy) * 12 + (m - sm)
    let applies = false
    if (item.recurrence === 'monthly') applies = true
    else if (item.recurrence === 'quarterly') applies = diff >= 0 && diff % 3 === 0
    else if (item.recurrence === 'annual')    applies = diff >= 0 && diff % 12 === 0
    else if (item.recurrence === 'one-time')  applies = ym === start
    if (!applies) continue
    const amt = parseFloat(String(item.amount || '').replace(/,/g, '')) || 0
    result.push({
      day: parseInt(item.day_of_month) || 1,
      name: item.name || '',
      project: item.project || '',
      company: item.company || '',
      category: item.category || '',
      type: item.type,
      amount: amt,
    })
  }
  return result.sort((a, b) => {
    const ap = a.category === 'פרויקטים' ? 1 : 0
    const bp = b.category === 'פרויקטים' ? 1 : 0
    return ap - bp || a.day - b.day
  })
}

function projectMonth(items, ym, minDay = 0) {
  const [y, m] = ym.split('-').map(Number)
  let income = 0, expense = 0, breakdown = []
  for (const item of items) {
    const start = item.start_month
    if (!start) continue
    if (ym < start) continue
    if (item.end_month && ym > item.end_month) continue
    const [sy, sm] = start.split('-').map(Number)
    const diff = (y - sy) * 12 + (m - sm)
    let applies = false
    if (item.recurrence === 'monthly') applies = true
    else if (item.recurrence === 'quarterly') applies = diff >= 0 && diff % 3 === 0
    else if (item.recurrence === 'annual')    applies = diff >= 0 && diff % 12 === 0
    else if (item.recurrence === 'one-time')  applies = ym === start
    if (!applies) continue
    const day = parseInt(item.day_of_month) || 1
    if (minDay > 0 && day <= minDay) continue
    const amt = parseFloat(String(item.amount || '').replace(/,/g, '')) || 0
    if (item.type === 'income') income += amt
    else expense += amt
    breakdown.push({ name: item.name, company: item.company, project: item.project || '', category: item.category, type: item.type, amount: amt, day })
  }
  return { income, expense, net: income - expense, breakdown }
}

function addMonths(ym, n) {
  let [y, m] = ym.split('-').map(Number)
  m += n
  while (m > 12) { m -= 12; y++ }
  return `${y}-${String(m).padStart(2, '0')}`
}

const fmtYM = (ym) => {
  const [y, m] = ym.split('-')
  return `${m}/${y}`
}

function loadProjectCashflows() {
  try {
    const projects = JSON.parse(localStorage.getItem('parking-projects-v3') || '[]')
    const result = []
    for (const p of projects) {
      if (p.status !== 'in-progress') continue
      try {
        const raw = localStorage.getItem(`parking-project-${p.id}`)
        if (!raw) continue
        const data = JSON.parse(raw)
        for (const entry of data.cashflow || []) {
          if (!entry.date) continue
          const amt = parseFloat(String(entry.amount || '').replace(/,/g, '')) || 0
          if (amt === 0) continue
          result.push({
            id: `proj-${p.id}-${entry.date}`,
            name: entry.details || '',
            project: p.name,
            company: p.company || 'חניה אורבנית',
            category: 'פרויקטים',
            type: amt >= 0 ? 'income' : 'expense',
            amount: Math.abs(amt),
            recurrence: 'one-time',
            start_month: entry.date.slice(0, 7),
            end_month: '',
            notes: '',
          })
        }
      } catch {}
    }
    return result
  } catch {
    return []
  }
}

const ils = (n) =>
  '₪' + Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })

function loadParkingByCompany(field) {
  try {
    const projects = JSON.parse(localStorage.getItem('parking-projects-v3') || '[]')
    const result = {}
    for (const p of projects) {
      const co = p.company || 'חניה אורבנית'
      const val = parseFloat(String(p[field] || '').replace(/,/g, '')) || 0
      result[co] = (result[co] || 0) + val
    }
    return result
  } catch { return {} }
}

const uid = () =>
  (crypto.randomUUID && crypto.randomUUID()) || 'id-' + Math.random().toString(36).slice(2)

function monthlyEquiv(item) {
  const amt = parseFloat(String(item.amount || '').replace(/,/g, '')) || 0
  if (item.recurrence === 'monthly')   return amt
  if (item.recurrence === 'quarterly') return amt / 3
  if (item.recurrence === 'annual')    return amt / 12
  return 0
}

const COMPANY_COLORS = {
  'חניה אורבנית':   { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  'אחזקה אורבנית':  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  'אנרגיה ירוקה': { bg: '#fefce8', border: '#fde68a', text: '#92400e' },
}

export default function CashflowPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => { fetchMe().then((u) => setIsAdmin(u?.role === 'admin')) }, [])
  const [mainTab, setMainTab] = useState(location.state?.tab || 'banks')
  const [expectedItems, setExpectedItems] = useState(() => {
    try {
      const saved = localStorage.getItem('flow-expected-items')
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch {}
    return []
  })
  const [bankBalances, setBankBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow-bank-balances')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      'חניה_פועלים': 0, 'אחזקה_דיסקונט': 0, 'אחזקה_מזרחי': 0, 'אנרגיה_פועלים': 0,
    }
  })
  const [balanceDate, setBalanceDate] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow-balance-date')
      if (saved) return saved
    } catch {}
    return ''
  })
  const [bankExtras, setBankExtras] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow-bank-extras')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {}
  })
  const [loanBalances, setLoanBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow-loan-balances')
      if (saved) {
        const parsed = JSON.parse(saved)
        const migrated = {}
        for (const [co, val] of Object.entries(parsed)) {
          if (Array.isArray(val)) { migrated[co] = val }
          else if (val && typeof val === 'object') {
            migrated[co] = val.amount ? [{ id: 'l0', name: '', amount: val.amount, date: val.date || '' }] : []
          }
        }
        return migrated
      }
    } catch {}
    return {}
  })
  const [rentalDeposits, setRentalDeposits] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow-rental-deposits')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {}
  })
  const [forecastView, setForecastView] = useState('monthly')
  const [selectedForecastMonth, setSelectedForecastMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [expandedMonths, setExpandedMonths] = useState(new Set())
  const [expandedQuarters, setExpandedQuarters] = useState(new Set())
  const [expCompany, setExpCompany] = useState('all')
  const [settingsCompany, setSettingsCompany] = useState('all')
  const [settingsCategory, setSettingsCategory] = useState('all')
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('cashflow-categories')
      if (saved) {
        const parsed = JSON.parse(saved)
        return Array.isArray(parsed) ? parsed : [...DEFAULT_CATEGORIES]
      }
    } catch {}
    return [...DEFAULT_CATEGORIES]
  })
  const [newCatInput, setNewCatInput] = useState('')

  const saveTimer = useRef(null)

  const saveExpected = (rows) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localStorage.setItem('flow-expected-items', JSON.stringify(rows))
    }, 700)
  }

  useEffect(() => {
    localStorage.setItem('cashflow-categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('cashflow-bank-balances', JSON.stringify(bankBalances))
  }, [bankBalances])

  useEffect(() => {
    if (balanceDate) localStorage.setItem('cashflow-balance-date', balanceDate)
  }, [balanceDate])

  useEffect(() => {
    localStorage.setItem('cashflow-bank-extras', JSON.stringify(bankExtras))
  }, [bankExtras])

  useEffect(() => {
    localStorage.setItem('cashflow-loan-balances', JSON.stringify(loanBalances))
  }, [loanBalances])

  useEffect(() => {
    localStorage.setItem('cashflow-rental-deposits', JSON.stringify(rentalDeposits))
  }, [rentalDeposits])

  const categoryOptions = categories.map((c) => ({ v: c, l: c }))
  const expectedCols = [
    { key: 'overhead',     label: 'תקורה',   type: 'checkbox', w: 'sm' },
    { key: 'name',         label: 'פרטים',   w: 'lg' },
    { key: 'company',      label: 'חברה',    type: 'select', options: COMPANY_OPTIONS },
    { key: 'type',         label: 'סוג',     type: 'select', options: [{ v: 'income', l: 'הכנסה' }, { v: 'expense', l: 'הוצאה' }] },
    { key: 'category',     label: 'קטגוריה', type: 'select', options: categoryOptions, w: 'md' },
    { key: 'amount',       label: 'סכום ₪',  type: 'money' },
    { key: 'recurrence',   label: 'תדירות',  type: 'select', options: [
      { v: 'monthly', l: 'חודשי' }, { v: 'quarterly', l: 'רבעוני' },
      { v: 'annual', l: 'שנתי' }, { v: 'one-time', l: 'חד פעמי' },
    ]},
    { key: 'day_of_month', label: 'יום',     w: 'xs' },
    { key: 'start_month',  label: 'מחודש',   type: 'month' },
    { key: 'end_month',    label: 'עד חודש', type: 'month' },
  ]

  const addCategory = () => {
    const v = newCatInput.trim()
    if (!v || categories.includes(v)) return
    setCategories((prev) => [...prev, v])
    setNewCatInput('')
  }
  const deleteCategory = (cat) => setCategories((prev) => prev.filter((c) => c !== cat))

  const expChange = (id, key, val) =>
    setExpectedItems((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, [key]: val } : r))
      saveExpected(next)
      return next
    })
  const expAdd = (id) =>
    setExpectedItems((prev) => {
      const i = prev.findIndex((r) => r.id === id)
      const copy = { ...prev[i], id: uid() }
      const next = [...prev]
      next.splice(i + 1, 0, copy)
      saveExpected(next)
      return next
    })
  const expDel = (id) =>
    setExpectedItems((prev) => {
      const next = prev.filter((r) => r.id !== id)
      saveExpected(next)
      return next
    })
  const expNew = () => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const defaultCompany = expCompany !== 'all' ? expCompany : 'חניה אורבנית'
    setExpectedItems((prev) => {
      const next = [...prev, { id: uid(), name: '', company: defaultCompany, type: 'expense', category: '', amount: 0, recurrence: 'monthly', day_of_month: '1', start_month: ym, end_month: '', notes: '', overhead: false }]
      saveExpected(next)
      return next
    })
  }

  const todayObj = new Date()
  const currentYM = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}`
  const months12 = Array.from({ length: 12 }, (_, i) => addMonths(currentYM, i))
  const allExpectedItems = [...expectedItems, ...loadProjectCashflows()]
  const filteredExpectedItems = expCompany === 'all'
    ? allExpectedItems
    : allExpectedItems.filter((i) => i.company === expCompany)

  const bdParsed = balanceDate ? new Date(balanceDate) : null
  const bdYM = bdParsed ? `${bdParsed.getFullYear()}-${String(bdParsed.getMonth() + 1).padStart(2, '0')}` : null
  const bdDay = bdParsed ? bdParsed.getDate() : 0

  const startingBalance = (() => {
    const b = bankBalances
    if (expCompany === 'all') return Object.values(b).reduce((s, v) => s + v, 0)
    if (expCompany === 'חניה אורבנית') return b['חניה_פועלים']
    if (expCompany === 'אחזקה אורבנית') return b['אחזקה_דיסקונט'] + b['אחזקה_מזרחי']
    if (expCompany === 'אנרגיה ירוקה') return b['אנרגיה_פועלים']
    return 0
  })()

  const monthlyData = months12.map((ym) => ({
    ym,
    ...projectMonth(filteredExpectedItems, ym, bdYM && ym === bdYM ? bdDay : 0),
  }))

  const backupInputRef = useRef(null)

  const handleBackup = () => {
    const keys = [
      'cashflow-bank-balances', 'cashflow-bank-extras', 'cashflow-loan-balances',
      'cashflow-balance-date', 'cashflow-categories', 'flow-expected-items', 'parking-projects-v3',
    ]
    const data = {}
    keys.forEach(k => { const v = localStorage.getItem(k); if (v) data[k] = JSON.parse(v) })
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k.startsWith('parking-project-')) { try { data[k] = JSON.parse(localStorage.getItem(k)) } catch {} }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `גיבוי-תזרים-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleRestore = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)))
        alert('הנתונים שוחזרו בהצלחה! הדף יטען מחדש.')
        window.location.reload()
      } catch { alert('קובץ לא תקין') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="cf">
      <div className="container">
        <div className="cf-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div className="cf-brand">
              <TactLogo tone="light" size={0.82} />
            </div>
            <div className="cf-tabs">
              <button className={`cf-tab ${mainTab === 'banks' ? 'active' : ''}`} onClick={() => setMainTab('banks')}>יתרות בנקים</button>
              <button className={`cf-tab ${mainTab === 'expected' ? 'active' : ''}`} onClick={() => setMainTab('expected')}>תזרים צפוי</button>
              <button className={`cf-tab ${mainTab === 'fixed' ? 'active' : ''}`} onClick={() => setMainTab('fixed')}>תקורות</button>
              <button className={`cf-tab ${mainTab === 'in-progress' ? 'active' : ''}`} onClick={() => setMainTab('in-progress')}>פרויקטים בביצוע</button>
              <button className={`cf-tab ${mainTab === 'quotes' ? 'active' : ''}`} onClick={() => setMainTab('quotes')}>פרויקטים במשא ומתן</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isAdmin && (
              <button onClick={() => navigate('/system')} title="ניהול מערכת" aria-label="ניהול מערכת"
                style={{ padding: '7px 12px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '16px', lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit' }}>
                ⚙️
              </button>
            )}
            <button onClick={handleBackup}
              style={{ padding: '7px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ⬇ גיבוי נתונים
            </button>
            <input ref={backupInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestore} />
            <button onClick={() => backupInputRef.current.click()}
              style={{ padding: '7px 16px', background: '#fff', color: '#1e3a5f', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ⬆ שחזור נתונים
            </button>
          </div>
        </div>

        {/* ══════════════ יתרות בנקים ══════════════ */}
        {mainTab === 'banks' && (() => {
          const parkGuarantees = loadParkingByCompany('guarantees')
          const parkDeposits   = loadParkingByCompany('deposits')

          const totalChecking   = COMPANY_BANKS.all.reduce((s, b) => s + (bankBalances[b.key] || 0), 0)
          const totalCredit     = COMPANY_BANKS.all.reduce((s, b) => s + (bankExtras[b.key + '_מסגרת'] || 0), 0)
          const totalLoans      = COMPANY_LIST.reduce((s, co) => s + (loanBalances[co] || []).reduce((ls, l) => ls + (l.amount || 0), 0), 0)
          const totalRentalDeposits = COMPANY_LIST.reduce((s, co) => s + (rentalDeposits[co] || 0), 0)
          const totalDeposits   = Object.values(parkDeposits).reduce((s, v) => s + v, 0) + totalRentalDeposits
          const totalGuarantees = Object.values(parkGuarantees).reduce((s, v) => s + v, 0)

          return (
            <div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {[
                  { label: 'סה"כ עו"ש',           val: totalChecking,   color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
                  { label: 'סה"כ מסגרת אשראי',    val: totalCredit,     color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
                  { label: 'סה"כ הלוואות',         val: totalLoans,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  { label: 'סה"כ פקדונות',         val: totalDeposits,   color: '#0f766e', bg: '#ecfeff', border: '#a5f3fc' },
                  { label: 'סה"כ ערבויות',         val: totalGuarantees, color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
                ].map(({ label, val, color, bg, border }) => (
                  <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.65rem 1.1rem', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#64748b', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{ils(val)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                <span style={{ fontWeight: 600 }}>יתרות נכון לתאריך:</span>
                <input type="date" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)}
                  style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {COMPANY_LIST.map((company) => {
                  const banks      = COMPANY_BANKS[company]
                  const guarantees = parkGuarantees[company] || 0
                  const deposits   = parkDeposits[company]   || 0
                  const c          = COMPANY_COLORS[company] || {}

                  return (
                    <div key={company} className="cf-card" style={{ borderTop: `4px solid ${c.border || '#e2e8f0'}` }}>
                      <div style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.95rem', color: c.text || '#1e293b', borderBottom: '1px solid #f1f5f9', background: c.bg || '#fafafa' }}>
                        {company}
                      </div>
                      <div style={{ padding: '0.9rem 1rem' }}>
                        {banks.map((b, bi) => (
                          <div key={b.key} style={{ marginBottom: bi < banks.length - 1 ? '0.85rem' : 0, paddingBottom: bi < banks.length - 1 ? '0.85rem' : 0, borderBottom: bi < banks.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: '0.45rem', textTransform: 'uppercase' }}>{b.label}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569' }}>
                                <span>יתרת עו"ש</span>
                                <input type="text"
                                  value={Number(bankBalances[b.key] || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                                  onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.-]/g, '')) || 0; setBankBalances((prev) => ({ ...prev, [b.key]: n })) }}
                                  style={{ width: '140px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', direction: 'ltr', fontSize: '0.82rem', textAlign: 'right' }} />
                              </label>
                              {company !== 'אחזקה אורבנית' && (
                                <>
                                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569' }}>
                                    <span>מסגרת אשראי</span>
                                    <input type="text"
                                      value={Number(bankExtras[b.key + '_מסגרת'] || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                                      onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.-]/g, '')) || 0; setBankExtras((prev) => ({ ...prev, [b.key + '_מסגרת']: n })) }}
                                      style={{ width: '140px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', direction: 'ltr', fontSize: '0.82rem', textAlign: 'right' }} />
                                  </label>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#1e40af', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem', marginTop: '0.1rem' }}>
                                    <span>סה"כ כולל מסגרת</span>
                                    <span style={{ direction: 'ltr' }}>{ils((bankBalances[b.key] || 0) + (bankExtras[b.key + '_מסגרת'] || 0))}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        {company !== 'אחזקה אורבנית' && (() => {
                          const loans = loanBalances[company] || []
                          const setLoans = (fn) => setLoanBalances((prev) => ({ ...prev, [company]: typeof fn === 'function' ? fn(prev[company] || []) : fn }))
                          const addLoan = () => setLoans((ls) => [...ls, { id: 'l' + Date.now(), name: '', amount: 0 }])
                          const delLoan = (id) => setLoans((ls) => ls.filter((l) => l.id !== id))
                          const updLoan = (id, field, val) => setLoans((ls) => ls.map((l) => l.id === id ? { ...l, [field]: val } : l))
                          return (
                            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>הלוואות</div>
                                <button type="button" onClick={addLoan}
                                  style={{ fontSize: '0.75rem', padding: '2px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                                  + הוסף הלוואה
                                </button>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {loans.map((l) => (
                                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <input type="text" placeholder="שם ההלוואה" value={l.name || ''}
                                      onChange={(e) => updLoan(l.id, 'name', e.target.value)}
                                      style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', fontSize: '0.82rem', color: '#475569', fontFamily: 'inherit' }} />
                                    <input type="text" placeholder="סכום ₪"
                                      value={l.amount ? Number(l.amount).toLocaleString('he-IL', { maximumFractionDigits: 0 }) : ''}
                                      onChange={(e) => updLoan(l.id, 'amount', Number(e.target.value.replace(/[^\d.-]/g, '')) || 0)}
                                      style={{ width: '110px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 8px', direction: 'ltr', fontSize: '0.82rem', textAlign: 'right' }} />
                                    <button type="button" onClick={() => delLoan(l.id)}
                                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '14px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                                      onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626' }}
                                      onMouseLeave={(e) => { e.currentTarget.style.color = '#d1d5db' }}>✕</button>
                                  </div>
                                ))}
                              </div>
                              {loans.length > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', borderTop: '1px solid #e2e8f0', paddingTop: '0.4rem', marginTop: '0.45rem' }}>
                                  <span>סה"כ הלוואות</span>
                                  <span style={{ direction: 'ltr' }}>{ils(loans.reduce((s, l) => s + (l.amount || 0), 0))}</span>
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {(() => {
                          const rentalDep = rentalDeposits[company] || 0
                          const totalCompDep = deposits + rentalDep
                          return (
                            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ marginBottom: guarantees > 0 ? '0.75rem' : 0 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.45rem' }}>פקדונות</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {deposits > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569' }}>
                                      <span>פקדונות בגין ערבויות לפרויקטים</span>
                                      <span style={{ direction: 'ltr', fontWeight: 600, color: '#0f766e' }}>{ils(deposits)}</span>
                                    </div>
                                  )}
                                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: '#475569' }}>
                                    <span>פקדון בגין ערבות לשכירות החרש 15</span>
                                    <input type="text"
                                      value={rentalDep ? Number(rentalDep).toLocaleString('he-IL', { maximumFractionDigits: 0 }) : ''}
                                      placeholder="סכום ₪"
                                      onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.-]/g, '')) || 0; setRentalDeposits((prev) => ({ ...prev, [company]: n })) }}
                                      style={{ width: '110px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', direction: 'ltr', fontSize: '0.82rem', textAlign: 'right' }} />
                                  </label>
                                  {deposits > 0 && rentalDep > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#0f766e', borderTop: '1px solid #e2e8f0', paddingTop: '0.35rem', marginTop: '0.1rem' }}>
                                      <span>סה"כ פקדונות</span>
                                      <span style={{ direction: 'ltr' }}>{ils(totalCompDep)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {guarantees > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>ערבויות</div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4338ca' }}>{ils(guarantees)}</div>
                                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>מפרויקטים</div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ══════════════ תזרים צפוי ══════════════ */}
        {mainTab === 'expected' && (
          <>
            <div style={{ marginBottom: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', padding: '0.65rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div className="cf-filters">
                  {COMPANIES.map((c) => (
                    <button key={c.id} className={`cf-filter ${expCompany === c.id ? 'active' : ''}`} onClick={() => setExpCompany(c.id)}>{c.label}</button>
                  ))}
                </div>
                <div className="cf-tabs">
                  {[['monthly', 'חודשי'], ['daily', 'יומי'], ['quarterly', 'רבעוני']].map(([v, l]) => (
                    <button key={v} className={`cf-tab ${forecastView === v ? 'active' : ''}`} onClick={() => setForecastView(v)}>{l}</button>
                  ))}
                </div>
                {forecastView === 'daily' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#475569' }}>
                    חודש:
                    <input type="month" value={selectedForecastMonth} onChange={(e) => setSelectedForecastMonth(e.target.value)}
                      style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', fontSize: '0.875rem' }} />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', padding: '0.65rem 1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>יתרות בנק:</span>
                {(COMPANY_BANKS[expCompany] || COMPANY_BANKS.all).map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#475569' }}>
                    {label} (₪):
                    <input type="text" value={Number(bankBalances[key] || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                      onChange={(e) => { const n = Number(e.target.value.replace(/[^\d.-]/g, '')) || 0; setBankBalances((prev) => ({ ...prev, [key]: n })) }}
                      style={{ width: '120px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', direction: 'ltr', fontSize: '0.875rem' }} />
                  </label>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#475569' }}>
                  נכון לתאריך:
                  <input type="date" value={balanceDate} onChange={(e) => setBalanceDate(e.target.value)}
                    style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', fontSize: '0.875rem' }} />
                </label>
              </div>
            </div>

            <div className="cf-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '1rem', color: '#1e40af', borderBottom: '1px solid #f1f5f9' }}>
                {forecastView === 'monthly'   && 'תחזית חודשית — 12 חודשים קדימה'}
                {forecastView === 'daily'     && `תחזית יומית — ${fmtYM(selectedForecastMonth)}`}
                {forecastView === 'quarterly' && 'תחזית רבעונית — 12 חודשים קדימה'}
              </div>

              {/* ── Monthly ── */}
              {forecastView === 'monthly' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', direction: 'rtl' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: '28px', padding: '8px 4px', borderBottom: '2px solid #e2e8f0' }}></th>
                      <th style={{ width: '44px', padding: '8px 8px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#94a3b8' }}>יום</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>חודש</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#15803d' }}>הכנסות</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#dc2626' }}>הוצאות</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>נטו</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#0369a1' }}>מצטבר</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.flatMap(({ ym, income, expense, net, breakdown }, idx) => {
                      const cumulative = startingBalance + monthlyData.slice(0, idx + 1).reduce((s, d) => s + d.net, 0)
                      const isExpanded = expandedMonths.has(ym)
                      const hasBreakdown = breakdown.length > 0
                      return [
                        <tr key={ym} style={{ borderBottom: '1px solid #f1f5f9', cursor: hasBreakdown ? 'pointer' : 'default', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                          onClick={() => { if (!hasBreakdown) return; setExpandedMonths((prev) => { const next = new Set(prev); next.has(ym) ? next.delete(ym) : next.add(ym); return next }) }}>
                          <td style={{ padding: '8px 4px', textAlign: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>{hasBreakdown ? (isExpanded ? '▼' : '▶') : ''}</td>
                          <td style={{ padding: '8px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}></td>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{fmtYM(ym)}</td>
                          <td style={{ padding: '8px 12px', color: '#15803d' }}>{income ? ils(income) : '—'}</td>
                          <td style={{ padding: '8px 12px', color: '#dc2626' }}>{expense ? ils(expense) : '—'}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: net >= 0 ? '#15803d' : '#dc2626' }}>{ils(net)}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: cumulative >= 0 ? '#0369a1' : '#dc2626' }}>{ils(cumulative)}</td>
                        </tr>,
                        ...(isExpanded ? [...breakdown].sort((a, b) => { const ap = a.category === 'פרויקטים' ? 1 : 0; const bp = b.category === 'פרויקטים' ? 1 : 0; return ap - bp || a.day - b.day }).map((b, bi) => {
                          const isProj = b.category === 'פרויקטים'
                          return (
                            <tr key={`${ym}-b${bi}`} style={{ background: isProj ? '#fdf4ff' : '#eef2ff', borderBottom: `1px solid ${isProj ? '#e9d5ff' : '#e0e7ff'}` }}>
                              <td></td>
                              <td style={{ padding: '5px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 500 }}>{b.day || ''}</td>
                              <td style={{ padding: '5px 12px 5px 24px', color: isProj ? '#7e22ce' : '#4338ca', fontSize: '0.8rem', fontWeight: 500 }}>
                                {isProj && b.project && <span style={{ marginLeft: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#7e22ce' }}>{b.project}</span>}
                                {b.name || (!isProj && '(ללא שם)')}
                              </td>
                              <td style={{ padding: '5px 12px', color: '#15803d', fontSize: '0.8rem' }}>{b.type === 'income' ? ils(b.amount) : ''}</td>
                              <td style={{ padding: '5px 12px', color: '#dc2626', fontSize: '0.8rem' }}>{b.type === 'expense' ? ils(b.amount) : ''}</td>
                              <td style={{ padding: '5px 12px', color: '#64748b', fontSize: '0.8rem' }}>{isProj ? 'חניה אורבנית' : b.company}</td>
                              <td style={{ padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, color: isProj ? '#a855f7' : '#64748b' }}>{b.category}</td>
                            </tr>
                          )
                        }) : []),
                      ]
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totalIncome  = monthlyData.reduce((s, d) => s + d.income, 0)
                      const totalExpense = monthlyData.reduce((s, d) => s + d.expense, 0)
                      const totalNet     = totalIncome - totalExpense
                      const finalBalance = startingBalance + totalNet
                      return (
                        <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                          <td></td><td></td>
                          <td style={{ padding: '10px 12px' }}>סה"כ שנתי</td>
                          <td style={{ padding: '10px 12px', color: '#15803d' }}>{ils(totalIncome)}</td>
                          <td style={{ padding: '10px 12px', color: '#dc2626' }}>{ils(totalExpense)}</td>
                          <td style={{ padding: '10px 12px', color: totalNet >= 0 ? '#15803d' : '#dc2626' }}>{ils(totalNet)}</td>
                          <td style={{ padding: '10px 12px', color: finalBalance >= 0 ? '#0369a1' : '#dc2626' }}>{ils(finalBalance)}</td>
                        </tr>
                      )
                    })()}
                  </tfoot>
                </table>
              )}

              {/* ── Daily ── */}
              {forecastView === 'daily' && (() => {
                let dayItems = projectDays(filteredExpectedItems, selectedForecastMonth)
                if (balanceDate) {
                  const bd = new Date(balanceDate)
                  const bdYMLocal = `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}`
                  if (bdYMLocal === selectedForecastMonth) {
                    dayItems = dayItems.filter((item) => item.day > bd.getDate())
                  }
                }
                let running = startingBalance
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', direction: 'rtl' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ width: '44px', padding: '8px 12px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>יום</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>פרטים</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>חברה</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>קטגוריה</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#15803d' }}>הכנסה</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#dc2626' }}>הוצאה</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#0369a1' }}>מצטבר</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayItems.length === 0
                        ? <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>אין תנועות לחודש זה</td></tr>
                        : dayItems.map((item, i) => {
                          if (item.type === 'income') running += item.amount; else running -= item.amount
                          const snap = running
                          const isProj = item.category === 'פרויקטים'
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>{item.day}</td>
                              <td style={{ padding: '8px 12px', color: isProj ? '#7e22ce' : '#1e293b' }}>
                                {isProj && item.project && <span style={{ fontWeight: 700, marginLeft: '6px' }}>{item.project}</span>}
                                {item.name}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.82rem' }}>{item.company}</td>
                              <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '0.82rem' }}>{item.category}</td>
                              <td style={{ padding: '8px 12px', color: '#15803d' }}>{item.type === 'income' ? ils(item.amount) : ''}</td>
                              <td style={{ padding: '8px 12px', color: '#dc2626' }}>{item.type === 'expense' ? ils(item.amount) : ''}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: snap >= 0 ? '#0369a1' : '#dc2626' }}>{ils(snap)}</td>
                            </tr>
                          )
                        })
                      }
                    </tbody>
                    {dayItems.length > 0 && (() => {
                      const inc = dayItems.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0)
                      const exp = dayItems.filter((i) => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
                      return (
                        <tfoot>
                          <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                            <td></td>
                            <td style={{ padding: '10px 12px' }}>סה"כ חודש</td>
                            <td></td><td></td>
                            <td style={{ padding: '10px 12px', color: '#15803d' }}>{ils(inc)}</td>
                            <td style={{ padding: '10px 12px', color: '#dc2626' }}>{ils(exp)}</td>
                            <td style={{ padding: '10px 12px', color: running >= 0 ? '#0369a1' : '#dc2626' }}>{ils(running)}</td>
                          </tr>
                        </tfoot>
                      )
                    })()}
                  </table>
                )
              })()}

              {/* ── Quarterly ── */}
              {forecastView === 'quarterly' && (() => {
                const quarters = [0, 1, 2, 3].map((qi) => {
                  const qMonths = months12.slice(qi * 3, qi * 3 + 3)
                  const monthData = qMonths.map((ym) => ({
                    ym,
                    ...projectMonth(filteredExpectedItems, ym, bdYM && ym === bdYM ? bdDay : 0),
                  }))
                  const totals = monthData.reduce((acc, d) => ({
                    income: acc.income + d.income, expense: acc.expense + d.expense, net: acc.net + d.net,
                  }), { income: 0, expense: 0, net: 0 })
                  const breakdown = monthData.flatMap((d) =>
                    d.breakdown.map((b) => ({ ...b, ym: d.ym }))
                  ).sort((a, b) => { const ap = a.category === 'פרויקטים' ? 1 : 0; const bp = b.category === 'פרויקטים' ? 1 : 0; return ap - bp || a.ym.localeCompare(b.ym) || a.day - b.day })
                  return { label: `${fmtYM(qMonths[0])} – ${fmtYM(qMonths[qMonths.length - 1])}`, ...totals, breakdown }
                })
                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', direction: 'rtl' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ width: '28px', padding: '8px 4px', borderBottom: '2px solid #e2e8f0' }}></th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>רבעון</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#15803d' }}>הכנסות</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#dc2626' }}>הוצאות</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0' }}>נטו</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, borderBottom: '2px solid #e2e8f0', color: '#0369a1' }}>מצטבר</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quarters.flatMap(({ label, income, expense, net, breakdown }, qi) => {
                        const cumulative = startingBalance + quarters.slice(0, qi + 1).reduce((s, q) => s + q.net, 0)
                        const isExpanded = expandedQuarters.has(qi)
                        const hasBreakdown = breakdown.length > 0
                        return [
                          <tr key={qi} style={{ borderBottom: '1px solid #f1f5f9', background: qi % 2 === 0 ? '#fff' : '#fafafa', cursor: hasBreakdown ? 'pointer' : 'default' }}
                            onClick={() => { if (!hasBreakdown) return; setExpandedQuarters((prev) => { const next = new Set(prev); next.has(qi) ? next.delete(qi) : next.add(qi); return next }) }}>
                            <td style={{ padding: '8px 4px', textAlign: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>{hasBreakdown ? (isExpanded ? '▼' : '▶') : ''}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600 }}>{label}</td>
                            <td style={{ padding: '10px 12px', color: '#15803d' }}>{income ? ils(income) : '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#dc2626' }}>{expense ? ils(expense) : '—'}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: net >= 0 ? '#15803d' : '#dc2626' }}>{ils(net)}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: cumulative >= 0 ? '#0369a1' : '#dc2626' }}>{ils(cumulative)}</td>
                          </tr>,
                          ...(isExpanded ? breakdown.map((b, bi) => {
                            const isProj = b.category === 'פרויקטים'
                            return (
                              <tr key={`q${qi}-b${bi}`} style={{ background: isProj ? '#fdf4ff' : '#eef2ff', borderBottom: `1px solid ${isProj ? '#e9d5ff' : '#e0e7ff'}` }}>
                                <td></td>
                                <td style={{ padding: '5px 12px 5px 24px', color: isProj ? '#7e22ce' : '#4338ca', fontSize: '0.8rem', fontWeight: 500 }}>
                                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: '8px' }}>{fmtYM(b.ym)}/{b.day}</span>
                                  {isProj && b.project && <span style={{ fontWeight: 700, marginLeft: '4px', color: '#7e22ce' }}>{b.project}</span>}
                                  {b.name || (!isProj && '(ללא שם)')}
                                </td>
                                <td style={{ padding: '5px 12px', color: '#15803d', fontSize: '0.8rem' }}>{b.type === 'income' ? ils(b.amount) : ''}</td>
                                <td style={{ padding: '5px 12px', color: '#dc2626', fontSize: '0.8rem' }}>{b.type === 'expense' ? ils(b.amount) : ''}</td>
                                <td style={{ padding: '5px 12px', color: '#64748b', fontSize: '0.8rem' }}>{isProj ? '' : b.company}</td>
                                <td style={{ padding: '5px 12px', fontSize: '0.75rem', color: '#64748b' }}>{b.category}</td>
                              </tr>
                            )
                          }) : []),
                        ]
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const totalIncome  = quarters.reduce((s, q) => s + q.income, 0)
                        const totalExpense = quarters.reduce((s, q) => s + q.expense, 0)
                        const totalNet     = totalIncome - totalExpense
                        const finalBalance = startingBalance + totalNet
                        return (
                          <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #cbd5e1' }}>
                            <td></td>
                            <td style={{ padding: '10px 12px' }}>סה"כ שנתי</td>
                            <td style={{ padding: '10px 12px', color: '#15803d' }}>{ils(totalIncome)}</td>
                            <td style={{ padding: '10px 12px', color: '#dc2626' }}>{ils(totalExpense)}</td>
                            <td style={{ padding: '10px 12px', color: totalNet >= 0 ? '#15803d' : '#dc2626' }}>{ils(totalNet)}</td>
                            <td style={{ padding: '10px 12px', color: finalBalance >= 0 ? '#0369a1' : '#dc2626' }}>{ils(finalBalance)}</td>
                          </tr>
                        )
                      })()}
                    </tfoot>
                  </table>
                )
              })()}
            </div>

            {/* ── Settings ── */}
            <div className="cf-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '1rem', color: '#1e40af', borderBottom: '1px solid #f1f5f9' }}>
                הגדרות — פריטי תזרים
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.5rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                <div className="cf-filters" style={{ margin: 0 }}>
                  {COMPANIES.map((c) => (
                    <button key={c.id} className={`cf-filter ${settingsCompany === c.id ? 'active' : ''}`} onClick={() => setSettingsCompany(c.id)} style={{ fontSize: '0.78rem', padding: '3px 10px' }}>{c.label}</button>
                  ))}
                </div>
                <select value={settingsCategory} onChange={(e) => setSettingsCategory(e.target.value)}
                  style={{ fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px 8px', color: '#475569' }}>
                  <option value="all">כל הקטגוריות</option>
                  {[...new Set(expectedItems.map((i) => i.category).filter(Boolean))].sort().map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {(settingsCompany !== 'all' || settingsCategory !== 'all') && (
                  <button onClick={() => { setSettingsCompany('all'); setSettingsCategory('all') }}
                    style={{ fontSize: '0.78rem', padding: '3px 8px', border: '1px solid #fca5a5', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                    נקה
                  </button>
                )}
              </div>
              <>
                <EditableTable
                  columns={expectedCols}
                  data={expectedItems.filter((i) => {
                    if (settingsCompany !== 'all' && i.company !== settingsCompany) return false
                    if (settingsCategory !== 'all' && i.category !== settingsCategory) return false
                    return true
                  })}
                  onChange={expChange}
                  onAddBelow={expAdd}
                  onDelete={expDel}
                />
                <button className="cf-add-row" onClick={expNew}>+ הוסף שורה</button>
                <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.55rem' }}>ניהול קטגוריות</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    {categories.map((cat) => (
                      <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e0e7ff', color: '#3730a3', borderRadius: '999px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 500 }}>
                        {cat}
                        <button onClick={() => deleteCategory(cat)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1, padding: '0 0 0 2px' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      placeholder="קטגוריה חדשה…"
                      style={{ flex: 1, maxWidth: '220px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px 10px', fontSize: '0.82rem' }} />
                    <button onClick={addCategory}
                      style={{ padding: '4px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}>
                      הוסף
                    </button>
                  </div>
                </div>
              </>
            </div>
          </>
        )}

        {/* ══════════════ הוצאות קבועות ══════════════ */}
        {mainTab === 'fixed' && (() => {
          const fixedItems = expectedItems.filter((i) => i.overhead)
          const grandMonthlyExp = fixedItems.filter((i) => i.type === 'expense').reduce((s, i) => s + monthlyEquiv(i), 0)

          return (
            <div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {[
                  { label: 'סה"כ הוצאות חודשיות', val: grandMonthlyExp,      color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                  { label: 'סה"כ הוצאות שנתיות',  val: grandMonthlyExp * 12, color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe' },
                ].map(({ label, val, color, bg, border }) => (
                  <div key={label} style={{ flex: '1 1 180px', background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color }}>{ils(val)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '1rem' }}>
                {COMPANY_LIST.map((company) => {
                  const items = fixedItems.filter((i) => i.company === company)
                  if (items.length === 0) return null
                  const expenses = items.filter((i) => i.type === 'expense').sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.name || '').localeCompare(b.name || ''))
                  const incomes  = items.filter((i) => i.type === 'income').sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.name || '').localeCompare(b.name || ''))
                  const totalMonthlyExp = expenses.reduce((s, i) => s + monthlyEquiv(i), 0)
                  const totalMonthlyInc = incomes.reduce((s, i) => s + monthlyEquiv(i), 0)
                  const netMonthly = totalMonthlyInc - totalMonthlyExp
                  const colors = COMPANY_COLORS[company] || { bg: '#f8fafc', border: '#e2e8f0', text: '#1e293b' }

                  const renderRows = (rows, isExpense) =>
                    rows.map((item, i) => {
                      const meq = monthlyEquiv(item)
                      return (
                        <tr key={item.id || i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '7px 14px', color: '#1e293b', fontSize: '0.875rem' }}>{item.name || '—'}</td>
                          <td style={{ padding: '7px 14px', color: '#64748b', fontSize: '0.82rem' }}>{item.category || '—'}</td>
                          <td style={{ padding: '7px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', direction: 'ltr', color: isExpense ? '#dc2626' : '#15803d' }}>{ils(meq)}</td>
                        </tr>
                      )
                    })

                  return (
                    <div key={company} className="cf-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                      <div style={{ padding: '0.75rem 1.25rem', background: colors.bg, borderBottom: `2px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.02rem', color: colors.text }}>{company}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', fontSize: '0.78rem' }}>
                          {totalMonthlyInc > 0 && <span style={{ color: '#15803d' }}>הכנסה: <strong>{ils(totalMonthlyInc)}</strong></span>}
                          {totalMonthlyExp > 0 && <span style={{ color: '#dc2626' }}>הוצאה: <strong>{ils(totalMonthlyExp)}</strong></span>}
                          <span style={{ color: netMonthly >= 0 ? '#0369a1' : '#dc2626' }}>נטו שנתי: <strong>{ils(netMonthly * 12)}</strong></span>
                        </div>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', direction: 'rtl' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e2e8f0', color: '#475569' }}>שם פריט</th>
                            <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e2e8f0', color: '#475569' }}>קט.</th>
                            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid #e2e8f0', color: '#475569' }}>₪/חודש</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.length > 0 && (
                            <>
                              {incomes.length > 0 && <tr style={{ background: '#fef2f2' }}><td colSpan={3} style={{ padding: '4px 14px', fontSize: '0.73rem', fontWeight: 700, color: '#dc2626' }}>הוצאות</td></tr>}
                              {renderRows(expenses, true)}
                            </>
                          )}
                          {incomes.length > 0 && (
                            <>
                              <tr style={{ background: '#f0fdf4' }}><td colSpan={3} style={{ padding: '4px 14px', fontSize: '0.73rem', fontWeight: 700, color: '#15803d' }}>הכנסות</td></tr>
                              {renderRows(incomes, false)}
                            </>
                          )}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #e2e8f0' }}>
                            <td colSpan={2} style={{ padding: '9px 14px', color: '#475569' }}>סה"כ חודשי</td>
                            <td style={{ padding: '9px 14px', textAlign: 'left', direction: 'ltr', color: netMonthly >= 0 ? '#15803d' : '#dc2626' }}>{ils(netMonthly)}</td>
                          </tr>
                          <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                            <td colSpan={2} style={{ padding: '9px 14px', color: '#475569' }}>סה"כ שנתי</td>
                            <td style={{ padding: '9px 14px', textAlign: 'left', direction: 'ltr', color: netMonthly >= 0 ? '#0369a1' : '#dc2626' }}>{ils(netMonthly * 12)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ══════════════ פרויקטים בביצוע ══════════════ */}
        {mainTab === 'in-progress' && (
          <ParkingProjectsEmbed tab="in-progress" />
        )}

        {/* ══════════════ פרויקטים במשא ומתן ══════════════ */}
        {mainTab === 'quotes' && (
          <ParkingProjectsEmbed tab="quotes" />
        )}
      </div>
    </div>
  )
}
