import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { PhoneFrame } from './components/layout'
import { AuthScreen, MapScreen, ReportScreen, SyncScreen, ProfileScreen } from './screens'

function AppInner() {
  const { screen } = useApp()

  if (screen === 'login' || screen === 'signup') return <AuthScreen />

  const screens = {
    map:     <MapScreen />,
    report:  <ReportScreen />,
    sync:    <SyncScreen />,
    profile: <ProfileScreen />,
  }
  return screens[screen] || <MapScreen />
}

function DesktopWrapper() {
  const { screen, navigate } = useApp()
  const isAuth = screen === 'login' || screen === 'signup'

  if (isAuth) {
    return (
      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#0D0805' }}>
        <PhoneFrame activeScreen={screen}><AppInner /></PhoneFrame>
      </div>
    )
  }

  return (
    <div style={{
      width:'100%', minHeight:'100%',
      display:'flex', alignItems:'center', justifyContent:'center',
      gap:48, padding:40,
      background:`
        radial-gradient(ellipse 55% 45% at 15% 50%, rgba(232,96,28,.1) 0%, transparent 60%),
        radial-gradient(ellipse 45% 55% at 85% 35%, rgba(196,168,130,.07) 0%, transparent 55%),
        #0D0805`,
    }}>
      {/* Sidebar nav */}
      <div style={{ display:'flex', flexDirection:'column', gap:4, paddingTop:60 }}>
        <div style={{ fontFamily:'var(--font-d)', fontSize:9, letterSpacing:'.2em', color:'#4A3820', marginBottom:8, padding:'0 8px' }}>SCREENS</div>
        {[
          { id:'map',     emoji:'🗺️', label:'Map'     },
          { id:'report',  emoji:'📋', label:'Report'  },
          { id:'sync',    emoji:'🔄', label:'Sync'    },
          { id:'profile', emoji:'👤', label:'Profile' },
        ].map(item => {
          const active = screen === item.id
          return (
            <button key={item.id} onClick={() => navigate(item.id)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
              borderRadius:12, cursor:'pointer', minWidth:152,
              background: active ? 'rgba(232,96,28,.14)' : 'transparent',
              border: active ? '1px solid rgba(232,96,28,.25)' : '1px solid transparent',
              color: active ? '#E8601C' : '#5C4A2A',
              fontSize:13, fontWeight:600, fontFamily:'var(--font-b)', transition:'all .18s',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#E8601C', opacity: active ? 1 : 0, transition:'opacity .2s', flexShrink:0 }} />
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Phone frame */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div style={{ fontFamily:'var(--font-d)', fontSize:10, letterSpacing:'.22em', color:'#4A3820' }}>SAHARARESQUE — PROTOTYPE</div>
        <PhoneFrame activeScreen={screen}><AppInner /></PhoneFrame>
        <div style={{ fontFamily:'var(--font-m)', fontSize:9, color:'#3A2A10', letterSpacing:'.05em' }}>Tap sidebar or bottom nav to switch</div>
      </div>
    </div>
  )
}

export default function App() {
  return <AppProvider><DesktopWrapper /></AppProvider>
}
