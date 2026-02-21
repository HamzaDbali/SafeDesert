import React, { useState } from 'react'
import { syncAPI } from '../../api'
import { Button, Card, Badge, Spinner, ProgressBar, EmptyState } from '../ui'
import { useApp } from '../../context/AppContext'
import { useFetch, useSyncProgress } from '../../hooks'

export function SyncStatusCard({ lastSync, pending }) {
  return (
    <Card style={{ margin:'0 20px 16px', textAlign:'center', padding:24 }}>
      <div style={{
        width:72, height:72, background:'var(--orange-dim)', borderRadius:'50%',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:32, margin:'0 auto 14px',
      }}>🔄</div>
      <div style={{ fontSize:52, fontWeight:800, color:'var(--dark)', lineHeight:1 }}>{pending}</div>
      <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', marginTop:4 }}>
        PENDING REPORTS
      </div>
      <div style={{ height:1, background:'var(--border)', margin:'16px 0' }}/>
      <div style={{ fontSize:15, fontWeight:600, color:'var(--dark)' }}>Last Sync: {lastSync}</div>
      <div style={{ fontSize:13, color:'var(--muted)', marginTop:4, lineHeight:1.5 }}>
        Your safety reports are saved locally.<br/>Sync to alert emergency contacts.
      </div>
    </Card>
  )
}

export function SyncProgress({ running }) {
  const [progress] = useSyncProgress(65, running)
  return (
    <div style={{ padding:'0 20px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'flex', alignItems:'center', gap:6 }}>
          📦 Syncing Waypoints...
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--orange)' }}>{Math.round(progress)}%</div>
      </div>
      <ProgressBar value={progress}/>
      <div style={{ fontSize:10, color:'var(--muted)', letterSpacing:'.07em', fontWeight:600, textAlign:'center', marginTop:6 }}>
        DO NOT CLOSE THE APP DURING SYNC
      </div>
    </div>
  )
}

const STATUS_ICON = { done:'✅', syncing:'🔄', pending:'⏳' }
const STATUS_COLOR = { done:'var(--green)', syncing:'var(--orange)', pending:'var(--muted)' }

export function SyncItemRow({ icon, label, status }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      background:'var(--white)', borderRadius:'var(--r-md)',
      padding:'16px', border:'1px solid var(--border)',
    }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <div style={{ flex:1, fontSize:14, fontWeight:500, color:'var(--dark)' }}>{label}</div>
      <span style={{ fontSize:status==='done' ? 14 : 10, color:STATUS_COLOR[status] }}>
        {status === 'done'
          ? <div style={{ width:24, height:24, background:'var(--orange)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12 }}>✓</div>
          : status === 'syncing'
          ? <div style={{ width:10, height:10, background:'var(--orange)', borderRadius:'50%', animation:'pulse 1.2s infinite' }}/>
          : <span style={{ fontSize:18 }}>⏳</span>
        }
      </span>
    </div>
  )
}

export function SyncHistory() {
  const { data, loading } = useFetch(() => syncAPI.getMine())
  const list = data?.syncLogs || []

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:16 }}><Spinner/></div>
  if (!list.length) return <EmptyState icon="📊" title="No sync history" sub="Sync data to see history here"/>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 20px' }}>
      {list.map(log => (
        <div key={log._id} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'var(--white)', borderRadius:'var(--r-sm)', padding:'12px 14px',
          border:'1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--dark)' }}>Sync Log</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>{new Date(log.serverTime).toLocaleString()}</div>
          </div>
          <Badge variant="success">{log.recordsSent} records</Badge>
        </div>
      ))}
    </div>
  )
}

export function SyncNowButton({ onSync, loading }) {
  return (
    <div style={{ padding:'0 20px' }}>
      <Button fullWidth onClick={onSync} disabled={loading} style={{ padding:'16px', letterSpacing:'.05em' }}>
        {loading ? <Spinner size={18} color="#fff"/> : '🔄 SYNC DATA NOW'}
      </Button>
      <div style={{ textAlign:'center', fontSize:10, color:'var(--muted)', marginTop:8, letterSpacing:'.06em' }}>
        🔋 ENSURE DEVICE HAS &gt;20% BATTERY FOR FULL SYNC
      </div>
    </div>
  )
}
