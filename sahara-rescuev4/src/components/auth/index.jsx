import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Button, Input, Card, Spinner } from '../ui'
import { TopoBackground } from '../map'

export function LoginForm({ onSwitch }) {
  const { login, showToast } = useApp()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  const validate = () => {
    const e = {}
    if (!email)    e.email    = 'Email is required'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password)
      showToast('Welcome back! 🏜️', 'success')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position:'relative', minHeight:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <TopoBackground/>
      <div style={{ position:'relative', zIndex:5 }}>
        {/* Hero */}
        <div style={{ padding:'80px 24px 32px', textAlign:'center' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🏜️</div>
          <div style={{ fontFamily:'var(--font-d)', fontSize:42, color:'#fff', lineHeight:1, textShadow:'0 2px 16px rgba(0,0,0,.4)' }}>
            SAHARA<br/>RESCUE
          </div>
          <div style={{ color:'rgba(255,255,255,.7)', fontSize:13, marginTop:8, letterSpacing:'.05em' }}>
            Stay safe. Stay connected.
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background:'var(--cream)', borderRadius:'32px 32px 0 0',
          padding:'28px 24px 40px',
          boxShadow:'0 -8px 40px rgba(0,0,0,.15)',
        }}>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--dark)', marginBottom:20 }}>Sign In</div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Input label="EMAIL" icon="✉️" type="email"
              value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com" error={errors.email}/>
            <Input label="PASSWORD" icon="🔒" type="password"
              value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" error={errors.password}/>
          </div>

          <Button fullWidth onClick={handleSubmit} disabled={loading} style={{ marginTop:20, padding:'15px' }}>
            {loading ? <Spinner size={18} color="#fff"/> : 'Sign In →'}
          </Button>

          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)' }}>
            No account?{' '}
            <button onClick={onSwitch} style={{ background:'none', border:'none', color:'var(--orange)', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SignupForm({ onSwitch }) {
  const { signup, showToast } = useApp()
  const [form, setForm]     = useState({ username:'', email:'', password:'' })
  const [loading, setLoad]  = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.username) e.username = 'Username required'
    if (!form.email)    e.email    = 'Email required'
    if (!form.password || form.password.length < 6) e.password = 'Min 6 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoad(true)
    try {
      await signup(form)
      showToast('Account created! Please sign in.', 'success')
      onSwitch()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Signup failed', 'error')
    } finally {
      setLoad(false)
    }
  }

  return (
    <div style={{ position:'relative', minHeight:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <TopoBackground/>
      <div style={{ position:'relative', zIndex:5 }}>
        <div style={{ padding:'60px 24px 24px', textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:8 }}>🧭</div>
          <div style={{ fontFamily:'var(--font-d)', fontSize:38, color:'#fff', lineHeight:1, textShadow:'0 2px 16px rgba(0,0,0,.4)' }}>
            JOIN THE<br/>NETWORK
          </div>
        </div>
        <div style={{ background:'var(--cream)', borderRadius:'32px 32px 0 0', padding:'28px 24px 40px', boxShadow:'0 -8px 40px rgba(0,0,0,.15)' }}>
          <div style={{ fontSize:22, fontWeight:800, color:'var(--dark)', marginBottom:20 }}>Create Account</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Input label="USERNAME" icon="👤" value={form.username} onChange={set('username')} placeholder="desert_navigator" error={errors.username}/>
            <Input label="EMAIL"    icon="✉️" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" error={errors.email}/>
            <Input label="PASSWORD" icon="🔒" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" error={errors.password}/>
          </div>
          <Button fullWidth onClick={handleSubmit} disabled={loading} style={{ marginTop:20, padding:'15px' }}>
            {loading ? <Spinner size={18} color="#fff"/> : 'Create Account →'}
          </Button>
          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--muted)' }}>
            Already have an account?{' '}
            <button onClick={onSwitch} style={{ background:'none', border:'none', color:'var(--orange)', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
