import React, { useState } from 'react'
import { sosAPI } from '../../api'
import { Button, Card, Badge, Spinner, EmptyState, Divider } from '../ui'
import { useApp } from '../../context/AppContext'
import { useFetch, useLiveCoords } from '../../hooks'

export function SOSModal({ onClose }) {
  const { showToast } = useApp()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const coords = useLiveCoords()

  const handleSend = async () => {
    setLoading(true)
    try {
      await sosAPI.send({
        coordinates: [coords.lng, coords.lat],
        message,
      })
      setSent(true)
      showToast('🚨 SOS Sent! Help is on the way.', 'info')
    } catch (err) {
      showToast(err?.response?.data?.message || 'SOS failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={{
        position:'absolute', inset:0, background:'rgba(200,41,31,.95)', zIndex:200,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:24, animation:'fadeIn .3s ease',
      }}>
        <div style={{ fontSize:80, marginBottom:20, animation:'pulse 1.5s infinite' }}>🚨</div>
        <div style={{ fontFamily:'var(--font-d)', fontSize:44, color:'#fff', letterSpacing:'.05em', marginBottom:8 }}>SOS ACTIVE</div>
        <div style={{ color:'rgba(255,255,255,.8)', fontSize:14, textAlign:'center', marginBottom:32 }}>
          Emergency services have been notified.<br/>Your location is being shared.
        </div>
        <div style={{ fontFamily:'var(--font-m)', color:'rgba(255,255,255,.7)', fontSize:12 }}>
          {coords.lat}° N, {coords.lng}° E
        </div>
        <Button variant="secondary" onClick={onClose} style={{ marginTop:40, borderRadius:30 }}>
          Close
        </Button>
      </div>
    )
  }

  return (
    <div style={{
      position:'absolute', inset:0, background:'rgba(0,0,0,.6)', zIndex:200,
      display:'flex', alignItems:'flex-end', animation:'fadeIn .2s ease',
    }}>
      <div style={{
        width:'100%', background:'var(--white)',
        borderRadius:'28px 28px 0 0', padding:'24px 24px 40px',
        animation:'slideUp .3s ease',
      }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 20px' }}/>
          <div style={{ fontFamily:'var(--font-d)', fontSize:36, color:'var(--red)', letterSpacing:'.05em' }}>
            SEND SOS ALERT
          </div>
          <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>
            This will alert all nearby users and emergency contacts
          </div>
        </div>

        <div style={{
          background:'var(--red-dim)', border:'1px solid var(--red)', borderRadius:'var(--r-md)',
          padding:14, marginBottom:16,
        }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--red)', letterSpacing:'.08em', marginBottom:4 }}>YOUR LOCATION</div>
          <div style={{ fontFamily:'var(--font-m)', fontSize:13, color:'var(--dark)' }}>
            {coords.lat}° N, {coords.lng}° E • {coords.alt}m Alt.
          </div>
        </div>

        <textarea
          value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Optional: describe your emergency..."
          rows={3}
          style={{
            width:'100%', background:'var(--cream)', borderRadius:'var(--r-sm)',
            border:'1.5px solid var(--border)', padding:'12px 14px',
            fontSize:14, color:'var(--dark)', resize:'none', marginBottom:16,
            fontFamily:'var(--font-b)',
          }}
        />

        <Button fullWidth variant="danger" onClick={handleSend} disabled={loading} style={{ padding:'16px' }}>
          {loading ? <Spinner size={18} color="#fff"/> : '🚨 SEND SOS ALERT'}
        </Button>
        <Button fullWidth variant="ghost" onClick={onClose} style={{ marginTop:8 }}>Cancel</Button>
      </div>
    </div>
  )
}

export function ActiveSOSList() {
  const { data, loading, error, refetch } = useFetch(() => sosAPI.getActive())

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:24 }}><Spinner/></div>
  if (error)   return <EmptyState icon="⚠️" title="Failed to load" sub={error}/>

  const list = data?.sos || []
  if (!list.length) return <EmptyState icon="✅" title="No active SOS" sub="All clear in your area"/>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'0 20px' }}>
      {list.map(s => (
        <SOSCard key={s._id} sos={s} onRefetch={refetch}/>
      ))}
    </div>
  )
}

export function SOSCard({ sos, onRefetch }) {
  const { showToast, user } = useApp()
  const [loading, setLoading] = useState(false)
  const isOwner = user?.id === sos.userId?._id || user?.id === sos.userId

  const handleResolve = async () => {
    setLoading(true)
    try {
      await sosAPI.resolve(sos._id)
      showToast('SOS resolved ✅', 'success')
      onRefetch()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={{ borderLeft:'4px solid var(--red)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14, color:'var(--dark)' }}>
            🚨 {sos.userId?.username || 'Unknown'}
          </div>
          <div style={{ fontFamily:'var(--font-m)', fontSize:11, color:'var(--muted)', marginTop:2 }}>
            {sos.coordinates?.coordinates?.[1]}° N, {sos.coordinates?.coordinates?.[0]}° E
          </div>
        </div>
        <Badge variant="danger">{sos.status.toUpperCase()}</Badge>
      </div>
      {sos.message && (
        <div style={{ fontSize:13, color:'var(--dark)', background:'var(--cream)', borderRadius:'var(--r-sm)', padding:'8px 10px', marginBottom:8 }}>
          "{sos.message}"
        </div>
      )}
      <div style={{ fontSize:11, color:'var(--muted)' }}>
        {new Date(sos.createdAt).toLocaleString()}
      </div>
      {isOwner && sos.status === 'active' && (
        <Button size="sm" variant="secondary" onClick={handleResolve} disabled={loading} style={{ marginTop:10 }}>
          {loading ? <Spinner size={14}/> : '✅ Mark Resolved'}
        </Button>
      )}
    </Card>
  )
}

export function MySOSHistory() {
  const { data, loading } = useFetch(() => sosAPI.getMine())
  const list = data?.sos || []

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:16 }}><Spinner/></div>
  if (!list.length) return <EmptyState icon="📭" title="No SOS history" sub="You haven't sent any SOS alerts"/>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 20px' }}>
      {list.map(s => (
        <div key={s._id} style={{
          display:'flex', alignItems:'center', gap:12,
          background:'var(--white)', borderRadius:'var(--r-sm)', padding:'12px 14px',
          border:'1px solid var(--border)',
        }}>
          <span style={{ fontSize:20 }}>{s.status==='resolved' ? '✅' : '🚨'}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--dark)' }}>
              {s.status==='resolved' ? 'Resolved' : 'Active SOS'}
            </div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</div>
          </div>
          <Badge variant={s.status==='resolved' ? 'success' : 'danger'}>{s.status}</Badge>
        </div>
      ))}
    </div>
  )
}
