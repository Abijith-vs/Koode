import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setToken } from '../lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [department, setDepartment] = useState('')
  const [state, setState] = useState({ status: 'idle', message: '' })

  async function onSubmit(e) {
    e.preventDefault()
    setState({ status: 'submitting', message: '' })
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, department: role === 'doctor' ? department : '' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Sign up failed (${res.status})`)
      setToken(data.token)
      setState({ status: 'done', message: 'Account created.' })
      navigate('/patient-dashboard/')
    } catch (err) {
      setState({ status: 'error', message: err?.message ?? 'Sign up failed' })
    }
  }

  return (
    <div className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>Sign Up</h2>
        <p>Create an account to use the portal.</p>
      </div>

      <div style={{ maxWidth: 520, marginInline: 'auto' }}>
        <form onSubmit={onSubmit} className="glass-card" style={{ padding: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Name</div>
              <input
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                required
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </label>

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
                minLength={6}
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </label>

            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Role</div>
              <select
                value={role}
                onChange={(ev) => setRole(ev.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>

            {role === 'doctor' && (
              <label>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Department</div>
                <input
                  value={department}
                  onChange={(ev) => setDepartment(ev.target.value)}
                  required
                  placeholder="e.g., Cardiology"
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
                />
              </label>
            )}

            <button className="btn-primary" style={{ padding: '12px 18px' }} type="submit" disabled={state.status === 'submitting'}>
              {state.status === 'submitting' ? 'Creating…' : 'Create account'}
            </button>

            {state.status !== 'idle' && (
              <div style={{ textAlign: 'center', color: state.status === 'error' ? 'crimson' : 'inherit' }}>
                {state.message}
              </div>
            )}

            <div style={{ textAlign: 'center', opacity: 0.8 }}>
              Already have an account? <Link to="/login/">Log in</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

