import React from 'react'
import { useApp } from '../../context/AppContext'

const NAV = [
  { id:'map',     svg:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', label:'Map'     },
  { id:'report',  svg:'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z', label:'Report'  },
  { id:'sync',    svg:'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z', label:'Sync'    },
  { id:'profile', svg:'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', label:'Profile' },
]

export function BottomNav({ active }) {
  const { navigate } = useApp()
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, height:68,
      background:'rgba(15,10,5,.95)', backdropFilter:'blur(20px)',
      borderTop:'1px solid rgba(196,168,130,.12)',
      display:'flex', zIndex:100,
    }}>
      {NAV.map(item => {
        const isActive = active === item.id
        return (
          <button key={item.id} onClick={() => navigate(item.id)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:4, background:'none', border:'none',
            cursor:'pointer', padding:'6px 0 14px', position:'relative',
            transition:'opacity .2s',
          }}>
            {/* Active pill */}
            {isActive && (
              <div style={{
                position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
                width:24, height:2.5, background:'#E8601C', borderRadius:'0 0 3px 3px',
              }}/>
            )}
            <svg viewBox="0 0 24 24" style={{ width:20, height:20, fill: isActive ? '#E8601C' : 'rgba(255,255,255,.35)', transition:'fill .2s' }}>
              <path d={item.svg}/>
            </svg>
            <span style={{
              fontSize:8.5, fontWeight:700, letterSpacing:'.09em', fontFamily:'var(--font-b)',
              color: isActive ? '#E8601C' : 'rgba(255,255,255,.3)',
              transition:'color .2s',
            }}>{item.label.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}

export function PhoneFrame({ children, activeScreen }) {
  return (
    <div style={{
      width:390, height:844, flexShrink:0,
      background:'#0A0604', borderRadius:56, padding:12,
      boxShadow:`
        0 0 0 1px #2A1A08, 0 0 0 4px #0D0805, 0 0 0 5px #1A0E04,
        0 60px 160px rgba(0,0,0,.95), 0 0 100px rgba(232,96,28,.06),
        inset 0 0 0 1px rgba(255,255,255,.03)`,
      position:'relative',
    }}>
      {/* Physical buttons */}
      {[{left:-3,top:128,height:36},{left:-3,top:180,height:36},{left:-3,top:230,height:28}].map((b,i) =>
        <div key={i} style={{ position:'absolute', left:b.left, top:b.top, width:3, height:b.height, background:'#1A0E04', borderRadius:'2px 0 0 2px' }}/>
      )}
      <div style={{ position:'absolute', right:-3, top:176, width:3, height:68, background:'#1A0E04', borderRadius:'0 2px 2px 0' }}/>

      <div style={{ width:'100%', height:'100%', borderRadius:44, overflow:'hidden', background:'#0a0806', position:'relative', display:'flex', flexDirection:'column' }}>
        {/* Dynamic Island */}
        <div style={{
          position:'absolute', top:10, left:'50%', transform:'translateX(-50%)',
          width:116, height:32, background:'#000', borderRadius:18, zIndex:200,
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        }}>
          <div style={{ width:9, height:9, background:'#0D0D0D', border:'1px solid #222', borderRadius:'50%' }}/>
          <div style={{ width:5, height:5, background:'#112211', borderRadius:'50%', boxShadow:'0 0 5px rgba(0,200,0,.25)' }}/>
        </div>

        {/* Content — map screen needs 0 padding, others need paddingBottom for nav */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none', paddingBottom:68 }}>
          {children}
        </div>
        <BottomNav active={activeScreen}/>
      </div>
    </div>
  )
}

export function ScreenShell({ children }) {
  return <div style={{ minHeight:'100%', background:'var(--cream)' }}>{children}</div>
}

export function TopBar({ title, left, right, transparent=false }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'54px 20px 12px',
      background: transparent ? 'transparent' : 'var(--cream)',
    }}>
      <div style={{ minWidth:44 }}>{left}</div>
      <div style={{ fontSize:17, fontWeight:700, color:'var(--dark)' }}>{title}</div>
      <div style={{ minWidth:44, display:'flex', justifyContent:'flex-end' }}>{right}</div>
    </div>
  )
}
