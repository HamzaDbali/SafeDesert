import React from 'react'

/* ── Button ──────────────────────────────────────────────────────────────── */
export function Button({ children, variant='primary', onClick, style={}, disabled=false, fullWidth=false, size='md' }) {
  const sizes  = { sm:{padding:'8px 14px',fontSize:13}, md:{padding:'13px 20px',fontSize:15}, lg:{padding:'16px 24px',fontSize:16} }
  const vars   = {
    primary:   { background:'var(--orange)',  color:'#fff', boxShadow:'0 4px 18px rgba(232,96,28,.35)' },
    secondary: { background:'var(--white)',   color:'var(--dark)', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' },
    danger:    { background:'var(--red)',     color:'#fff', boxShadow:'0 4px 18px rgba(200,41,31,.35)' },
    ghost:     { background:'transparent',   color:'var(--orange)' },
    sand:      { background:'var(--sand-light)', color:'var(--dark)' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
      borderRadius:'var(--r-md)', fontWeight:600, letterSpacing:'.02em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .55 : 1,
      width: fullWidth ? '100%' : undefined,
      transition:'all .2s', fontFamily:'var(--font-b)',
      ...sizes[size], ...vars[variant], ...style,
    }}>
      {children}
    </button>
  )
}

/* ── Card ────────────────────────────────────────────────────────────────── */
export function Card({ children, style={}, onClick, pad=16 }) {
  return (
    <div onClick={onClick} style={{
      background:'var(--white)', borderRadius:'var(--r-md)',
      boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)',
      padding: pad, overflow:'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition:'box-shadow .2s',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Badge ───────────────────────────────────────────────────────────────── */
export function Badge({ children, variant='default', style={} }) {
  const vars = {
    default: { background:'var(--orange-dim)', color:'var(--orange)' },
    danger:  { background:'var(--red-dim)',    color:'var(--red)' },
    success: { background:'var(--green-dim)',  color:'var(--green)' },
    info:    { background:'var(--blue-dim)',   color:'var(--blue)' },
    dark:    { background:'rgba(26,18,8,.82)', color:'#E8D5B0' },
    sand:    { background:'var(--sand-light)', color:'var(--sand-dark)' },
  }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'4px 10px', borderRadius:20,
      fontSize:10, fontWeight:700, letterSpacing:'.08em',
      ...vars[variant], ...style,
    }}>
      {children}
    </span>
  )
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */
export function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width:46, height:28, borderRadius:14, flexShrink:0,
      background: on ? 'var(--orange)' : '#D4C4B0',
      position:'relative', cursor:'pointer', transition:'background .3s',
    }}>
      <div style={{
        position:'absolute', top:3,
        left: on ? 21 : 3,
        width:22, height:22, background:'#fff', borderRadius:'50%',
        boxShadow:'0 1px 6px rgba(0,0,0,.2)', transition:'left .25s',
      }}/>
    </div>
  )
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
export function Spinner({ size=24, color='var(--orange)' }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      border:`2px solid ${color}25`,
      borderTop:`2px solid ${color}`,
      animation:'spin .7s linear infinite',
    }}/>
  )
}

/* ── Input ───────────────────────────────────────────────────────────────── */
export function Input({ label, icon, type='text', value, onChange, placeholder, error, style={} }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'var(--muted)', letterSpacing:'.06em' }}>{label}</label>}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        background:'var(--white)', borderRadius:'var(--r-sm)',
        border:`1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
        padding:'12px 14px',
      }}>
        {icon && <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ flex:1, fontSize:14, color:'var(--dark)', background:'transparent', '::placeholder':{ color:'var(--muted)' } }}
        />
      </div>
      {error && <span style={{ fontSize:11, color:'var(--red)' }}>{error}</span>}
    </div>
  )
}

/* ── Textarea ────────────────────────────────────────────────────────────── */
export function Textarea({ label, value, onChange, placeholder, rows=4, style={} }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && <label style={{ fontSize:12, fontWeight:600, color:'var(--muted)', letterSpacing:'.06em' }}>{label}</label>}
      <textarea
        value={value} onChange={onChange} placeholder={placeholder} rows={rows}
        style={{
          background:'var(--white)', borderRadius:'var(--r-sm)',
          border:'1.5px solid var(--border)', padding:'12px 14px',
          fontSize:14, color:'var(--dark)', resize:'none', lineHeight:1.6,
        }}
      />
    </div>
  )
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */
export function Avatar({ emoji='🧔', size=80, badge }) {
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background:'linear-gradient(135deg,#C4A882,#8B6840)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:size*.44, border:'3px solid #fff', boxShadow:'var(--shadow-md)',
      }}>{emoji}</div>
      {badge && (
        <div style={{
          position:'absolute', bottom:2, right:2,
          width:size*.3, height:size*.3, background:'var(--orange)',
          borderRadius:'50%', border:'2px solid #fff',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:size*.15,
        }}>{badge}</div>
      )}
    </div>
  )
}

/* ── Section Header ──────────────────────────────────────────────────────── */
export function SectionHeader({ icon, title, action, onAction, style={} }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', marginBottom:10, ...style }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:16, fontWeight:700, color:'var(--dark)' }}>
        {icon} {title}
      </div>
      {action && (
        <button onClick={onAction} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--orange)', fontSize:13, fontWeight:600 }}>
          {action}
        </button>
      )}
    </div>
  )
}

/* ── Progress Bar ────────────────────────────────────────────────────────── */
export function ProgressBar({ value, max=100, color='var(--orange)', height=8 }) {
  return (
    <div style={{ height, background:'var(--cream2)', borderRadius:height/2, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${Math.min(100,(value/max)*100)}%`, background:color, borderRadius:height/2, transition:'width .4s ease' }}/>
    </div>
  )
}

/* ── Divider ─────────────────────────────────────────────────────────────── */
export function Divider({ style={} }) {
  return <div style={{ height:1, background:'var(--border)', ...style }}/>
}

/* ── Empty State ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, color:'var(--dark)', marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--muted)' }}>{sub}</div>
    </div>
  )
}

/* ── Stat Card ───────────────────────────────────────────────────────────── */
export function StatCard({ icon, label, value, sub, accent, style={} }) {
  return (
    <Card style={style}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:'.1em', color:accent||'var(--muted)' }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:'var(--dark)', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{sub}</div>}
    </Card>
  )
}
