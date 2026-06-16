import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import './ArielPage.css'

const PROJECTS = {
  'pnkas-24':       { name: 'פנקס 24' },
  'nahariya':       { name: 'נהריה' },
  'ein-hakore':     { name: 'עין הקורא' },
  'congress':       { name: 'הקונגרס' },
  'hirschfeld':     { name: 'הירשפילד' },
  'sokolov-zinger': { name: 'סוקולוב — יהודה זינגר' },
  'vermiza':        { name: 'ורמיזה' },
  'bney-binyamin':  { name: 'בני בנימין' },
}

const STATUSES = [
  { id: 'in-progress', label: 'בביצוע', color: '#0d9488' },
  { id: 'delivered',   label: 'נמסר',   color: '#16a34a' },
  { id: 'cancelled',   label: 'בוטל',   color: '#dc2626' },
]

const DETAILS_FIELDS = [
  { key: 'location',     label: 'מיקום' },
  { key: 'client',       label: 'לקוח / גוף מזמין' },
  { key: 'spots',        label: 'מספר מקומות חניה' },
  { key: 'manufacturer', label: 'שם יצרן' },
]

const DEFAULT_MILESTONES = [
  'חתימת חוזה',
  'תשלום מקדמה',
  'תשלום בגין הזמנה',
  'הזמנה',
  'הגעה לארץ',
  'תחילת התקנה',
  'סיום התקנה',
]

const toNum = (v) => parseFloat(String(v || '').replace(/,/g, '')) || 0

const fmtAmount = (v) => {
  const n = toNum(v)
  if (!v || !n) return v || ''
  return n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const fmtFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const loadData = (projectId) => {
  try {
    const s = localStorage.getItem(`parking-project-${projectId}`)
    if (s) {
      const d = JSON.parse(s)
      if (!d.milestones) {
        d.milestones = DEFAULT_MILESTONES.map((name, i) => ({
          name,
          done:   !!d[`ms_done_${i}`],
          date:   d[`ms_date_${i}`] || '',
          note:   '',
          amount: '',
        }))
      }
      return d
    }
  } catch {}
  return { milestones: DEFAULT_MILESTONES.map(name => ({ name, done: false, date: '', note: '', amount: '' })) }
}

const loadProjectName = (projectId) => {
  try {
    const s = localStorage.getItem('parking-projects-v3')
    if (s) {
      const list = JSON.parse(s)
      const found = list.find(p => p.id === projectId)
      if (found?.name) return found.name
    }
  } catch {}
  return PROJECTS[projectId]?.name || null
}

const fieldLabel = { fontSize: '11px', color: '#475569' }

const SectionTitle = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '28px', marginBottom: '14px' }}>
    <div style={{ width: '4px', height: '22px', background: '#1e3a5f', borderRadius: '2px', flexShrink: 0 }} />
    <span style={{ fontSize: '17px' }}>{icon}</span>
    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e3a5f', letterSpacing: '0.01em' }}>{title}</h2>
  </div>
)

const AccountSection = ({ title, contractKey, paidKey, currency, currencyKey, note, data, update }) => {
  const displayCurrency = currencyKey ? (data[currencyKey] || currency) : currency
  const contract  = toNum(data[contractKey])
  const paid      = toNum(data[paidKey])
  const remaining = contract - paid
  const remColor  = remaining < 0 ? '#dc2626' : '#d97706'
  const remBg     = remaining < 0 ? '#fee2e2' : '#fef3c7'
  const remBorder = remaining < 0 ? '#fca5a5' : '#fcd34d'
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {title}
        {currencyKey ? (
          <select
            value={data[currencyKey] || currency}
            onChange={e => update(currencyKey, e.target.value)}
            style={{ fontSize: '12px', fontWeight: 'normal', color: '#1e3a5f', border: '1px solid #93c5fd', borderRadius: '4px', padding: '1px 4px', background: '#eff6ff', cursor: 'pointer' }}>
            <option value="€">€ יורו</option>
            <option value="$">$ דולר</option>
          </select>
        ) : (
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>({displayCurrency})</span>
        )}
        {note && <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' }}>{note}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '12px', borderRadius: '8px', background: '#dbeafe', border: '1px solid #93c5fd', borderTop: '3px solid #1e3a5f' }}>
          <div style={fieldLabel}>סכום חוזה {displayCurrency}</div>
          <AmountInput value={data[contractKey] || ''}
            onChange={e => update(contractKey, e.target.value)}
            onBlur={e => update(contractKey, fmtAmount(e.target.value))}
            color="#1e3a5f" />
        </div>
        <div style={{ padding: '12px', borderRadius: '8px', background: '#dcfce7', border: '1px solid #86efac', borderTop: '3px solid #16a34a' }}>
          <div style={fieldLabel}>סכום ששולם {displayCurrency}</div>
          <AmountInput value={data[paidKey] || ''}
            onChange={e => update(paidKey, e.target.value)}
            onBlur={e => update(paidKey, fmtAmount(e.target.value))}
            color="#16a34a" />
        </div>
        <div style={{ padding: '12px', borderRadius: '8px', background: remBg, border: `1px solid ${remBorder}`, borderTop: `3px solid ${remColor}` }}>
          <div style={fieldLabel}>סכום שטרם שולם {displayCurrency}</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: remColor, textAlign: 'right', direction: 'ltr', marginTop: '6px' }}>
            {contract || paid ? fmtAmount(String(Math.abs(remaining))) : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

const AmountInput = ({ value, onChange, onBlur, color, placeholder = '0' }) => (
  <input
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    placeholder={placeholder}
    inputMode="numeric"
    style={{
      width: '100%', boxSizing: 'border-box',
      border: 'none', background: 'transparent',
      fontSize: '20px', fontWeight: 'bold', color,
      fontFamily: 'inherit', outline: 'none',
      textAlign: 'right', direction: 'ltr',
      marginTop: '6px', display: 'block',
    }}
  />
)

const cfCell = { padding: '6px 10px', borderLeft: '1px solid #f1f5f9' }
const cfInput = { width: '100%', border: 'none', background: 'transparent', fontFamily: 'inherit', outline: 'none', direction: 'rtl' }

const CashflowRow = ({ row, index, isFirst, isLast, isEven, cumulative, onUpdate, onRemove, onMoveUp, onMoveDown }) => {
  const [vals, setVals] = useState({ details: row.details || '', date: row.date || '', amount: row.amount || '' })

  useEffect(() => {
    setVals({ details: row.details || '', date: row.date || '', amount: row.amount || '' })
  }, [row.details, row.date, row.amount])

  const commit = (field, value) => onUpdate(index, field, value)
  const commitAmount = (value) => {
    const raw = String(value).replace(/,/g, '')
    const n = parseFloat(raw) || 0
    const isNeg = raw.trim().startsWith('-') && n === 0 ? false : n < 0
    const absStr = Math.abs(n).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const fmt = n === 0 ? value : (isNeg ? '-' + absStr : absStr)
    setVals(v => ({ ...v, amount: fmt }))
    onUpdate(index, 'amount', fmt)
  }

  const amountNum = parseFloat(String(vals.amount).replace(/,/g, '')) || 0
  const amountColor = amountNum < 0 ? '#dc2626' : '#15803d'

  const btnStyle = { border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '11px', padding: '1px 2px', lineHeight: 1, display: 'block' }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '3fr 155px 155px 155px 44px',
      alignItems: 'stretch', direction: 'rtl',
      background: isEven ? '#fff' : '#f8fafc',
      borderBottom: '1px solid #f1f5f9',
    }}>
      <div style={cfCell}>
        <input value={vals.details}
          onChange={e => setVals(v => ({ ...v, details: e.target.value }))}
          onBlur={() => commit('details', vals.details)}
          placeholder="פרטים..."
          style={{ ...cfInput, fontSize: '15px', color: '#1e3a5f', fontWeight: '600', padding: '7px 0' }} />
      </div>
      <div style={{ ...cfCell, borderRight: 'none' }}>
        <input type="date" value={vals.date}
          onChange={e => { setVals(v => ({ ...v, date: e.target.value })); commit('date', e.target.value) }}
          style={{ ...cfInput, fontSize: '14px', color: '#374151', padding: '7px 0' }} />
      </div>
      <div style={cfCell}>
        <input value={vals.amount}
          onChange={e => setVals(v => ({ ...v, amount: e.target.value }))}
          onBlur={() => commitAmount(vals.amount)}
          placeholder="0" inputMode="numeric"
          style={{ ...cfInput, fontSize: '15px', fontWeight: 'bold', direction: 'ltr', textAlign: 'right', color: amountColor, padding: '7px 0' }} />
      </div>
      <div style={{ ...cfCell, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '15px', fontWeight: 'bold', direction: 'ltr', color: cumulative < 0 ? '#dc2626' : '#0369a1' }}>
          {cumulative < 0 ? '-' : ''}{Math.abs(cumulative).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '4px 4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <button onClick={onMoveUp} disabled={isFirst} title="הזז למעלה"
            style={{ ...btnStyle, opacity: isFirst ? 0.2 : 1 }}
            onMouseEnter={e => { if (!isFirst) e.currentTarget.style.color = '#1e3a5f' }}
            onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>▲</button>
          <button onClick={onMoveDown} disabled={isLast} title="הזז למטה"
            style={{ ...btnStyle, opacity: isLast ? 0.2 : 1 }}
            onMouseEnter={e => { if (!isLast) e.currentTarget.style.color = '#1e3a5f' }}
            onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>▼</button>
        </div>
        <button onClick={() => onRemove(index)} title="מחק שורה"
          style={{ ...btnStyle, fontSize: '13px', marginRight: '2px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
          onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>✕</button>
      </div>
    </div>
  )
}

export default function ParkingProjectDetailPage() {
  const { projectId } = useParams()
  const location = useLocation()
  const fromTab = location.state?.fromTab || 'in-progress'
  const projectName = loadProjectName(projectId)
  const project = projectName ? { name: projectName } : PROJECTS[projectId]

  const [status, setStatus] = useState(() => loadData(projectId).status || 'in-progress')
  const [data, setData] = useState(() => loadData(projectId))

  if (!project) {
    return (
      <div className="ariel-page">
        <div className="container">
          <Link to="/" state={{ tab: fromTab }} className="ariel-back">&rarr; חזרה לתזרים ופרויקטים</Link>
          <p style={{ color: '#dc2626', marginTop: '24px' }}>פרויקט לא נמצא</p>
        </div>
      </div>
    )
  }

  const save = (next) => {
    setData(next)
    localStorage.setItem(`parking-project-${projectId}`, JSON.stringify(next))
  }

  const update = (field, value) => save({ ...data, [field]: value })

  const updateStatus = (val) => { setStatus(val); update('status', val) }

  const updateMilestone = (i, field, value) => {
    const ms = data.milestones.map((m, idx) => idx === i ? { ...m, [field]: value } : m)
    save({ ...data, milestones: ms })
  }

  const addMilestone = () => {
    const ms = [...data.milestones, { name: 'אבן דרך חדשה', done: false, date: '', note: '', amount: '' }]
    save({ ...data, milestones: ms })
  }

  const removeMilestone = (i) => {
    const ms = data.milestones.filter((_, idx) => idx !== i)
    save({ ...data, milestones: ms })
  }

  const addContact = () => {
    const contacts = [...(data.contacts || []), { name: '', phone: '' }]
    save({ ...data, contacts })
  }

  const updateContact = (i, field, value) => {
    const contacts = (data.contacts || []).map((c, idx) => idx === i ? { ...c, [field]: value } : c)
    save({ ...data, contacts })
  }

  const removeContact = (i) => {
    const contacts = (data.contacts || []).filter((_, idx) => idx !== i)
    save({ ...data, contacts })
  }

  const addCashflow = () => {
    const today = new Date().toISOString().slice(0, 10)
    const cf = [...(data.cashflow || []), { details: '', date: today, amount: '' }]
    save({ ...data, cashflow: cf })
  }

  const updateCashflow = (i, field, value) => {
    const cf = (data.cashflow || []).map((r, idx) => idx === i ? { ...r, [field]: value } : r)
    save({ ...data, cashflow: cf })
  }

  const removeCashflow = (i) => {
    const cf = (data.cashflow || []).filter((_, idx) => idx !== i)
    save({ ...data, cashflow: cf })
  }

  const moveCashflow = (i, dir) => {
    const cf = [...(data.cashflow || [])]
    const j = i + dir
    if (j < 0 || j >= cf.length) return
    ;[cf[i], cf[j]] = [cf[j], cf[i]]
    save({ ...data, cashflow: cf })
  }

  const sortCashflowByDate = () => {
    const cf = [...(data.cashflow || [])].sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
    save({ ...data, cashflow: cf })
  }

  const clearMilestoneField = (i, field, flag) => {
    const ms = data.milestones.map((m, idx) => idx === i ? { ...m, [field]: '', [flag]: false } : m)
    save({ ...data, milestones: ms })
  }

  const showMilestoneField = (i, flag) => {
    const ms = data.milestones.map((m, idx) => idx === i ? { ...m, [flag]: true } : m)
    save({ ...data, milestones: ms })
  }

  const fileInputRef = useRef(null)

  const uploadDocs = (files) => {
    const fileArray = Array.from(files)
    if (!fileArray.length) return
    let results = [], done = 0
    fileArray.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        results.push({ name: file.name, type: file.type, size: file.size, data: e.target.result, date: new Date().toISOString().slice(0, 10) })
        if (++done === fileArray.length) {
          setData(cur => {
            const next = { ...cur, docs: [...(cur.docs || []), ...results] }
            try {
              localStorage.setItem(`parking-project-${projectId}`, JSON.stringify(next))
            } catch {
              alert('הקבצים גדולים מדי לאחסון מקומי. נסי קבצים קטנים יותר.')
              return cur
            }
            return next
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const deleteDoc = (idx) => {
    if (!window.confirm('למחוק קובץ זה?')) return
    const docs = (data.docs || []).filter((_, i) => i !== idx)
    save({ ...data, docs })
  }

  const st = STATUSES.find(s => s.id === status)

  const fieldBox   = { padding: '12px', border: '1px solid #c7d7e8', borderRadius: '8px', background: '#dbeafe' }
  const fieldInput = { width: '100%', border: 'none', background: 'transparent', fontSize: '14px', fontFamily: 'inherit', outline: 'none', direction: 'rtl', marginTop: '2px', color: '#111' }

  const handlePrint = () => {
    const fmtDate = (d) => d ? d.split('-').reverse().join('/') : '—'
    const mfrContract = toNum(data.mfr_contract), mfrPaid = toNum(data.mfr_paid)
    const cliContract = toNum(data.cli_contract), cliPaid = toNum(data.cli_paid)
    const mfrRem = mfrContract - mfrPaid, cliRem = cliContract - cliPaid
    const remColor = (v) => v < 0 ? '#dc2626' : '#d97706'
    const remBg    = (v) => v < 0 ? '#fee2e2' : '#fef3c7'

    const msRows = (data.milestones || []).map(m => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:16px;color:${m.done ? '#16a34a' : '#d1d5db'};">${m.done ? '✓' : '○'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;color:${m.done ? '#9ca3af' : '#1e3a5f'};text-decoration:${m.done ? 'line-through' : 'none'};">${m.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">${fmtDate(m.date)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;direction:ltr;text-align:right;font-weight:bold;">${m.amount || '—'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${m.note || ''}</td>
      </tr>`).join('')

    const card = (label, value, color, bg) =>
      `<div style="border:1px solid #e2e8f0;border-top:3px solid ${color};border-radius:8px;padding:12px;background:${bg};">
        <div style="font-size:10px;color:#64748b;margin-bottom:4px;">${label}</div>
        <div style="font-size:17px;font-weight:bold;color:${color};direction:ltr;text-align:right;">${value || '—'}</div>
      </div>`

    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8">
      <title>פרויקט: ${project.name}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;padding:28px;background:#fff;direction:rtl;}
        h1{font-size:22px;font-weight:800;color:#1e3a5f;margin-bottom:4px;}
        .sub{font-size:12px;color:#64748b;margin-bottom:22px;}
        .sec{font-size:13px;font-weight:700;color:#1e3a5f;margin:20px 0 10px;display:flex;align-items:center;gap:8px;break-after:avoid;page-break-after:avoid;}
        .sec::before{content:'';display:inline-block;width:4px;height:18px;background:#1e3a5f;border-radius:2px;}
        .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;break-inside:avoid;page-break-inside:avoid;}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;break-inside:avoid;page-break-inside:avoid;}
        .details{display:flex;gap:28px;margin-bottom:20px;flex-wrap:wrap;break-inside:avoid;page-break-inside:avoid;}
        .dl{} .dl-label{font-size:10px;color:#9ca3af;} .dl-val{font-size:14px;font-weight:600;color:#1e3a5f;}
        table{width:100%;border-collapse:collapse;break-inside:avoid;page-break-inside:avoid;}
        th{background:#1e3a5f;color:#fff;padding:8px 10px;font-size:12px;}
        .notes{border:1px solid #e5e7eb;border-radius:8px;padding:12px;line-height:1.7;white-space:pre-wrap;font-size:13px;break-inside:avoid;page-break-inside:avoid;}
        @media print{@page{margin:1.5cm;}}
      </style></head><body>
      <h1>🅿️ ${project.name}</h1>
      <div class="sub">סטטוס: ${st?.label || ''} &nbsp;|&nbsp; הודפס: ${new Date().toLocaleDateString('he-IL')}</div>

      <div class="sec">📋 פרטים כלליים</div>
      <div class="details">
        ${DETAILS_FIELDS.map(f => `<div class="dl"><div class="dl-label">${f.label}</div><div class="dl-val">${data[f.key] || '—'}</div></div>`).join('')}
      </div>
      ${(data.contacts || []).length > 0 ? `
      <div style="margin-bottom:16px;">
        <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:6px;">אנשי קשר</div>
        ${(data.contacts).map(c => `<div style="display:inline-flex;align-items:center;gap:8px;margin-left:16px;margin-bottom:4px;font-size:13px;">
          <span>👤 ${c.name || '—'}</span>
          ${c.phone ? `<span style="color:#6b7280;direction:ltr;">📞 ${c.phone}</span>` : ''}
        </div>`).join('')}
      </div>` : ''}

      <div class="sec">💰 מצב חשבון מול היצרן (${data.mfr_currency || '€'})</div>
      <div class="grid3">
        ${card(`סכום חוזה ${data.mfr_currency || '€'}`, data.mfr_contract, '#1e3a5f', '#dbeafe')}
        ${card(`סכום ששולם ${data.mfr_currency || '€'}`, data.mfr_paid, '#16a34a', '#dcfce7')}
        ${card(`סכום שטרם שולם ${data.mfr_currency || '€'}`, mfrContract||mfrPaid ? fmtAmount(String(Math.abs(mfrRem))) : '', remColor(mfrRem), remBg(mfrRem))}
      </div>

      <div class="sec">💰 מצב חשבון מול הלקוח ₪ — ללא מע"מ</div>
      <div class="grid3">
        ${card('סכום חוזה ₪', data.cli_contract, '#1e3a5f', '#dbeafe')}
        ${card('סכום ששולם ₪', data.cli_paid, '#16a34a', '#dcfce7')}
        ${card('סכום שטרם שולם ₪', cliContract||cliPaid ? fmtAmount(String(Math.abs(cliRem))) : '', remColor(cliRem), remBg(cliRem))}
      </div>

      <div class="grid2" style="margin-top:4px;">
        <div style="border:1px solid #c4b5fd;border-top:3px solid #7c3aed;border-radius:8px;padding:12px;background:#ede9fe;">
          <div style="font-weight:700;color:#7c3aed;margin-bottom:8px;">ערבויות</div>
          <div style="font-size:17px;font-weight:bold;color:#7c3aed;direction:ltr;text-align:right;">${data.guarantees || '—'}</div>
          ${data.guarantees_end ? `<div style="margin-top:6px;font-size:11px;color:#6b7280;">תאריך סיום: ${fmtDate(data.guarantees_end)}</div>` : ''}
        </div>
        <div style="border:1px solid #67e8f9;border-top:3px solid #0891b2;border-radius:8px;padding:12px;background:#cffafe;">
          <div style="font-weight:700;color:#0891b2;margin-bottom:8px;">פקדונות</div>
          <div style="font-size:17px;font-weight:bold;color:#0891b2;direction:ltr;text-align:right;">${data.deposits || '—'}</div>
          ${data.deposits_station ? `<div style="margin-top:6px;font-size:11px;color:#6b7280;">תאריך יציאה: ${fmtDate(data.deposits_station)}</div>` : ''}
        </div>
      </div>

      <div class="sec">🏁 אבני דרך</div>
      <table><thead><tr>
        <th style="width:36px;"></th>
        <th>אבן דרך</th>
        <th style="width:90px;text-align:center;">תאריך</th>
        <th style="width:100px;direction:ltr;text-align:right;">סכום ₪</th>
        <th>הערה</th>
      </tr></thead><tbody>${msRows}</tbody></table>

      ${(data.cashflow || []).length > 0 ? (() => {
        const cfTotal = (data.cashflow || []).reduce((s, r) => s + (parseFloat(String(r.amount || '').replace(/,/g, '')) || 0), 0)
        const cfAmtColor = (v) => parseFloat(String(v).replace(/,/g, '')) < 0 ? '#dc2626' : '#15803d'
        const cfToN = (v) => parseFloat(String(v || '').replace(/,/g, '')) || 0
        let cfRunning = 0
        const cfRows = (data.cashflow || []).map((r, idx) => {
          cfRunning += cfToN(r.amount)
          const cumColor = cfRunning < 0 ? '#dc2626' : '#0369a1'
          const cumStr = (cfRunning < 0 ? '-' : '') + Math.abs(cfRunning).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          return `
          <tr style="background:${idx % 2 === 0 ? '#fff' : '#f8fafc'};">
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-weight:600;color:#1e3a5f;font-size:14px;">${r.details || ''}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;text-align:center;color:#374151;font-size:14px;">${fmtDate(r.date)}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;direction:ltr;text-align:right;font-weight:bold;color:${cfAmtColor(r.amount)};font-size:14px;">${r.amount || '—'}</td>
            <td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;direction:ltr;text-align:right;font-weight:bold;color:${cumColor};font-size:14px;">${cumStr}</td>
          </tr>`}).join('')
        const cfTotalColor = cfTotal < 0 ? '#dc2626' : '#15803d'
        const cfTotalBg    = cfTotal < 0 ? '#fef2f2' : '#f0fdf4'
        const cfTotalBorder = cfTotal < 0 ? '#dc2626' : '#16a34a'
        const cfAbsTotal = Math.abs(cfTotal).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return `<div class="sec">💵 תזרים מזומנים צפוי</div>
          <table>
            <thead><tr>
              <th>פרטים</th>
              <th style="width:120px;text-align:center;">תאריך</th>
              <th style="width:120px;direction:ltr;text-align:right;">סכום ₪</th>
              <th style="width:130px;direction:ltr;text-align:right;">מצטבר ₪</th>
            </tr></thead>
            <tbody>${cfRows}</tbody>
            <tfoot><tr style="background:${cfTotalBg};border-top:2px solid ${cfTotalBorder};">
              <td colspan="2" style="padding:8px 10px;font-weight:700;color:${cfTotalColor};">סה"כ</td>
              <td style="padding:8px 10px;font-weight:800;color:${cfTotalColor};direction:ltr;text-align:right;">${cfTotal < 0 ? '-' : ''}${cfAbsTotal}</td>
              <td></td>
            </tr></tfoot>
          </table>`
      })() : ''}

      ${data.notes ? `<div class="sec">📝 הערות</div><div class="notes">${data.notes}</div>` : ''}
    </body></html>`

    const w = window.open('', '_blank', 'width=900,height=700')
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 400)
  }

  return (
    <div className="ariel-page">
      <div className="container" style={{ maxWidth: '900px' }}>
        <Link to="/" className="ariel-back print-hide">&rarr; חזרה לתזרים ופרויקטים</Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e3a5f' }}>🅿️ {project.name}</h1>
            <select value={status} onChange={e => updateStatus(e.target.value)} className="print-hide"
              style={{ padding: '4px 12px', borderRadius: '16px', border: `2px solid ${st?.color}`, color: st?.color, fontWeight: 'bold', fontSize: '13px', background: (st?.color || '#000') + '18', cursor: 'pointer' }}>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <button onClick={handlePrint}
            style={{ padding: '6px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            🖨️ הדפס PDF
          </button>
        </div>

        {/* ─── פרטים כלליים ─── */}
        <SectionTitle icon="📋" title="פרטים כלליים" />
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', padding: '4px 0 16px' }}>
          {DETAILS_FIELDS.map(f => (
            <div key={f.key} style={{ minWidth: '120px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{f.label}</div>
              <input value={data[f.key] || ''} onChange={e => update(f.key, e.target.value)}
                placeholder="—"
                style={{ border: 'none', borderBottom: '1px solid #e5e7eb', background: 'transparent', fontSize: '15px', fontWeight: '600', color: data[f.key] ? '#1e3a5f' : '#d1d5db', fontFamily: 'inherit', outline: 'none', direction: 'rtl', width: '100%', padding: '2px 0' }} />
            </div>
          ))}
        </div>

        {/* אנשי קשר */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>אנשי קשר</span>
            <button onClick={addContact}
              style={{ border: '1px dashed #e5e7eb', background: 'none', borderRadius: '4px', padding: '1px 7px', fontSize: '10px', color: '#9ca3af', cursor: 'pointer' }}>
              + הוסף
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(data.contacts || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <input value={c.name} onChange={e => updateContact(i, 'name', e.target.value)}
                  placeholder="שם"
                  style={{ border: 'none', background: 'transparent', fontSize: '11px', fontWeight: '600', color: '#1e3a5f', fontFamily: 'inherit', outline: 'none', direction: 'rtl', width: '80px' }} />
                <span style={{ fontSize: '10px', color: '#d1d5db' }}>|</span>
                <input value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)}
                  placeholder="טלפון" inputMode="tel"
                  style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#6b7280', fontFamily: 'inherit', outline: 'none', direction: 'ltr', width: '90px' }} />
                <button onClick={() => removeContact(i)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e5e7eb', fontSize: '10px', padding: 0, lineHeight: 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#e5e7eb'}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── כספים ─── */}
        <SectionTitle icon="💰" title="כספים" />

        <AccountSection title="מצב חשבון מול היצרן" contractKey="mfr_contract" paidKey="mfr_paid" currency="€" currencyKey="mfr_currency" data={data} update={update} />
        <AccountSection title="מצב חשבון מול הלקוח" contractKey="cli_contract" paidKey="cli_paid" currency="₪" note='ללא מע"מ' data={data} update={update} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* ערבויות */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '12px' }}>ערבויות</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#ede9fe', border: '1px solid #c4b5fd', borderTop: '3px solid #7c3aed' }}>
                <div style={fieldLabel}>סכום</div>
                <AmountInput value={data.guarantees || ''} onChange={e => update('guarantees', e.target.value)}
                  onBlur={e => update('guarantees', fmtAmount(e.target.value))} color="#7c3aed" />
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderTop: '3px solid #7c3aed' }}>
                <div style={fieldLabel}>תאריך סיום</div>
                <input type="date" value={data.guarantees_end || ''} onChange={e => update('guarantees_end', e.target.value)}
                  style={{ ...fieldInput, fontSize: '13px', color: '#374151', marginTop: '6px' }} />
              </div>
            </div>
          </div>

          {/* פקדונות */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a5f', marginBottom: '12px' }}>פקדונות</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#cffafe', border: '1px solid #67e8f9', borderTop: '3px solid #0891b2' }}>
                <div style={fieldLabel}>סכום</div>
                <AmountInput value={data.deposits || ''} onChange={e => update('deposits', e.target.value)}
                  onBlur={e => update('deposits', fmtAmount(e.target.value))} color="#0891b2" />
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: '#ecfeff', border: '1px solid #a5f3fc', borderTop: '3px solid #0891b2' }}>
                <div style={fieldLabel}>תאריך יציאה</div>
                <input type="date" value={data.deposits_station || ''} onChange={e => update('deposits_station', e.target.value)}
                  style={{ ...fieldInput, fontSize: '13px', color: '#374151', marginTop: '6px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── אבני דרך ─── */}
        <SectionTitle icon="🏁" title="אבני דרך" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(data.milestones || []).map((m, i) => (
            <div key={i} style={{
              borderRadius: '10px',
              border: `1px solid ${m.done ? '#bbf7d0' : '#e5e7eb'}`,
              borderRight: `4px solid ${m.done ? '#16a34a' : '#cbd5e1'}`,
              background: m.done ? '#f0fdf4' : '#fafafa',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div onClick={() => updateMilestone(i, 'done', !m.done)} style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                  border: `2px solid ${m.done ? '#16a34a' : '#d1d5db'}`,
                  background: m.done ? '#16a34a' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: '#fff', fontWeight: 'bold',
                }}>
                  {m.done ? '✓' : ''}
                </div>

                <input value={m.name} onChange={e => updateMilestone(i, 'name', e.target.value)}
                  style={{
                    flex: 1, border: 'none', background: 'transparent', fontFamily: 'inherit', outline: 'none',
                    fontSize: '15px', fontWeight: '700', direction: 'rtl',
                    color: m.done ? '#9ca3af' : '#1e3a5f',
                    textDecoration: m.done ? 'line-through' : 'none',
                  }} />

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
                  background: m.date ? (m.done ? '#dcfce7' : '#eff6ff') : '#f3f4f6',
                  border: `1px solid ${m.date ? (m.done ? '#86efac' : '#bfdbfe') : '#e5e7eb'}`,
                  borderRadius: '8px', padding: '4px 10px',
                }}>
                  <span style={{ fontSize: '13px' }}>📅</span>
                  <input type="date" value={m.date || ''} onChange={e => updateMilestone(i, 'date', e.target.value)}
                    style={{
                      border: 'none', background: 'transparent', outline: 'none',
                      fontSize: '13px', color: m.date ? (m.done ? '#16a34a' : '#1d4ed8') : '#9ca3af',
                      fontFamily: 'inherit', width: '120px',
                    }} />
                </div>

                <button onClick={() => removeMilestone(i)} title="הסר"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '14px', padding: '0', lineHeight: 1, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>✕</button>
              </div>

              {(m.showAmount !== false || m.showNote !== false) && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingRight: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {m.showAmount !== false ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px 10px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>₪</span>
                      <input value={m.amount || ''} onChange={e => updateMilestone(i, 'amount', e.target.value)}
                        onBlur={e => updateMilestone(i, 'amount', fmtAmount(e.target.value))}
                        placeholder="סכום" inputMode="numeric"
                        style={{ border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 'bold', color: '#374151', fontFamily: 'inherit', outline: 'none', textAlign: 'right', direction: 'ltr', width: '110px' }} />
                      <button onClick={() => clearMilestoneField(i, 'amount', 'showAmount')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '11px', padding: '0', lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => showMilestoneField(i, 'showAmount')}
                      style={{ border: '1px dashed #d1d5db', background: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>
                      + סכום
                    </button>
                  )}
                  {m.showNote !== false ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '140px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '4px 10px' }}>
                      <input value={m.note || ''} onChange={e => updateMilestone(i, 'note', e.target.value)}
                        placeholder="הערה..."
                        style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', color: '#374151', fontFamily: 'inherit', outline: 'none', direction: 'rtl' }} />
                      <button onClick={() => clearMilestoneField(i, 'note', 'showNote')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '11px', padding: '0', lineHeight: 1, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => showMilestoneField(i, 'showNote')}
                      style={{ border: '1px dashed #d1d5db', background: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>
                      + הערה
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={addMilestone}
          style={{ marginTop: '10px', padding: '6px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
          + הוסף אבן דרך
        </button>

        {/* ─── תזרים מזומנים צפוי ─── */}
        <SectionTitle icon="💵" title="תזרים מזומנים צפוי" />

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 155px 155px 155px 44px', background: '#1e3a5f', direction: 'rtl' }}>
            <div style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: '#93c5fd', letterSpacing: '0.03em' }}>פרטים</div>
            <div onClick={sortCashflowByDate} title="מיין לפי תאריך"
              style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: '#93c5fd', letterSpacing: '0.03em', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#93c5fd'}>
              תאריך <span style={{ fontSize: '9px', opacity: 0.8 }}>▲</span>
            </div>
            <div style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: '#93c5fd', letterSpacing: '0.03em' }}>סכום ₪</div>
            <div style={{ padding: '8px 10px', fontSize: '11px', fontWeight: '700', color: '#93c5fd', letterSpacing: '0.03em' }}>מצטבר ₪</div>
            <div />
          </div>

          {(data.cashflow || []).length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              לא הוזנו פריטים
            </div>
          )}

          {(data.cashflow || []).map((row, i) => {
            const toN = v => parseFloat(String(v || '').replace(/,/g, '')) || 0
            const cumulative = (data.cashflow || []).slice(0, i + 1).reduce((s, r) => s + toN(r.amount), 0)
            return (
              <CashflowRow key={i} row={row} index={i} isEven={i % 2 === 0}
                isFirst={i === 0} isLast={i === (data.cashflow || []).length - 1}
                cumulative={cumulative}
                onUpdate={updateCashflow} onRemove={removeCashflow}
                onMoveUp={() => moveCashflow(i, -1)} onMoveDown={() => moveCashflow(i, 1)} />
            )
          })}

          {(data.cashflow || []).length > 0 && (() => {
            const total = (data.cashflow || []).reduce((s, r) => s + (parseFloat(String(r.amount || '').replace(/,/g, '')) || 0), 0)
            const tColor = total < 0 ? '#dc2626' : '#15803d'
            const tBg    = total < 0 ? '#fef2f2' : '#f0fdf4'
            const tBorder = total < 0 ? '#dc2626' : '#16a34a'
            const absTotal = Math.abs(total).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 155px 155px 155px 44px', background: tBg, borderTop: `2px solid ${tBorder}`, direction: 'rtl' }}>
                <div style={{ padding: '8px 10px', fontSize: '13px', fontWeight: '700', color: tColor, gridColumn: '1/3' }}>סה"כ</div>
                <div style={{ padding: '8px 10px', fontSize: '15px', fontWeight: '800', color: tColor, direction: 'ltr', textAlign: 'right' }}>
                  {total < 0 ? '-' : ''}{absTotal}
                </div>
                <div />
                <div />
              </div>
            )
          })()}
        </div>

        <button onClick={addCashflow}
          style={{ marginTop: '8px', marginBottom: '4px', padding: '6px 16px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
          + הוסף שורה
        </button>

        {/* ─── מסמכים ─── */}
        <SectionTitle icon="📄" title="מסמכים" />

        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
          onChange={e => { uploadDocs(e.target.files); e.target.value = '' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button onClick={() => fileInputRef.current.click()}
            style={{ padding: '7px 18px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            📎 העלה קבצים
          </button>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>PDF, תמונות, Excel וכד׳</span>
        </div>

        {(data.docs || []).length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '16px', border: '1px dashed #e5e7eb', borderRadius: '8px', fontSize: '13px' }}>
            לא הועלו קבצים
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(data.docs || []).map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>
                  {doc.type?.startsWith('image') ? '🖼️' : doc.type === 'application/pdf' ? '📄' : '📁'}
                </span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <a href={doc.data} download={doc.name}
                    style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a5f', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.name}
                  </a>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{fmtFileSize(doc.size)} · {doc.date}</div>
                </div>
                <button onClick={() => deleteDoc(idx)} title="מחק קובץ"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '14px', padding: '0 4px', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* ─── הערות ─── */}
        <SectionTitle icon="📝" title="הערות" />
        <textarea value={data.notes || ''} onChange={e => update('notes', e.target.value)}
          placeholder="הערות לפרויקט..."
          style={{ width: '100%', minHeight: '120px', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', resize: 'vertical', direction: 'rtl', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', lineHeight: 1.6 }} />

        <div style={{ height: '48px' }} />
      </div>
    </div>
  )
}
