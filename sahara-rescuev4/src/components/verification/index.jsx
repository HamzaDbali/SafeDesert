import React, { useState } from 'react'
import { verificationAPI } from '../../api'
import { Button, Badge, Spinner } from '../ui'
import { useApp } from '../../context/AppContext'

export function VerifyButtons({ locationId, onUpdate }) {
  const { showToast } = useApp()
  const [loading, setLoading] = useState(null)

  const handleVerify = async (status) => {
    setLoading(status)
    try {
      await verificationAPI.add(locationId, status)
      showToast(status === 'confirm' ? '✅ Location confirmed!' : '❌ Location denied', 'success')
      onUpdate?.()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Verification failed', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display:'flex', gap:8 }}>
      <Button size="sm" variant="secondary" onClick={() => handleVerify('confirm')} disabled={!!loading}
        style={{ flex:1, color:'var(--green)', borderColor:'var(--green)' }}>
        {loading==='confirm' ? <Spinner size={14}/> : '✅ Confirm'}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => handleVerify('deny')} disabled={!!loading}
        style={{ flex:1, color:'var(--red)', borderColor:'var(--red)' }}>
        {loading==='deny' ? <Spinner size={14}/> : '❌ Deny'}
      </Button>
    </div>
  )
}

export function VerificationCount({ count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <span style={{ fontSize:13 }}>✅</span>
      <span style={{ fontSize:12, fontWeight:600, color:'var(--green)' }}>{count} verified</span>
    </div>
  )
}
