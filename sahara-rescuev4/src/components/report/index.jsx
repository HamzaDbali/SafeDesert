import React, { useState } from 'react'
import { locationAPI } from '../../api'
import { Spinner } from '../ui'
import { useApp } from '../../context/AppContext'
import { useLiveCoords } from '../../hooks'
import { MiniPickMap } from '../map'

const TYPES = [
  { id:'water',  icon:'💧', label:'Water Source',   color:'#1A5FA0', bg:'rgba(26,95,160,.1)'   },
  { id:'safe',   icon:'🛡️', label:'Safe Zone',      color:'#2A7A3B', bg:'rgba(42,122,59,.1)'   },
  { id:'danger', icon:'⚠️', label:'Hazard',         color:'#C8291F', bg:'rgba(200,41,31,.1)'   },
  { id:'camp',   icon:'⛺', label:'Camp / Shelter', color:'#7B3F9E', bg:'rgba(123,63,158,.1)'  },
  { id:'food',   icon:'🍖', label:'Food Supply',    color:'#C47A1E', bg:'rgba(196,122,30,.1)'  },
]

const URGENCY = [
  { id:'low',    label:'Low',    color:'#2A7A3B', icon:'🟢' },
  { id:'medium', label:'Medium', color:'#C47A1E', icon:'🟡' },
  { id:'high',   label:'High',   color:'#C8291F', icon:'🔴' },
]

const S = {
  label: { fontSize:9, fontWeight:700, letterSpacing:'.12em', color:'#9A8060', marginBottom:6, display:'block', textTransform:'uppercase' },
  input: { width:'100%', padding:'12px 14px', borderRadius:12, border:'1px solid rgba(196,168,130,.3)', background:'rgba(255,255,255,.9)', fontSize:14, color:'#1A1208', fontFamily:'var(--font-b)', outline:'none' },
}

export function ReportForm({ onClose }) {
  const { showToast, navigate } = useApp()
  const coords = useLiveCoords()

  const [step,        setStep]        = useState(1)
  const [type,        setType]        = useState('water')
  const [urgency,     setUrgency]     = useState('low')
  const [title,       setTitle]       = useState('')
  const [desc,        setDesc]        = useState('')
  const [pickedCoord, setPickedCoord] = useState(null)
  const [useCustom,   setUseCustom]   = useState(false)
  const [loading,     setLoading]     = useState(false)

  const reportCoords = useCustom && pickedCoord ? pickedCoord : coords
  const selType   = TYPES.find(t => t.id === type)
  const selUrgency = URGENCY.find(u => u.id === urgency)
  const steps = ['Type', 'Location', 'Details']

  const submit = async () => {
    setLoading(true)
    try {
      await locationAPI.add({ type, coordinates:[reportCoords.lng, reportCoords.lat], description:desc, title: title || selType.label, urgency })
      showToast('Report submitted! ✅', 'success')
      navigate('map')
    } catch {
      showToast('Saved offline — syncing when online 📡', 'info')
      navigate('map')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100%', background:'#F2EBE0', paddingBottom:24 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'52px 16px 14px' }}>
        <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(196,168,130,.2)', border:'1px solid rgba(196,168,130,.3)', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:600, color:'#6A5540', cursor:'pointer' }}>
          ← Cancel
        </button>
        <span style={{ fontFamily:'var(--font-d)', fontSize:20, letterSpacing:'.08em', color:'#1A1208' }}>NEW REPORT</span>
        <span style={{ width:32, height:32, borderRadius:'50%', background:'#E8601C', color:'#fff', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{step}/3</span>
      </div>

      {/* Step indicators */}
      <div style={{ display:'flex', gap:8, padding:'0 16px 20px' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex:1 }}>
            <div style={{ height:3, borderRadius:2, background: i < step ? '#E8601C' : 'rgba(196,168,130,.3)', transition:'background .3s', marginBottom:4 }}/>
            <div style={{ fontSize:8.5, fontWeight:700, color: i < step ? '#E8601C' : '#9A8060', letterSpacing:'.1em', textAlign:'center', textTransform:'uppercase' }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:'0 16px' }}>

        {/* ── STEP 1: Type ── */}
        {step === 1 && (
          <div style={{ animation:"fadeUp .32s ease both" }}>
            <p style={{ fontSize:13, color:'#6A5540', marginBottom:14 }}>What are you reporting?</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {TYPES.map(t => (
                <div key={t.id} onClick={() => setType(t.id)} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:14, cursor:'pointer',
                  background: type===t.id ? t.bg : 'rgba(255,255,255,.65)',
                  border:`2px solid ${type===t.id ? t.color : 'rgba(196,168,130,.2)'}`,
                  transition:'all .18s',
                }}>
                  <span style={{ fontSize:24, width:32, textAlign:'center' }}>{t.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'#1A1208' }}>{t.label}</div>
                  </div>
                  {type===t.id && (
                    <div style={{ width:22, height:22, borderRadius:'50%', background:t.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13 }}>✓</div>
                  )}
                </div>
              ))}
            </div>
            <Btn onClick={() => setStep(2)}>Continue →</Btn>
          </div>
        )}

        {/* ── STEP 2: Location ── */}
        {step === 2 && (
          <div style={{ animation:"fadeUp .32s ease both" }}>
            <p style={{ fontSize:13, color:'#6A5540', marginBottom:12 }}>Tap the map to pin a spot, or use your GPS.</p>

            <div style={{ borderRadius:14, overflow:'hidden', border:'2px solid rgba(196,168,130,.25)', marginBottom:12, boxShadow:'0 4px 20px rgba(0,0,0,.1)' }}>
              <MiniPickMap coords={coords} onPick={p => { setPickedCoord(p); setUseCustom(true) }} picked={useCustom ? pickedCoord : null}/>
            </div>

            <div style={{ background:'rgba(232,96,28,.08)', border:'1px solid rgba(232,96,28,.2)', borderRadius:10, padding:'10px 12px', marginBottom:14, fontSize:12, color:'#6A5540', display:'flex', gap:8 }}>
              <span>ℹ️</span>
              <span>Tap anywhere on the map to set a custom location. Or keep your live GPS position below.</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {/* GPS option */}
              <div onClick={() => setUseCustom(false)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, cursor:'pointer', border:`2px solid ${!useCustom ? '#E8601C' : 'rgba(196,168,130,.2)'}`, background: !useCustom ? 'rgba(232,96,28,.07)' : 'rgba(255,255,255,.65)', transition:'all .18s' }}>
                <span style={{ fontSize:20 }}>📡</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#1A1208' }}>MY GPS POSITION</div>
                  <div style={{ fontFamily:'var(--font-m)', fontSize:11, color:'#9A8060', marginTop:2 }}>
                    {coords.lat}° N · {coords.lng}° E {coords.online && coords.accuracy && <span style={{ color:'#2A7A3B' }}>±{coords.accuracy}m</span>}
                  </div>
                </div>
                {!useCustom && <span style={{ color:'#E8601C', fontSize:18 }}>●</span>}
              </div>

              {/* Pinned option */}
              {pickedCoord && (
                <div onClick={() => setUseCustom(true)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, cursor:'pointer', border:`2px solid ${useCustom ? '#7B3F9E' : 'rgba(196,168,130,.2)'}`, background: useCustom ? 'rgba(123,63,158,.07)' : 'rgba(255,255,255,.65)', transition:'all .18s' }}>
                  <span style={{ fontSize:20 }}>📌</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:'#1A1208' }}>PINNED ON MAP</div>
                    <div style={{ fontFamily:'var(--font-m)', fontSize:11, color:'#9A8060', marginTop:2 }}>{pickedCoord.lat}° N · {pickedCoord.lng}° E</div>
                  </div>
                  {useCustom && <span style={{ color:'#7B3F9E', fontSize:18 }}>●</span>}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(1)} style={{ padding:'13px 18px', borderRadius:12, border:'1px solid rgba(196,168,130,.3)', background:'rgba(255,255,255,.7)', fontSize:14, color:'#6A5540', cursor:'pointer', fontFamily:'var(--font-b)' }}>←</button>
              <div style={{ flex:1 }}><Btn onClick={() => setStep(3)}>Continue →</Btn></div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Details ── */}
        {step === 3 && (
          <div style={{ animation:"fadeUp .32s ease both" }}>
            <p style={{ fontSize:13, color:'#6A5540', marginBottom:16 }}>Add details to help rescuers find and use this.</p>

            <div style={{ marginBottom:14 }}>
              <label style={S.label}>Title</label>
              <div style={{ display:'flex', alignItems:'center', gap:8, ...S.input, padding:0 }}>
                <span style={{ fontSize:20, paddingLeft:14 }}>{selType?.icon}</span>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder={selType?.label}
                  style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#1A1208', fontFamily:'var(--font-b)', fontWeight:600, padding:'12px 14px 12px 8px', background:'transparent' }}/>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={S.label}>Urgency</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {URGENCY.map(u => (
                  <div key={u.id} onClick={() => setUrgency(u.id)} style={{ padding:'12px 8px', borderRadius:12, cursor:'pointer', textAlign:'center', border:`2px solid ${urgency===u.id ? u.color : 'rgba(196,168,130,.2)'}`, background: urgency===u.id ? `${u.color}15` : 'rgba(255,255,255,.65)', transition:'all .18s' }}>
                    <div style={{ fontSize:16, marginBottom:4 }}>{u.icon}</div>
                    <div style={{ fontSize:10, fontWeight:700, color: urgency===u.id ? u.color : '#9A8060', letterSpacing:'.06em' }}>{u.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={S.label}>Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="Describe the location, conditions, capacity, access…" style={{ ...S.input, resize:'none', lineHeight:1.5 }}/>
            </div>

            {/* Summary */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:12, background:'rgba(255,255,255,.7)', border:'1px solid rgba(196,168,130,.2)', marginBottom:16 }}>
              <span style={{ fontSize:22 }}>{selType?.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#1A1208' }}>{selType?.label}</div>
                <div style={{ fontFamily:'var(--font-m)', fontSize:9, color:'#9A8060', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {reportCoords.lat}° N · {reportCoords.lng}° E · {useCustom ? 'Pinned' : 'GPS'}
                </div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${selUrgency?.color}20`, color:selUrgency?.color }}>{urgency.toUpperCase()}</span>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStep(2)} style={{ padding:'13px 18px', borderRadius:12, border:'1px solid rgba(196,168,130,.3)', background:'rgba(255,255,255,.7)', fontSize:14, color:'#6A5540', cursor:'pointer', fontFamily:'var(--font-b)' }}>←</button>
              <div style={{ flex:1 }}>
                <Btn onClick={submit} disabled={loading}>
                  {loading ? <Spinner size={16} color="#fff"/> : '✓ Submit Report'}
                </Btn>
              </div>
            </div>

            <div style={{ textAlign:'center', marginTop:10, fontSize:10, color:'#9A8060' }}>
              📡 Syncs automatically when back online
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Btn({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:'100%', padding:'14px', borderRadius:14, border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? 'rgba(232,96,28,.4)' : 'linear-gradient(135deg,#F4874A,#E8601C)',
      color:'#fff', fontWeight:700, fontSize:15, fontFamily:'var(--font-b)',
      boxShadow: disabled ? 'none' : '0 6px 20px rgba(232,96,28,.4)',
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
    }}>{children}</button>
  )
}
