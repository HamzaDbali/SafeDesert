import React, { useState } from 'react'
import { authAPI } from '../../api'
import { Button, Card, Avatar, Badge, StatCard, Toggle, Spinner, Divider, Input } from '../ui'
import { useApp } from '../../context/AppContext'
import { useToggle } from '../../hooks'

export function ProfileHeader({ user }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 20px' }}>
      <Avatar emoji="🧔" size={88} badge="🛡️"/>
      <div style={{ fontSize:24, fontWeight:800, color:'var(--dark)', marginTop:12 }}>
        {user?.username || 'Navigator'}
      </div>
      <div style={{ color:'var(--orange)', fontSize:11, fontWeight:700, letterSpacing:'.1em', display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
        🧭 PRO NAVIGATOR
      </div>
      <div style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
        Member since October 2023
      </div>
    </div>
  )
}

export function ProfileActions({ user }) {
  const { showToast } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await authAPI.updateProfile(user.id, { username })
      showToast('Profile updated ✅', 'success')
      setEditing(false)
    } catch (err) {
      showToast(err?.response?.data?.message || 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div style={{ padding:'0 20px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        <Input label="USERNAME" icon="👤" value={username} onChange={e => setUsername(e.target.value)}/>
        <div style={{ display:'flex', gap:10 }}>
          <Button fullWidth onClick={handleSave} disabled={loading}>
            {loading ? <Spinner size={16} color="#fff"/> : 'Save'}
          </Button>
          <Button fullWidth variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', gap:10, padding:'0 20px 20px' }}>
      <Button fullWidth onClick={() => setEditing(true)} style={{ flex:1 }}>✏️ Edit Profile</Button>
      <Button variant="secondary" style={{ width:48, height:48, padding:0, borderRadius:'var(--r-sm)', flexShrink:0 }}>↗️</Button>
    </div>
  )
}

export function ProfileStats() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'0 20px 20px' }}>
      <StatCard icon="📥" label="OFFLINE MAPS" value="4 Regions" sub="1.2 GB Used"/>
      <StatCard icon="⚠️" label="ALERTS" value="12 Active" sub="Recent hazards" accent="var(--red)"/>
    </div>
  )
}

export function EmergencyCard() {
  return (
    <div style={{ margin:'0 20px 20px', background:'#FFF5F5', borderRadius:'var(--r-md)', border:'1px solid #FFCDD2', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #FFE0E0' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--orange)', letterSpacing:'.08em', marginBottom:4 }}>
            PRIMARY ICE CONTACT
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--dark)' }}>Layla Al-Sahara (Spouse)</div>
          <div style={{ fontSize:13, color:'var(--muted)' }}>+213 555-012-345</div>
        </div>
        <div style={{
          width:38, height:38, background:'var(--orange)', borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, cursor:'pointer',
        }}>📞</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', padding:'14px 16px', gap:20 }}>
        {[['BLOOD TYPE','O Positive'],['ALLERGIES','None']].map(([label,val]) => (
          <div key={label}>
            <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.08em', fontWeight:600 }}>{label}</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--dark)', marginTop:3 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SavedRegions() {
  const regions = [
    { name:'Grand Erg Oriental', sub:'Algeria • 450 MB',   status:'ready',  emoji:'🏜️' },
    { name:'Tassili Plateau',    sub:'South East • 320 MB', status:'update', emoji:'🗺️' },
  ]
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'0 20px 20px' }}>
      {regions.map(r => (
        <div key={r.name} style={{
          display:'flex', alignItems:'center', gap:12,
          background:'var(--white)', borderRadius:'var(--r-md)', padding:14,
          border:'1px solid var(--border)',
        }}>
          <div style={{ width:52, height:52, borderRadius:10, background:'var(--cream2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
            {r.emoji}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--dark)' }}>{r.name}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{r.sub}</div>
            <div style={{ fontSize:10, fontWeight:700, color:r.status==='ready'?'var(--green)':'var(--orange)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
              {r.status==='ready' ? '🟢 OFFLINE READY' : '🔄 UPDATE AVAILABLE'}
            </div>
          </div>
          <span style={{ fontSize:20, color:'var(--muted)' }}>{r.status==='ready' ? '⋮' : '⬇️'}</span>
        </div>
      ))}
    </div>
  )
}

export function SettingsPanel() {
  const { logout, navigate } = useApp()
  const [battery, toggleBattery] = useToggle(true)

  return (
    <div style={{ margin:'0 20px 20px', background:'var(--white)', borderRadius:'var(--r-md)', border:'1px solid var(--border)', overflow:'hidden' }}>
      {[
        { icon:'🔋', label:'Battery Saving Mode', right: <Toggle on={battery} onToggle={toggleBattery}/> },
        { icon:'📡', label:'GPS Accuracy Preference', right: <span style={{ fontSize:13, fontWeight:700, color:'var(--orange)' }}>HIGH</span> },
        { icon:'🚨', label:'Emergency SOS Settings', labelColor:'var(--red)', right: <span style={{ color:'var(--muted)' }}>›</span>, onClick:() => navigate('map') },
      ].map((row, i) => (
        <div key={i}>
          {i > 0 && <Divider/>}
          <div onClick={row.onClick} style={{
            display:'flex', alignItems:'center', gap:12, padding:'15px 16px',
            cursor:row.onClick ? 'pointer' : 'default',
          }}>
            <span style={{ fontSize:20 }}>{row.icon}</span>
            <div style={{ flex:1, fontSize:14, fontWeight:500, color:row.labelColor||'var(--dark)' }}>{row.label}</div>
            {row.right}
          </div>
        </div>
      ))}
      <Divider/>
      <div style={{ padding:'4px 16px 8px' }}>
        <Button fullWidth variant="ghost" onClick={logout} style={{ color:'var(--red)', padding:'12px' }}>
          Sign Out
        </Button>
      </div>
    </div>
  )
}
