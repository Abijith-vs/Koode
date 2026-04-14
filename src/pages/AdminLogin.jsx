import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setToken } from '../lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '' })

  async function onSubmit(e) {
    e.preventDefault()
    setState({ status: 'submitting', message: '' })
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`)
      setToken(data.token)
      setState({ status: 'done', message: 'Logged in as admin.' })
      navigate('/admin/organs/')
    } catch (err) {
      setState({ status: 'error', message: err?.message ?? 'Login failed' })
    }
  }

  return (
    <div className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>Admin Login</h2>
        <p>Manage OrganEase inventory.</p>
      </div>

      <div style={{ maxWidth: 520, marginInline: 'auto' }}>
        <form onSubmit={onSubmit} className="glass-card" style={{ padding: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Email</div>
              <input
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                type="email"
                required
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </label>

            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Password</div>
              <input
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                type="password"
                required
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </label>

            <button className="btn-primary" style={{ padding: '12px 18px' }} type="submit" disabled={state.status === 'submitting'}>
              {state.status === 'submitting' ? 'Logging in…' : 'Log In'}
            </button>

            {state.status !== 'idle' && (
              <div style={{ textAlign: 'center', color: state.status === 'error' ? 'crimson' : 'inherit' }}>{state.message}</div>
            )}

            <div style={{ textAlign: 'center', opacity: 0.8 }}>
              Back to <Link to="/organease/">OrganEase</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

