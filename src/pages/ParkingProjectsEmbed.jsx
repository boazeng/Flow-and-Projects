import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ArielPage.css'

const PROJECT_STATUSES = [
  { id: 'signed',    label: 'נחתם חוזה - טרם שולמה מקדמה', color: '#475569', bg: '#f8fafc', border: '#cbd5e1' },
  { id: 'advance',   label: 'שולמה מקדמה',                  color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { id: 'ordered',   label: 'בוצעה הזמנה, הציוד טרם הגיע לארץ', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  { id: 'arrived',   label: 'הציוד הגיע לאתר',             color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { id: 'install',   label: 'בהתקנה',                       color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
  { id: 'done',      label: 'הסתיים',                       color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
]

const INITIAL_PROJECTS = [
  { id: 'upi831', name: 'דניאל 53-55, בת ים',       status: 'quotes', code: 'UPI831', location: 'בת ים',    type: 'Robot',      entranceType: 'Vertical cab.', developer: 'DY',      handler: '', spots: '35', percentage: '60',  price: '', advance: '', updateDate: '2026-02-09', statusNote: 'לא ניתן לקנות' },
  { id: 'upi099', name: 'בילו 11, תל אביב',        status: 'quotes', code: 'UPI099', location: 'תל אביב', type: 'Parkmatrix', entranceType: 'Vertical cab.', developer: 'Parkday', handler: '', spots: '12', percentage: '90',  price: '', advance: '', updateDate: '2026-02-09', statusNote: 'חוזה / חתמנו' },
  { id: 'upi061', name: 'הרצל / זוטא, ירושלים',   status: 'quotes', code: 'UPI061', location: 'ירושלים',  type: 'Parkmatrix', entranceType: 'Room',          developer: 'Parkday', handler: '', spots: '53', percentage: '90',  price: '', advance: '', updateDate: '2026-02-09', statusNote: 'שלם לחתמנו' },
  { id: 'upi021', name: 'הירקון 108, תל אביב',     status: 'quotes', code: 'UPI021', location: 'תל אביב', type: 'Robot',      entranceType: 'Room',          developer: 'DY',      handler: '', spots: '22', percentage: '90',  price: '', advance: '', updateDate: '2026-06-30', statusNote: 'חוזה / לחתמנו' },
  { id: 'upi856', name: 'בלוך 9',                  status: 'quotes', code: 'UPI856', location: '',         type: 'Robot',      entranceType: 'Horizontal',    developer: 'DY',      handler: '', spots: '20', percentage: '90',  price: '', advance: '', updateDate: '2026-02-16', statusNote: 'חוזה / לחתמנו' },
  { id: 'upi147', name: 'הירקון 28, תל אביב',      status: 'quotes', code: 'UPI147', location: 'תל אביב', type: 'Parkmatrix', entranceType: 'Vertical cab.', developer: 'Parkday', handler: '', spots: '12', percentage: '50',  price: '', advance: '', updateDate: '2026-03-29', statusNote: '' },
  { id: 'upi136', name: 'הראה 136, רמת גן',        status: 'quotes', code: 'UPI136', location: 'רמת גן',  type: 'Parkmatrix', entranceType: 'Vertical cab.', developer: 'Parkday', handler: '', spots: '26', percentage: '90',  price: '', advance: '', updateDate: '2026-03-09', statusNote: 'עבודות על חשבון' },
  { id: 'upi078', name: 'הרב עמיאל 24-26, תל אביב', status: 'quotes', code: 'UPI078', location: 'תל אביב', type: 'Parkmatrix', entranceType: 'Vertical cab.', developer: 'Parkday', handler: '', spots: '6',  percentage: '60',  price: '', advance: '', updateDate: '2026-02-10', statusNote: 'חתמנו' },
  { id: 'upi187', name: 'יהל 5, תל אביב',          status: 'quotes', code: 'UPI187', location: 'תל אביב', type: 'Parkmatrix', entranceType: 'Vertical cab.', developer: 'Parkday', handler: '', spots: '14', percentage: '60',  price: '', advance: '', updateDate: '2026-03-09', statusNote: '' },
  { id: 'upi207', name: 'גורלו 11, תל אביב',       status: 'quotes', code: 'UPI207', location: 'תל אביב', type: 'Parkmatrix', entranceType: 'Vertical cab.', developer: 'Parkday', handler: '', spots: '10', percentage: '100', price: '', advance: '', updateDate: '2026-03-09', statusNote: '' },
  { id: 'pnkas-24',       name: 'פנקס 24',               status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
  { id: 'nahariya',       name: 'נהריה',                 status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
  { id: 'ein-hakore',     name: 'עין הקורא',             status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
  { id: 'congress',       name: 'הקונגרס',               status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
  { id: 'hirschfeld',     name: 'הירשפילד',              status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
  { id: 'sokolov-zinger', name: 'סוקולוב — יהודה זינגר', status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
  { id: 'vermiza',        name: 'ורמיזה',                status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
  { id: 'bney-binyamin',  name: 'בני בנימין',            status: 'in-progress', developer: '', price: '', advance: '', updateDate: '', statusNote: '' },
]

const toNum = (v) => parseFloat(String(v || '').replace(/,/g, '')) || 0
const fmtAmount = (v) => { const n = toNum(v); if (!v || !n) return v || ''; return n.toLocaleString('he-IL') }
const fmtDate = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y.slice(2)}` }
const fmtAmountLabel = (value, currency = '₪') => { const n = toNum(value); return n ? `${n.toLocaleString('he-IL')} ${currency}` : '—' }
const parseJson = (value) => { try { return JSON.parse(value) } catch { return null } }

const loadProjectListFromStorage = () => {
  const keys = ['parking-projects-v3', 'parking-projects-v2', 'parking-projects']
  for (const key of keys) {
    try {
      const s = localStorage.getItem(key)
      if (!s) continue
      const parsed = parseJson(s)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
      if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) return parsed.projects
    } catch {}
  }
  return null
}

const loadProjectDetails = (projectId) => {
  try { const s = localStorage.getItem(`parking-project-${projectId}`); if (s) return parseJson(s) || {} } catch {}
  return {}
}

const mergeProjectWithDetails = (project) => {
  const details = loadProjectDetails(project.id)
  const initial = INITIAL_PROJECTS.find(p => p.id === project.id)
  return {
    ...project,
    name: project.name || details.name || details.client || project.id,
    status: project.status || details.status || 'in-progress',
    developer: project.developer || details.developer || '',
    handler: project.handler || details.handler || '',
    price: details.cli_contract || details.mfr_contract || project.price || '',
    advance: details.cli_paid || details.mfr_paid || project.advance || '',
    updateDate: project.updateDate || details.updateDate || '',
    statusNote: project.statusNote || details.notes || '',
    manufacturer: project.manufacturer || details.manufacturer || '',
    client: project.client || details.client || '',
    guarantees: details.guarantees || project.guarantees || '',
    guarantees_end: details.guarantees_end || project.guarantees_end || '',
    deposits: details.deposits || project.deposits || '',
    deposits_station: details.deposits_station || project.deposits_station || '',
    mfr_contract: details.mfr_contract || project.mfr_contract || '',
    mfr_paid: details.mfr_paid || project.mfr_paid || '',
    cli_contract: details.cli_contract || project.cli_contract || '',
    cli_paid: details.cli_paid || project.cli_paid || '',
    mfr_currency: details.mfr_currency || project.mfr_currency || '€',
    cli_currency: details.cli_currency || project.cli_currency || '₪',
    code:        project.code        ?? initial?.code        ?? '',
    location:    project.location    ?? initial?.location    ?? '',
    type:        project.type        ?? initial?.type        ?? '',
    entranceType: project.entranceType ?? initial?.entranceType ?? '',
    company:     project.company     ?? initial?.company     ?? '',
    spots:       project.spots       ?? initial?.spots       ?? '',
    percentage:  project.percentage  ?? initial?.percentage  ?? '',
  }
}

const recoverProjectsFromDetails = () => {
  try {
    const recovered = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key?.startsWith('parking-project-')) continue
      const id = key.slice('parking-project-'.length)
      if (!id || recovered.some(p => p.id === id)) continue
      try {
        const detail = parseJson(localStorage.getItem(key) || '{}') || {}
        recovered.push({ id, name: detail.name || detail.client || id, status: detail.status || 'in-progress', developer: detail.developer || '', handler: detail.handler || '', price: detail.cli_contract || detail.mfr_contract || '', advance: detail.cli_paid || detail.mfr_paid || '', updateDate: detail.updateDate || '', statusNote: detail.notes || '' })
      } catch {}
    }
    return recovered
  } catch { return [] }
}

const load = () => {
  const stored = loadProjectListFromStorage()
  const quotesInitial = INITIAL_PROJECTS.filter(p => p.status === 'quotes')
  if (stored && stored.length > 0) {
    const storedInProgress = stored.filter(p => p.status === 'in-progress').map(mergeProjectWithDetails)
    const storedIds = new Set(storedInProgress.map(p => p.id))
    const newInProgress = INITIAL_PROJECTS.filter(p => p.status === 'in-progress' && !storedIds.has(p.id))
    // Use stored quotes only if they are already the new UPI format
    const storedQuotes = stored.filter(p => p.status === 'quotes')
    const quotes = storedQuotes.some(p => p.id.startsWith('upi'))
      ? storedQuotes.map(mergeProjectWithDetails)
      : quotesInitial
    return [...storedInProgress, ...newInProgress, ...quotes]
  }
  const fromDetails = recoverProjectsFromDetails()
  return fromDetails.length > 0 ? fromDetails : INITIAL_PROJECTS
}

const MONTH_HE   = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳']
const GANTT_CLR  = { signed:'#475569', advance:'#0369a1', ordered:'#4338ca', arrived:'#b45309', install:'#0f766e', done:'#15803d' }

function GanttChart({ projects }) {
  const MONTH_W  = 88
  const ROW_H    = 46
  const NAME_W   = 148
  const HDR_H    = 42

  const rows = projects.map(p => {
    let milestones = [], cardStatus = p.cardStatus || 'advance'
    try {
      const raw = localStorage.getItem(`parking-project-${p.id}`)
      if (raw) { const d = JSON.parse(raw); milestones = (d.milestones || []).filter(m => m.date); if (d.cardStatus) cardStatus = d.cardStatus }
    } catch {}
    return { id: p.id, name: p.name, milestones, cardStatus }
  }).filter(r => r.milestones.length > 0)

  if (rows.length === 0)
    return <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', direction: 'rtl' }}>אין אבני דרך עם תאריכים — פתח פרויקט והוסף תאריכים.</div>

  const allTs = rows.flatMap(r => r.milestones.map(m => new Date(m.date).getTime()))
  const minD  = new Date(Math.min(...allTs)); minD.setDate(1); minD.setMonth(minD.getMonth() - 1)
  const maxD  = new Date(Math.max(...allTs)); maxD.setDate(1); maxD.setMonth(maxD.getMonth() + 2)

  const months = []
  const cur = new Date(minD)
  while (cur < maxD) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1) }

  const totalW  = months.length * MONTH_W
  const svgH    = HDR_H + rows.length * ROW_H + 4
  const toX     = (ds) => ((new Date(ds).getTime() - minD.getTime()) / (maxD.getTime() - minD.getTime())) * totalW
  const todayX  = toX(new Date().toISOString().slice(0, 10))

  return (
    <div style={{ overflowX: 'auto', direction: 'ltr' }}>
      <div style={{ display: 'flex', minWidth: NAME_W + totalW + 'px' }}>

        {/* שמות פרויקטים */}
        <div style={{ width: NAME_W, flexShrink: 0, borderLeft: '1px solid #e2e8f0' }}>
          <div style={{ height: HDR_H, background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }} />
          {rows.map((r, i) => (
            <div key={r.id} style={{ height: ROW_H, display: 'flex', alignItems: 'center', paddingRight: '12px', paddingLeft: '8px', background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f1f5f9', direction: 'rtl' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{r.name}</span>
            </div>
          ))}
        </div>

        {/* SVG ציר זמן */}
        <svg width={totalW} height={svgH} style={{ flexShrink: 0, display: 'block' }}>
          {/* רקע חודשים + כותרות */}
          {months.map((m, i) => {
            const x = i * MONTH_W
            const showYear = i === 0 || m.getMonth() === 0
            return (
              <g key={i}>
                <rect x={x} y={0} width={MONTH_W} height={svgH} fill={i % 2 === 0 ? '#fafafa' : '#fff'} stroke="#e8ecf0" strokeWidth="0.5" />
                {showYear && <text x={x + 4} y={16} fontSize="9" fill="#94a3b8" fontFamily="Arial,sans-serif">{m.getFullYear()}</text>}
                <text x={x + MONTH_W / 2} y={HDR_H - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569" fontFamily="Arial,sans-serif">
                  {MONTH_HE[m.getMonth()]}
                </text>
              </g>
            )
          })}
          <line x1={0} y1={HDR_H} x2={totalW} y2={HDR_H} stroke="#e2e8f0" strokeWidth="2" />

          {/* שורות פרויקטים */}
          {rows.map((r, i) => {
            const y    = HDR_H + i * ROW_H
            const clr  = GANTT_CLR[r.cardStatus] || '#94a3b8'
            const xs   = r.milestones.map(m => toX(m.date))
            const x1   = Math.min(...xs), x2 = Math.max(...xs)
            const doneXs = r.milestones.filter(m => m.done).map(m => toX(m.date))
            const dx1  = doneXs.length ? Math.min(...doneXs) : null
            const dx2  = doneXs.length ? Math.max(...doneXs) : null
            const cy   = y + ROW_H / 2

            return (
              <g key={r.id}>
                <line x1={0} y1={y + ROW_H} x2={totalW} y2={y + ROW_H} stroke="#f1f5f9" strokeWidth="1" />

                {/* בר רקע */}
                {x2 > x1 && <rect x={x1} y={cy - 5} width={x2 - x1} height={10} rx={5} fill={clr + '25'} stroke={clr + '60'} strokeWidth="1" />}

                {/* בר התקדמות (milestones שהושלמו) */}
                {dx1 !== null && dx2 !== null && dx2 > dx1 &&
                  <rect x={dx1} y={cy - 5} width={dx2 - dx1} height={10} rx={5} fill={clr} opacity={0.85} />}

                {/* מרקרי אבני דרך */}
                {r.milestones.map((m, mi) => {
                  const mx = toX(m.date)
                  return (
                    <g key={mi}>
                      <circle cx={mx} cy={cy} r={7} fill={m.done ? clr : '#fff'} stroke={clr} strokeWidth={2} />
                      {m.done
                        ? <text x={mx} y={cy + 3.5} textAnchor="middle" fontSize="8" fill="#fff" fontFamily="Arial" fontWeight="bold">✓</text>
                        : <circle cx={mx} cy={cy} r={2.5} fill={clr} />}
                      <title>{m.name}{m.date ? ' · ' + m.date.split('-').reverse().join('/') : ''}</title>
                    </g>
                  )
                })}
              </g>
            )
          })}

          {/* קו היום */}
          {todayX >= 0 && todayX <= totalW && (
            <g>
              <line x1={todayX} y1={HDR_H} x2={todayX} y2={svgH} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" opacity={0.75} />
              <rect x={todayX - 18} y={HDR_H - 14} width={36} height={14} rx={4} fill="#ef4444" opacity={0.9} />
              <text x={todayX} y={HDR_H - 4} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="Arial" fontWeight="bold">היום</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

export default function ParkingProjectsEmbed({ tab }) {
  const [projects, setProjects] = useState(load)
  const [dashboardSection, setDashboardSection] = useState('')
  const [showGantt, setShowGantt] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.setItem('parking-projects-v3', JSON.stringify(projects))
  }, [projects])

  const update = (id, field, value) =>
    setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))

  const deleteProject = (id, name) => {
    if (window.confirm(`למחוק את הפרויקט "${name}"?`)) {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
  }

  const addRow = () => {
    setProjects(prev => [...prev, {
      id: 'proj-' + Date.now(), name: 'פרויקט חדש', status: tab,
      developer: '', handler: '', price: '', advance: '', updateDate: '', statusNote: '',
    }])
  }

  const resetProjects = () => {
    if (!window.confirm('האם לשחזר את כל פרויקטי ברירת המחדל?')) return
    setProjects(INITIAL_PROJECTS)
    localStorage.setItem('parking-projects-v3', JSON.stringify(INITIAL_PROJECTS))
  }

  const visible = projects.filter(p => p.status === tab)
  const cardInput = { border: 'none', background: 'transparent', fontFamily: 'inherit', outline: 'none', width: '100%', direction: 'rtl', padding: 0 }

  const ORDERED_AND_BEYOND = new Set(['ordered', 'arrived', 'install', 'done'])
  const getCardStatus = (p) => {
    if (p.cardStatus) return p.cardStatus
    try {
      const s = localStorage.getItem(`parking-project-${p.id}`)
      if (s) return (JSON.parse(s).cardStatus) || ''
    } catch {}
    return ''
  }
  const orderedProjects = visible.filter(p => ORDERED_AND_BEYOND.has(getCardStatus(p)))

  const parkingLoansTotal = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('cashflow-loan-balances') || '{}')
      return (raw['חניה אורבנית'] || []).reduce((s, l) => s + (toNum(l.amount) || 0), 0)
    } catch { return 0 }
  })()

  const suppliersByCur = {}
  let suppliersILS = 0
  orderedProjects.forEach(p => {
    const cur = p.mfr_currency || '€'
    const unpaid = Math.max(0, toNum(p.mfr_contract) - toNum(p.mfr_paid))
    if (unpaid > 0) suppliersByCur[cur] = (suppliersByCur[cur] || 0) + unpaid
    const rate = (() => { try { const d = JSON.parse(localStorage.getItem(`parking-project-${p.id}`) || '{}'); return toNum(d.mfr_rate) } catch { return 0 } })()
    if (rate > 0 && unpaid > 0) suppliersILS += unpaid * rate
  })
  const clientsByCur = {}
  orderedProjects.forEach(p => {
    const cur = p.cli_currency || '₪'
    const unpaid = Math.max(0, toNum(p.cli_contract) - toNum(p.cli_paid))
    if (unpaid > 0) clientsByCur[cur] = (clientsByCur[cur] || 0) + unpaid
  })

  const handlePrintAll = () => {
    const DETAIL_FIELDS = [
      { key: 'location', label: 'מיקום' },
      { key: 'client',   label: 'לקוח / גוף מזמין' },
      { key: 'spots',    label: 'מספר מקומות חניה' },
      { key: 'manufacturer', label: 'שם יצרן' },
    ]
    const fmtD = (d) => d ? d.split('-').reverse().join('/') : '—'
    const tn   = (v) => parseFloat(String(v || '').replace(/,/g, '')) || 0
    const fmtA = (v) => { const n = tn(v); return n ? n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '' }
    const remColor = (v) => v < 0 ? '#dc2626' : '#d97706'
    const remBg    = (v) => v < 0 ? '#fee2e2' : '#fef3c7'
    const card = (label, value, color, bg) =>
      `<div style="border:1px solid #e2e8f0;border-top:3px solid ${color};border-radius:8px;padding:12px;background:${bg};">
        <div style="font-size:10px;color:#64748b;margin-bottom:4px;">${label}</div>
        <div style="font-size:17px;font-weight:bold;color:${color};direction:ltr;text-align:right;">${value || '—'}</div>
      </div>`
    const inProgress = projects.filter(p => p.status === 'in-progress')
    const pages = inProgress.map((p, idx) => {
      let d = {}
      try { const raw = localStorage.getItem(`parking-project-${p.id}`); if (raw) d = JSON.parse(raw) } catch {}
      const ps = PROJECT_STATUSES.find(s => s.id === (p.cardStatus || 'advance')) || PROJECT_STATUSES[0]
      const mfrCur = d.mfr_currency || '€'
      const mfrC = tn(d.mfr_contract), mfrPd = tn(d.mfr_paid)
      const cliC = tn(d.cli_contract), cliPd = tn(d.cli_paid)
      const mfrRem = mfrC - mfrPd, cliRem = cliC - cliPd
      const msRows = (d.milestones || []).map(m => `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:16px;color:${m.done ? '#16a34a' : '#d1d5db'};">${m.done ? '✓' : '○'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;color:${m.done ? '#9ca3af' : '#1e3a5f'};text-decoration:${m.done ? 'line-through' : 'none'};">${m.name || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">${fmtD(m.date)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;direction:ltr;text-align:right;font-weight:bold;">${m.amount || '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${m.note || ''}</td>
      </tr>`).join('')
      const isLast = idx === inProgress.length - 1
      let cfSection = ''
      if ((d.cashflow || []).length > 0) {
        const cfTotal = (d.cashflow || []).reduce((s, r) => s + (parseFloat(String(r.amount || '').replace(/,/g, '')) || 0), 0)
        const cfAmtColor = (v) => parseFloat(String(v).replace(/,/g, '')) < 0 ? '#dc2626' : '#15803d'
        const cfToN = (v) => parseFloat(String(v || '').replace(/,/g, '')) || 0
        let cfRunning = 0
        const cfRows = (d.cashflow || []).map((r, ridx) => {
          cfRunning += cfToN(r.amount)
          const cumColor = cfRunning < 0 ? '#dc2626' : '#0369a1'
          const cumStr = (cfRunning < 0 ? '-' : '') + Math.abs(cfRunning).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          return `<tr style="background:${ridx % 2 === 0 ? '#fff' : '#f8fafc'};">
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e3a5f;font-size:14px;">${r.details || ''}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:center;color:#374151;font-size:14px;">${fmtD(r.date)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;direction:ltr;text-align:right;font-weight:bold;color:${cfAmtColor(r.amount)};font-size:14px;">${r.amount || '—'}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;direction:ltr;text-align:right;font-weight:bold;color:${cumColor};font-size:14px;">${cumStr}</td>
          </tr>`
        }).join('')
        const cfTotalColor = cfTotal < 0 ? '#dc2626' : '#15803d'
        const cfTotalBg = cfTotal < 0 ? '#fef2f2' : '#f0fdf4'
        const cfTotalBorder = cfTotal < 0 ? '#dc2626' : '#16a34a'
        const cfAbsTotal = Math.abs(cfTotal).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        cfSection = `<div class="sec">💵 תזרים מזומנים צפוי</div>
          <table><thead><tr><th>פרטים</th><th style="width:120px;text-align:center;">תאריך</th><th style="width:120px;direction:ltr;text-align:right;">סכום ₪</th><th style="width:130px;direction:ltr;text-align:right;">מצטבר ₪</th></tr></thead>
          <tbody>${cfRows}</tbody>
          <tfoot><tr style="background:${cfTotalBg};border-top:2px solid ${cfTotalBorder};"><td colspan="2" style="padding:8px 10px;font-weight:700;color:${cfTotalColor};">סה"כ</td><td style="padding:8px 10px;font-weight:800;color:${cfTotalColor};direction:ltr;text-align:right;">${cfTotal < 0 ? '-' : ''}${cfAbsTotal}</td><td></td></tr></tfoot></table>`
      }
      return `<div style="${isLast ? '' : 'page-break-after:always;'}padding:28px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
          <h1 style="font-size:22px;font-weight:800;color:#1e3a5f;margin:0;">🅿️ ${p.name}</h1>
          <span style="font-size:12px;font-weight:700;color:${ps.color};background:${ps.bg};border:1px solid ${ps.border};padding:3px 10px;border-radius:12px;">${ps.label}</span>
        </div>
        <div style="font-size:12px;color:#64748b;margin-bottom:22px;">הודפס: ${new Date().toLocaleDateString('he-IL')}</div>
        <div class="sec">📋 פרטים כלליים</div>
        <div class="details">${DETAIL_FIELDS.map(f => `<div class="dl"><div class="dl-label">${f.label}</div><div class="dl-val">${d[f.key] || '—'}</div></div>`).join('')}</div>
        <div class="sec">💰 מצב חשבון מול היצרן (${mfrCur})</div>
        <div class="grid3">${card(`סכום חוזה ${mfrCur}`, d.mfr_contract, '#1e3a5f', '#dbeafe')}${card(`סכום ששולם ${mfrCur}`, d.mfr_paid, '#16a34a', '#dcfce7')}${card(`סכום שטרם שולם ${mfrCur}`, mfrC||mfrPd ? fmtA(String(Math.abs(mfrRem))) : '', remColor(mfrRem), remBg(mfrRem))}</div>
        <div class="sec">💰 מצב חשבון מול הלקוח ₪ — ללא מע"מ</div>
        <div class="grid3">${card('סכום חוזה ₪', d.cli_contract, '#1e3a5f', '#dbeafe')}${card('סכום ששולם ₪', d.cli_paid, '#16a34a', '#dcfce7')}${card('סכום שטרם שולם ₪', cliC||cliPd ? fmtA(String(Math.abs(cliRem))) : '', remColor(cliRem), remBg(cliRem))}</div>
        ${(d.milestones || []).length > 0 ? `<div class="sec">🏁 אבני דרך</div><table><thead><tr><th style="width:36px;"></th><th>אבן דרך</th><th style="width:90px;text-align:center;">תאריך</th><th style="width:100px;direction:ltr;text-align:right;">סכום</th><th>הערה</th></tr></thead><tbody>${msRows}</tbody></table>` : ''}
        ${cfSection}
        ${d.notes ? `<div class="sec">📝 הערות</div><div class="notes">${d.notes}</div>` : ''}
      </div>`
    }).join('')
    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>פרויקטים בביצוע — חניה</title>
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;background:#fff;direction:rtl;}
      .sec{font-size:13px;font-weight:700;color:#1e3a5f;margin:18px 0 10px;display:flex;align-items:center;gap:8px;break-after:avoid;}
      .sec::before{content:'';display:inline-block;width:4px;height:18px;background:#1e3a5f;border-radius:2px;}
      .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;}
      .details{display:flex;gap:28px;margin-bottom:16px;flex-wrap:wrap;}
      .dl-label{font-size:10px;color:#9ca3af;} .dl-val{font-size:14px;font-weight:600;color:#1e3a5f;}
      table{width:100%;border-collapse:collapse;} th{background:#1e3a5f;color:#fff;padding:8px 10px;font-size:12px;}
      .notes{border:1px solid #e5e7eb;border-radius:8px;padding:12px;line-height:1.7;white-space:pre-wrap;font-size:13px;margin-top:8px;}
      @media print{@page{margin:1.5cm;}}</style></head><body>${pages}</body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    w.document.write(html); w.document.close(); w.focus()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ─── מו"מ ─── */}
      {tab === 'quotes' && (() => {
        const totalPipeline  = visible.reduce((s, p) => s + toNum(p.price), 0)
        const totalAdvances  = visible.reduce((s, p) => s + toNum(p.advance), 0)
        const withAdvance    = visible.filter(p => toNum(p.advance) > 0).length
        const totalSpots     = visible.reduce((s, p) => s + (parseInt(p.spots) || 0), 0)
        const COLS           = '1.6fr 0.5fr 0.55fr 0.4fr 0.9fr 0.65fr 1.5fr 22px'
        const now            = Date.now()
        const msPerDay       = 86400 * 1000

        const TYPE_STYLE = {
          'Parkmatrix':  { bg: '#dcfce7', color: '#15803d' },
          'Robot':       { bg: '#fee2e2', color: '#dc2626' },
          'Permitmatic': { bg: '#dcfce7', color: '#15803d' },
          'Sales':       { bg: '#dbeafe', color: '#1d4ed8' },
          'Room':        { bg: '#ede9fe', color: '#7c3aed' },
        }

        const printQuotes = () => {
          const totalPr = visible.reduce((s, p) => s + toNum(p.price), 0)
          const totalAd = visible.reduce((s, p) => s + toNum(p.advance), 0)
          const totSp   = visible.reduce((s, p) => s + (parseInt(p.spots) || 0), 0)
          const typeClr = { Parkmatrix: '#15803d', Robot: '#dc2626', Permitmatic: '#15803d', Sales: '#1d4ed8', Room: '#7c3aed' }
          const rows = visible.map((p, i) => {
            return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'};">
              <td style="padding:9px 10px;border-bottom:1px solid #e5e7eb;">
                <div style="font-weight:700;color:#1e3a5f;font-size:13px;">${p.name}</div>
                ${p.code || p.location ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px;">${[p.code, p.location].filter(Boolean).join(' · ')}</div>` : ''}
              </td>
              <td style="padding:9px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${p.developer || '—'}</td>
              <td style="padding:9px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;">${p.spots || '—'}</td>
              <td style="padding:9px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;color:#7c3aed;">${p.percentage ? p.percentage + '%' : '—'}</td>
              <td style="padding:9px 10px;border-bottom:1px solid #e5e7eb;direction:ltr;text-align:right;color:#15803d;font-weight:700;">${p.price || '—'}</td>
              <td style="padding:9px 10px;border-bottom:1px solid #e5e7eb;text-align:center;white-space:nowrap;">${p.updateDate ? fmtDate(p.updateDate) : '—'}</td>
              <td style="padding:9px 10px;border-bottom:1px solid #e5e7eb;color:#78350f;">${p.statusNote || ''}</td>
            </tr>`
          }).join('')
          const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>מו"מ — פרויקטי חניה</title>
            <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:28px;direction:rtl;}
            h1{font-size:20px;font-weight:800;color:#1e3a5f;margin-bottom:4px;}.sub{font-size:12px;color:#64748b;margin-bottom:16px;}
            .kpi{display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;}.kpi-box{border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;min-width:140px;}
            .kpi-label{font-size:10px;color:#94a3b8;font-weight:600;margin-bottom:4px;}.kpi-val{font-size:18px;font-weight:800;}
            table{width:100%;border-collapse:collapse;}th{background:#1e3a5f;color:#fff;padding:10px;font-size:11px;text-align:right;}
            tfoot td{background:#f8fafc;font-weight:700;border-top:2px solid #e2e8f0;padding:9px 10px;}
            @media print{@page{margin:1.5cm;}}</style></head><body>
            <h1>פרויקטים במשא ומתן — חניה</h1>
            <div class="sub">הודפס: ${new Date().toLocaleDateString('he-IL')} · ${visible.length} פרויקטים</div>
            <div class="kpi">
              <div class="kpi-box"><div class="kpi-label">שווי פייפליין</div><div class="kpi-val" style="color:#1e3a5f;direction:ltr;text-align:right;">${totalPr > 0 ? totalPr.toLocaleString('he-IL') + ' ₪' : '—'}</div></div>
              <div class="kpi-box"><div class="kpi-label">סה"כ מקומות</div><div class="kpi-val" style="color:#7c3aed;">${totSp}</div></div>
            </div>
            <table><thead><tr><th>פרויקט</th><th>יזם</th><th style="text-align:center;">מקומות חניה</th><th style="text-align:center;">%</th><th style="direction:ltr;text-align:right;">מחיר ₪</th>
            <th style="text-align:center;">עדכון</th><th>סטטוס / הערה</th></tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr><td colspan="2">סה"כ</td>
              <td style="text-align:center;">${totSp}</td>
              <td></td>
              <td style="direction:ltr;text-align:right;color:#15803d;">${totalPr > 0 ? totalPr.toLocaleString('he-IL') + ' ₪' : '—'}</td>
              <td colspan="2"></td></tr></tfoot>
            </table></body></html>`
          const w = window.open('', '_blank', 'width=1000,height=720')
          w.document.write(html); w.document.close(); w.focus()
          setTimeout(() => { w.print(); w.close() }, 450)
        }

        return (
          <>
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>{visible.length} פרויקטים</span>
              <button onClick={printQuotes} style={{ padding: '5px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>
                🖨️ הדפס PDF
              </button>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: '0 10px', padding: '10px 18px', background: '#1e3a5f', borderRadius: '10px 10px 0 0', direction: 'rtl' }}>
              {['פרויקט', 'יזם', 'מקומות חניה', '%', 'מחיר ₪', 'עדכון', 'סטטוס / הערה', ''].map(h => (
                <div key={h} style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '700', letterSpacing: '0.04em' }}>{h}</div>
              ))}
            </div>

            {/* Rows */}
            <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
              {visible.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>אין פרויקטים בסטטוס זה</div>
              )}
              {visible.map((p, idx) => {
                const hasAdvance = toNum(p.advance) > 0
                const daysSince  = p.updateDate ? Math.round((now - new Date(p.updateDate).getTime()) / msPerDay) : null
                const isStale    = daysSince !== null && daysSince > 14
                const rowBg      = idx % 2 === 0 ? '#fff' : '#f9fafb'
                const accentClr  = hasAdvance ? '#16a34a' : '#e2e8f0'
                const typeStyle  = TYPE_STYLE[p.type] || { bg: '#f1f5f9', color: '#64748b' }
                return (
                  <div key={p.id}
                    style={{ display: 'grid', gridTemplateColumns: COLS, gap: '0 10px', alignItems: 'center', background: rowBg, borderBottom: '1px solid #f1f5f9', padding: '10px 18px', direction: 'rtl', borderRight: `3px solid ${accentClr}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    {/* שם פרויקט + קוד + מיקום */}
                    <div>
                      <input value={p.name} onChange={e => update(p.id, 'name', e.target.value)}
                        style={{ ...cardInput, fontSize: '14px', fontWeight: '700', color: '#1e3a5f', width: '100%' }} />
                      {(p.code || p.location) && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', display: 'flex', gap: '6px' }}>
                          {p.code && <span>{p.code}</span>}
                          {p.code && p.location && <span>·</span>}
                          {p.location && <span>{p.location}</span>}
                        </div>
                      )}
                    </div>

                    {/* יזם */}
                    <input value={p.developer} onChange={e => update(p.id, 'developer', e.target.value)}
                      placeholder="—" style={{ ...cardInput, fontSize: '12px', color: '#6b7280' }} />

                    {/* מקומות חניה */}
                    <input value={p.spots || ''} onChange={e => update(p.id, 'spots', e.target.value)}
                      placeholder="—" type="number" min="0"
                      style={{ ...cardInput, fontSize: '13px', fontWeight: '700', color: '#374151', textAlign: 'center', width: '100%' }} />

                    {/* % */}
                    <input value={p.percentage || ''} onChange={e => update(p.id, 'percentage', e.target.value)}
                      placeholder="%" type="number" min="0" max="100"
                      style={{ ...cardInput, fontSize: '12px', fontWeight: '700', color: '#7c3aed', textAlign: 'center', width: '100%' }} />

                    {/* מחיר */}
                    <input value={p.price} onChange={e => update(p.id, 'price', e.target.value)}
                      onBlur={e => update(p.id, 'price', fmtAmount(e.target.value))} placeholder="—"
                      style={{ ...cardInput, fontSize: '13px', fontWeight: '700', color: '#15803d', textAlign: 'right', direction: 'ltr' }} />

                    {/* תאריך עדכון */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {p.updateDate
                        ? <span style={{ fontSize: '11px', background: isStale ? '#fef3c7' : '#e0f2fe', color: isStale ? '#92400e' : '#0369a1', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                            {fmtDate(p.updateDate)}
                          </span>
                        : <span style={{ fontSize: '12px', color: '#d1d5db' }}>—</span>}
                      <input type="date" value={p.updateDate} onChange={e => update(p.id, 'updateDate', e.target.value)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '18px', padding: 0, opacity: 0.3 }} title="בחר תאריך" />
                    </div>

                    {/* הערה / סטטוס */}
                    <div style={{ background: p.statusNote ? '#fefce8' : 'transparent', borderRadius: '6px', padding: p.statusNote ? '2px 6px' : '0' }}>
                      <input value={p.statusNote} onChange={e => update(p.id, 'statusNote', e.target.value)}
                        placeholder="הערה / סטטוס..."
                        style={{ ...cardInput, fontSize: '12px', color: '#78350f' }} />
                    </div>

                    {/* מחק */}
                    <button onClick={() => deleteProject(p.id, p.name)} title="מחק"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '13px', padding: 0, lineHeight: 1, alignSelf: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>✕</button>
                  </div>
                )
              })}

              {/* Summary footer */}
              {visible.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: '0 10px', padding: '10px 18px', background: '#f8fafc', borderTop: '2px solid #e2e8f0', direction: 'rtl' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>סה"כ</div>
                  <div /><div /><div />
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', textAlign: 'center' }}>{totalSpots}</div>
                  <div />
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#15803d', direction: 'ltr', textAlign: 'right' }}>
                    {totalPipeline > 0 ? `${totalPipeline.toLocaleString('he-IL')} ₪` : '—'}
                  </div>
                  <div /><div /><div />
                </div>
              )}
            </div>
          </>
        )
      })()}

      {/* ─── בביצוע ─── */}
      {tab === 'in-progress' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{visible.length} פרויקטים</span>
            <button onClick={handlePrintAll} style={{ padding: '5px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}>
              🖨️ הדפס כל הפרויקטים PDF
            </button>
          </div>

          {(() => {
            const totalDepositsNum   = visible.reduce((s, p) => s + toNum(p.deposits), 0)
            const totalGuaranteesNum = visible.reduce((s, p) => s + toNum(p.guarantees), 0)
            const clientsILS         = Object.values(clientsByCur).reduce((s, v) => s + v, 0)
            const totalAssets        = totalDepositsNum + clientsILS
            const totalLiabilities   = Math.round(suppliersILS) + parkingLoansTotal
            const net                = totalAssets - totalLiabilities
            const netPos             = net >= 0

            const GRN = '#0f766e'
            const RED = '#b91c1c'

            const col = (id, label, note, valueNode, color) => (
              <button type="button"
                onClick={() => id && setDashboardSection(dashboardSection === id ? '' : id)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1px', padding: '7px 12px', border: 'none', borderBottom: '1px solid #f1f5f9', background: dashboardSection === id ? `${color}10` : 'transparent', cursor: id ? 'pointer' : 'default', fontFamily: 'inherit', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>{label}</span>
                  {note && <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '700' }}>{note}</span>}
                </div>
                <div style={{ direction: 'ltr', textAlign: 'right' }}>{valueNode}</div>
              </button>
            )

            const amt = (v, color) => <span style={{ fontSize: '18px', fontWeight: '700', color, direction: 'ltr' }}>{v > 0 ? v.toLocaleString('he-IL') + ' ₪' : <span style={{ color: '#d1d5db', fontWeight: '400' }}>—</span>}</span>

            return (
              <>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>

                  {/* Header */}
                  <div style={{ padding: '9px 14px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e3a5f' }}>מצב כספי — חניה אורבנית</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{visible.length} פרויקטים</span>
                  </div>

                  {/* Two columns — flat grid so total row stays aligned */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

                    {/* Row 1 */}
                    <div style={{ borderLeft: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                      {col('deposits', 'פקדונות',
                        totalGuaranteesNum > 0 ? `ערבויות: ${totalGuaranteesNum.toLocaleString('he-IL')} ₪` : null,
                        amt(totalDepositsNum, GRN), GRN)}
                    </div>
                    <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {col('suppliers', 'חוב ליצרן', null,
                        <div style={{ direction: 'ltr', textAlign: 'right' }}>
                          {suppliersILS > 0
                            ? <span style={{ fontSize: '20px', fontWeight: '700', color: RED }}>{Math.round(suppliersILS).toLocaleString('he-IL')} ₪</span>
                            : <span style={{ fontSize: '20px', color: '#d1d5db' }}>—</span>}
                        </div>, RED)}
                    </div>

                    {/* Row 2 */}
                    <div style={{ borderLeft: '1px solid #f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                      {col('clients', 'חייבים מלקוחות', null,
                        Object.entries(clientsByCur).length > 0
                          ? Object.entries(clientsByCur).map(([cur, a]) => <div key={cur} style={{ fontSize: '18px', fontWeight: '700', color: GRN, direction: 'ltr' }}>{a.toLocaleString('he-IL')} {cur}</div>)
                          : amt(0, GRN),
                        GRN)}
                    </div>
                    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {col('loans', 'הלוואות', null, amt(parkingLoansTotal, RED), RED)}
                    </div>

                    {/* Row 3 — totals, same grid row = same height */}
                    <div style={{ padding: '6px 12px', background: '#f9fafb', borderLeft: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '1px' }}>סה"כ</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#374151', direction: 'ltr' }}>{totalAssets.toLocaleString('he-IL')} ₪</div>
                    </div>
                    <div style={{ padding: '6px 12px', background: '#f9fafb' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '1px' }}>סה"כ</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#374151', direction: 'ltr' }}>{totalLiabilities.toLocaleString('he-IL')} ₪</div>
                    </div>
                  </div>

                  {/* Net */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px', background: netPos ? '#f8fffe' : '#fff8f8', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>יתרה נטו</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: netPos ? GRN : RED, direction: 'ltr' }}>
                      {netPos ? '+' : ''}{net.toLocaleString('he-IL')} ₪
                    </span>
                  </div>
                </div>

                {/* Detail panel */}
                {dashboardSection && (
                  <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                        {dashboardSection === 'deposits'  && 'פירוט פקדונות'}
                        {dashboardSection === 'suppliers' && 'פירוט חוב ליצרן'}
                        {dashboardSection === 'clients'   && 'פירוט חייבים מלקוחות'}
                        {dashboardSection === 'loans'     && 'פירוט הלוואות — חניה אורבנית'}
                      </span>
                      <button type="button" onClick={() => setDashboardSection('')} style={{ border: 'none', background: '#f1f5f9', color: '#64748b', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>סגור</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {dashboardSection === 'deposits' && visible.filter(p => toNum(p.deposits) > 0).map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', direction: 'ltr' }}>{fmtAmountLabel(p.deposits)}</span>
                        </div>
                      ))}
                      {dashboardSection === 'suppliers' && orderedProjects.filter(p => Math.max(0, toNum(p.mfr_contract) - toNum(p.mfr_paid)) > 0).map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', direction: 'ltr' }}>{fmtAmountLabel(toNum(p.mfr_contract) - toNum(p.mfr_paid), p.mfr_currency || '€')}</span>
                        </div>
                      ))}
                      {dashboardSection === 'clients' && orderedProjects.filter(p => Math.max(0, toNum(p.cli_contract) - toNum(p.cli_paid)) > 0).map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', direction: 'ltr' }}>{fmtAmountLabel(toNum(p.cli_contract) - toNum(p.cli_paid), p.cli_currency || '₪')}</span>
                        </div>
                      ))}
                      {dashboardSection === 'loans' && (() => {
                        try {
                          const loans = JSON.parse(localStorage.getItem('cashflow-loan-balances') || '{}')['חניה אורבנית'] || []
                          return loans.filter(l => toNum(l.amount) > 0).map(l => (
                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{l.name || 'הלוואה'}</span>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#b91c1c', direction: 'ltr' }}>{toNum(l.amount).toLocaleString('he-IL')} ₪</span>
                            </div>
                          ))
                        } catch { return null }
                      })()}
                    </div>
                  </div>
                )}
              </>
            )
          })()}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 14px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f', whiteSpace: 'nowrap' }}>פרויקטים בביצוע</span>
            <button onClick={() => setShowGantt(v => !v)}
              style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '600', border: '1px solid', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: showGantt ? '#1e3a5f' : '#fff', color: showGantt ? '#fff' : '#1e3a5f', borderColor: '#1e3a5f' }}>
              📅 גאנט
            </button>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {showGantt && (
            <div style={{ marginBottom: '20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e3a5f' }}>גאנט — אבני דרך</span>
                <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#64748b' }}>
                  {Object.entries(GANTT_CLR).map(([k, c]) => {
                    const label = { signed:'נחתם', advance:'מקדמה', ordered:'הזמנה', arrived:'הגיע', install:'התקנה', done:'הסתיים' }[k]
                    return <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />{label}
                    </span>
                  })}
                </div>
              </div>
              <GanttChart projects={visible} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {visible.length === 0 && <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>אין פרויקטים בסטטוס זה</div>}
            {visible.map(p => {
              const ps = PROJECT_STATUSES.find(s => s.id === (p.cardStatus || 'advance')) || PROJECT_STATUSES[0]
              return (
                <div key={p.id} style={{ background: '#fff', borderRadius: '18px', border: `1px solid ${ps.border}`, borderTop: `4px solid ${ps.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', direction: 'rtl', overflow: 'hidden', transition: 'box-shadow 0.15s, transform 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ background: ps.bg, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${ps.border}` }}>
                    <select value={p.cardStatus || 'advance'} onChange={e => update(p.id, 'cardStatus', e.target.value)} style={{ border: 'none', background: 'transparent', color: ps.color, fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', padding: 0, flex: 1 }}>
                      {PROJECT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <button onClick={() => deleteProject(p.id, p.name)} title="מחק פרויקט" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '13px', padding: 0, lineHeight: 1, flexShrink: 0, marginRight: '6px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>✕</button>
                  </div>
                  <div style={{ padding: '16px 16px 12px', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>שם פרויקט</div>
                    <input value={p.name} onChange={e => update(p.id, 'name', e.target.value)} style={{ ...cardInput, fontSize: '17px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '-0.01em' }} />
                  </div>
                  <div style={{ padding: '0 14px 14px' }}>
                    <button onClick={() => navigate(`/parking/projects/${p.id}`, { state: { fromTab: tab } })} style={{ width: '100%', padding: '8px', background: ps.color, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.01em' }}>
                      פתח פרויקט ↗
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={addRow} style={{ padding: '6px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>+ הוסף פרויקט</button>
          <button onClick={resetProjects} style={{ padding: '6px 16px', background: '#f8fafc', color: '#1e3a5f', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>שחזר פרויקטי ברירת מחדל</button>
        </div>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>השינויים נשמרים אוטומטית</span>
      </div>
    </div>
  )
}
