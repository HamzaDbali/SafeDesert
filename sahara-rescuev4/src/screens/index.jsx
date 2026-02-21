import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useLiveCoords, useFetch } from '../hooks'
import { locationAPI, syncAPI } from '../api'
import { ScreenShell, TopBar } from '../components/layout'
import { Badge, Button, SectionHeader, Spinner, StatCard } from '../components/ui'
import { LeafletMap, TYPE_META } from '../components/map'
import { LoginForm, SignupForm } from '../components/auth'
import { ReportForm } from '../components/report'
import { SOSModal, ActiveSOSList } from '../components/sos'
import { SyncStatusCard, SyncProgress, SyncItemRow, SyncHistory, SyncNowButton } from '../components/sync'
import { ProfileHeader, ProfileActions, ProfileStats, EmergencyCard, SavedRegions, SettingsPanel } from '../components/profile'
import { VerifyButtons, VerificationCount } from '../components/verification'

// ── Auth ─────────────────────────────────────────────────────────────────────
export function AuthScreen() {
  const [mode, setMode] = useState('login')
  return mode === 'login'
    ? <LoginForm  onSwitch={() => setMode('signup')} />
    : <SignupForm onSwitch={() => setMode('login')} />
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'water',  icon: '💧', label: 'Water'  },
  { id: 'safe',   icon: '🛡️', label: 'Safe'   },
  { id: 'danger', icon: '⚠️', label: 'Danger' },
  { id: 'camp',   icon: '⛺', label: 'Camp'   },
  { id: 'food',   icon: '🍖', label: 'Food'   },
]

function makeDemoPins(lat, lng) {
  return [
    { _id:'d1', type:'water',  label:'WELL #4',       lat: lat - 0.006, lng: lng + 0.012, description: 'Potable groundwater, 14 m deep',      verifiedCount: 7  },
    { _id:'d2', type:'safe',   label:'SHELTER ALPHA', lat: lat + 0.008, lng: lng + 0.005, description: 'Emergency shelter — capacity 40 pax', verifiedCount: 3  },
    { _id:'d3', type:'danger', label:'SAND COLLAPSE', lat: lat + 0.003, lng: lng - 0.009, description: 'Unstable terrain — avoid after rain',  verifiedCount: 2  },
    { _id:'d4', type:'camp',   label:'BASE CAMP 7',   lat: lat - 0.011, lng: lng - 0.004, description: 'Rescue HQ — medical team on-site',     verifiedCount: 12 },
    { _id:'d5', type:'food',   label:'SUPPLY DROP',   lat: lat + 0.014, lng: lng + 0.008, description: 'UN airdrop — rations & water tabs',    verifiedCount: 1  },
    { _id:'d6', type:'water',  label:'OASIS SPRING',  lat: lat + 0.018, lng: lng - 0.014, description: 'Natural spring — tested safe',         verifiedCount: 5  },
    { _id:'d7', type:'safe',   label:'BUNKER B2',     lat: lat - 0.015, lng: lng + 0.018, description: 'Underground shelter, 80 capacity',     verifiedCount: 9  },
    { _id:'d8', type:'danger', label:'QUICKSAND',     lat: lat - 0.008, lng: lng - 0.016, description: 'Wet season quicksand — stay back',     verifiedCount: 4  },
  ]
}

// ── Map Screen ────────────────────────────────────────────────────────────────
export function MapScreen() {
  const { navigate } = useApp()
  const coords  = useLiveCoords()
  const mapCtrl = useRef({})

  // UI state
  const [sosOpen,      setSosOpen]      = useState(false)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState(null)
  const [pinDetail,    setPinDetail]    = useState(null)
  const [clickedCoord, setClickedCoord] = useState(null)
  const [showSearch,   setShowSearch]   = useState(false)

  // Data
  const { data } = useFetch(() => locationAPI.getAll())
  const rawPins  = React.useMemo(() => {
    const fromAPI = data?.locations || []
    return fromAPI.length
      ? fromAPI.map(l => ({ ...l, label: (l.type || 'point').toUpperCase() }))
      : makeDemoPins(coords.lat, coords.lng)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, coords.lat, coords.lng])

  // Filtered pins (search + type)
  const filtered = rawPins.filter(p => {
    const okType   = !typeFilter || p.type === typeFilter
    const q        = search.toLowerCase()
    const okSearch = !q || (p.label || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    return okType && okSearch
  })

  // ── Filter chip click: show all of that type, fly to first one ────────────
  const handleFilterClick = useCallback((id) => {
    const next = typeFilter === id ? null : id
    setTypeFilter(next)
    setPinDetail(null)
    setClickedCoord(null)
    setShowSearch(false)

    if (next) {
      // find first pin of that type and fly to it
      const match = rawPins.find(p => p.type === next)
      if (match && mapCtrl.current?.flyTo) {
        mapCtrl.current.flyTo(match.lat, match.lng, 15)
      }
    }
  }, [typeFilter, rawPins])

  // ── Search result click: fly to pin ───────────────────────────────────────
  const handleResultClick = useCallback((pin) => {
    mapCtrl.current?.flyTo?.(pin.lat, pin.lng, 16)
    setPinDetail(pin)
    setShowSearch(false)
  }, [])

  // ── Leaflet pin click ─────────────────────────────────────────────────────
  const handlePinClick = useCallback((pin) => {
    setPinDetail(pin)
    setClickedCoord(null)
    setShowSearch(false)
  }, [])

  // ── Map click ─────────────────────────────────────────────────────────────
  const handleMapClick = useCallback((c) => {
    setClickedCoord(c)
    setPinDetail(null)
    setShowSearch(false)
  }, [])

  const m = pinDetail ? (TYPE_META[pinDetail.type] || TYPE_META.safe) : null

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#0a0806' }}>

      {/* ── Full-screen map ─────────────────────────────────────────────── */}
      <LeafletMap
        coords={coords}
        pins={filtered}
        onPinClick={handlePinClick}
        onMapClick={handleMapClick}
        selectedCoords={clickedCoord}
        mapRef={mapCtrl}
      />

      {/* ── TOP HUD ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 500,
        padding: '44px 12px 10px',
        background: 'linear-gradient(to bottom, rgba(10,8,6,.92) 60%, rgba(10,8,6,0) 100%)',
        pointerEvents: 'none',
      }}>
        {/* Row 1: Coords + SOS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>

          {/* Coordinate pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(15,10,4,.9)', backdropFilter: 'blur(14px)',
            borderRadius: 24, padding: '7px 14px',
            border: '1px solid rgba(232,96,28,.22)',
            boxShadow: '0 4px 16px rgba(0,0,0,.4)',
            pointerEvents: 'auto',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: coords.online ? '#6BCB77' : '#E8601C',
              boxShadow: coords.online ? '0 0 8px #6BCB7799' : '0 0 8px #E8601C99',
              animation: 'pulse 2s ease-in-out infinite',
              display: 'inline-block',
            }} />
            <div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>
                {coords.lat}° N &nbsp; {coords.lng}° E
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.38)', marginTop: 1 }}>
                {coords.online
                  ? `GPS active${coords.accuracy ? ` ±${coords.accuracy}m` : ''}`
                  : 'Locating…'
                } · {coords.alt}m
              </div>
            </div>
          </div>

          {/* SOS */}
          <button onClick={() => setSosOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg,#D93426,#C8291F)',
            color: '#fff', border: 'none', borderRadius: 22,
            padding: '9px 20px', cursor: 'pointer', pointerEvents: 'auto',
            fontFamily: 'var(--font-d)', fontSize: 20, letterSpacing: '.1em',
            boxShadow: '0 4px 20px rgba(200,41,31,.6)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,.8)', animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
            SOS
          </button>
        </div>

        {/* Row 2: Search bar */}
        <div style={{ pointerEvents: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(14px)',
            borderRadius: 26, padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,.3)',
          }}>
            <span style={{ fontSize: 15, color: '#9E8060', flexShrink: 0 }}>🔍</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSearch(true) }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search wells, shelters, hazards…"
              style={{
                flex: 1, fontSize: 13, color: '#1A1208',
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'var(--font-b)',
              }}
            />
            {(search || typeFilter) && (
              <button
                onClick={() => { setSearch(''); setTypeFilter(null); setShowSearch(false) }}
                style={{ background: 'rgba(196,168,130,.25)', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, color: '#9A8060', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >✕</button>
            )}
            <button
              onClick={() => mapCtrl.current?.recenter?.()}
              style={{ flexShrink: 0, background: 'rgba(232,96,28,.12)', border: 'none', borderRadius: 18, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#E8601C', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap' }}
            >⊕ ME</button>
          </div>
        </div>
      </div>

      {/* ── Filter chips ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 162, left: 0, right: 0, zIndex: 500,
        display: 'flex', gap: 6, padding: '4px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => {
          const active = typeFilter === f.id
          const meta   = TYPE_META[f.id]
          const count  = rawPins.filter(p => p.type === f.id).length
          return (
            <button key={f.id} onClick={() => handleFilterClick(f.id)} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 22, fontSize: 11, fontWeight: 700,
              letterSpacing: '.04em', cursor: 'pointer', border: 'none',
              fontFamily: 'var(--font-b)', transition: 'all .18s',
              background: active ? meta.color : 'rgba(15,10,4,.82)',
              color:      active ? '#fff' : 'rgba(255,255,255,.65)',
              backdropFilter: 'blur(10px)',
              boxShadow:  active ? `0 3px 14px ${meta.color}70` : '0 2px 8px rgba(0,0,0,.3)',
              transform:  active ? 'scale(1.05)' : 'scale(1)',
            }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              {f.label.toUpperCase()}
              <span style={{
                background: active ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.1)',
                borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 800,
              }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Search results dropdown ────────────────────────────────────────── */}
      {showSearch && (search || typeFilter) && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 212, left: 12, right: 12, zIndex: 502,
          background: 'rgba(247,242,236,.98)', backdropFilter: 'blur(18px)',
          borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,.3)',
          border: '1px solid rgba(196,168,130,.25)', overflow: 'hidden',
          maxHeight: 260, overflowY: 'auto',
          animation: 'fadeUp .18s ease',
        }}>
          <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(196,168,130,.15)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: '#9A8060' }}>
              {filtered.length} LOCATION{filtered.length !== 1 ? 'S' : ''}
            </span>
            <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', fontSize: 15, color: '#9A8060', cursor: 'pointer', padding: 0 }}>✕</button>
          </div>
          {filtered.map(pin => {
            const pm = TYPE_META[pin.type] || TYPE_META.safe
            return (
              <div
                key={pin._id}
                onClick={() => handleResultClick(pin)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', borderTop: '1px solid rgba(196,168,130,.1)', transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,96,28,.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: pm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{pm.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1208' }}>{pin.label}</div>
                  <div style={{ fontSize: 11, color: '#9A8060', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pin.description}</div>
                </div>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-m)', color: '#C4A882', flexShrink: 0 }}>{pin.lat?.toFixed(3)}°</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Map-tap context card ──────────────────────────────────────────── */}
      {clickedCoord && !pinDetail && (
        <div style={{
          position: 'absolute', bottom: 88, left: 12, right: 12, zIndex: 501,
          background: 'rgba(247,242,236,.97)', backdropFilter: 'blur(16px)',
          borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 -2px 30px rgba(0,0,0,.2)',
          border: '1px solid rgba(196,168,130,.2)',
          animation: 'fadeUp .2s ease',
        }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#E8601C,#F4874A)' }} />
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: '#9A8060', marginBottom: 3, textTransform: 'uppercase' }}>Pinned Location</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 13, color: '#1A1208', fontWeight: 600 }}>
                  {clickedCoord.lat}° N &nbsp; {clickedCoord.lng}° E
                </div>
              </div>
              <button onClick={() => setClickedCoord(null)} style={{ background: 'rgba(196,168,130,.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: '#9A8060', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={() => navigate('report')} style={{ padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F4874A,#E8601C)', color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-b)', boxShadow: '0 4px 16px rgba(232,96,28,.4)' }}>
                ＋ Report Here
              </button>
              <button onClick={() => { mapCtrl.current?.flyTo?.(clickedCoord.lat, clickedCoord.lng, 17) }} style={{ padding: '11px', borderRadius: 12, border: '1px solid rgba(196,168,130,.3)', cursor: 'pointer', background: 'rgba(255,255,255,.7)', color: '#1A1208', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-b)' }}>
                🔍 Zoom In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pin detail bottom sheet ───────────────────────────────────────── */}
      {pinDetail && m && (
        <div style={{
          position: 'absolute', bottom: 80, left: 0, right: 0, zIndex: 501,
          animation: 'slideUp .25s cubic-bezier(.22,1,.36,1)',
        }}>
          <div style={{
            margin: '0 10px',
            background: 'rgba(247,242,236,.97)', backdropFilter: 'blur(16px)',
            borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 -4px 40px rgba(0,0,0,.25)',
            border: '1px solid rgba(196,168,130,.18)',
          }}>
            <div style={{ height: 4, background: m.color }} />
            <div style={{ padding: '14px 16px 16px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{m.icon}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#1A1208', lineHeight: 1.1 }}>{pinDetail.label}</div>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: '#9A8060', marginTop: 3 }}>
                      {pinDetail.lat?.toFixed(5)}° N · {pinDetail.lng?.toFixed(5)}° E
                    </div>
                  </div>
                </div>
                <button onClick={() => setPinDetail(null)} style={{ background: 'rgba(196,168,130,.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: '#9A8060', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
              </div>

              {pinDetail.description && (
                <p style={{ fontSize: 13, color: '#6A5540', margin: '0 0 10px', lineHeight: 1.5 }}>{pinDetail.description}</p>
              )}

              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: m.bg, color: m.color, letterSpacing: '.06em', textTransform: 'uppercase' }}>{pinDetail.type}</span>
                {pinDetail.verifiedCount > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(42,122,59,.12)', color: '#2A7A3B', letterSpacing: '.06em' }}>✓ VERIFIED ×{pinDetail.verifiedCount}</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => mapCtrl.current?.flyTo?.(pinDetail.lat, pinDetail.lng, 18)} style={{ padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F4874A,#E8601C)', color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-b)', boxShadow: '0 3px 12px rgba(232,96,28,.4)' }}>
                  📍 Go There
                </button>
                <button onClick={() => { navigate('report'); setPinDetail(null) }} style={{ padding: '11px', borderRadius: 12, border: '1px solid rgba(196,168,130,.3)', cursor: 'pointer', background: 'rgba(255,255,255,.7)', color: '#1A1208', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-b)' }}>
                  🚩 Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FABs: recenter + report ───────────────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 90, right: 12, zIndex: 501, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => mapCtrl.current?.recenter?.()}
          title="My Location"
          style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(15,10,4,.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(232,96,28,.25)', color: '#fff', fontSize: 19, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 16px rgba(0,0,0,.4)' }}
        >⊕</button>
        <button
          onClick={() => navigate('report')}
          title="Add Report"
          style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg,#F4874A,#E8601C)', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(232,96,28,.55)' }}
        >＋</button>
      </div>

      {sosOpen && <SOSModal onClose={() => setSosOpen(false)} />}
    </div>
  )
}

// ── Report Screen ──────────────────────────────────────────────────────────────
export function ReportScreen() {
  const { navigate } = useApp()
  return <ReportForm onClose={() => navigate('map')} />
}

// ── Sync Screen ────────────────────────────────────────────────────────────────
export function SyncScreen() {
  const { navigate, showToast } = useApp()
  const [syncing, setSyncing] = useState(false)
  const { data: lastSyncData } = useFetch(() => syncAPI.getLast())

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncAPI.log({ lastSyncClient: new Date().toISOString(), recordsSent: 5 })
      showToast('Sync complete! ✅', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Sync failed — offline', 'error')
    } finally {
      setTimeout(() => setSyncing(false), 2000)
    }
  }

  const lastSync = lastSyncData?.syncLog
    ? new Date(lastSyncData.syncLog.serverTime).toLocaleTimeString()
    : '2 hours ago'

  return (
    <ScreenShell>
      <TopBar title="Sync Status"
        left={<button onClick={() => navigate('map')} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--dark)' }}>‹</button>}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Badge variant="success">🛰️ SATELLITE ACTIVE</Badge>
      </div>
      <SyncStatusCard lastSync={lastSync} pending={5} />
      <SyncProgress running={syncing} />
      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { icon: '🧭', label: 'Waypoints',            status: 'done'                         },
          { icon: '⚠️', label: 'SOS Incident Reports', status: syncing ? 'syncing' : 'pending' },
          { icon: '🗺️', label: 'Offline Tile Updates', status: 'pending'                       },
        ].map(item => <SyncItemRow key={item.label} {...item} />)}
      </div>
      <SyncNowButton onSync={handleSync} loading={syncing} />
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Sync History</div>
        <SyncHistory />
      </div>
    </ScreenShell>
  )
}

// ── Profile Screen ─────────────────────────────────────────────────────────────
export function ProfileScreen() {
  const { user, navigate } = useApp()
  return (
    <ScreenShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '54px 20px 12px' }}>
        <div style={{ width: 36, height: 36, background: 'var(--white)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>⚙️</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)' }}>My Profile</div>
        <div style={{ position: 'relative', width: 36, height: 36, background: 'var(--white)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
          🔔
          <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: 'var(--orange)', borderRadius: '50%', border: '1.5px solid var(--cream)' }} />
        </div>
      </div>
      <ProfileHeader user={user} />
      <ProfileActions user={user} />
      <ProfileStats />
      <SectionHeader icon="🚨" title="Emergency Information" action="Manage" />
      <EmergencyCard />
      <SectionHeader icon="🗺️" title="Saved Map Regions" action="Add Region" />
      <SavedRegions />
      <div style={{ height: 1, background: 'var(--border)', margin: '4px 20px 16px' }} />
      <SettingsPanel />
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Active SOS Alerts</div>
        <ActiveSOSList />
      </div>
    </ScreenShell>
  )
}
