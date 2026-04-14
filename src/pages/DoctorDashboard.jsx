import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', error: '' })
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [diagnosisInputs, setDiagnosisInputs] = useState({})
  const [followUpInputs, setFollowUpInputs] = useState({})

  useEffect(() => {
    const token = getToken()
    if (!token) {
      navigate('/login/')
      return
    }

    let cancelled = false
    async function load() {
      setState({ status: 'loading', error: '' })
      try {
        const meRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { authorization: `Bearer ${token}` },
        })
        const meData = await meRes.json().catch(() => ({}))
        if (!meRes.ok) throw new Error(meData.error || `Failed to load profile (${meRes.status})`)

        if (meData?.user?.role !== 'doctor') {
          if (meData?.user?.role === 'patient') navigate('/patient-dashboard/')
          else if (meData?.user?.role === 'admin') navigate('/admin/organs/')
          else navigate('/')
          return
        }

        const aptRes = await fetch(`${API_BASE}/api/appointments/me`, {
          headers: { authorization: `Bearer ${token}` },
        })
        const aptData = await aptRes.json().catch(() => ({}))
        if (!aptRes.ok) throw new Error(aptData.error || `Failed to load appointments (${aptRes.status})`)

        if (cancelled) return
        setUser(meData.user)
        setAppointments(aptData.appointments ?? [])
        setState({ status: 'ready', error: '' })
      } catch (e) {
        clearToken()
        if (!cancelled) setState({ status: 'error', error: e?.message ?? 'Failed to load portal' })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [navigate])

  function logout() {
    clearToken()
    navigate('/login/')
  }

  async function handleStatusUpdate(aptId, status) {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(aptId)}/status`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`)
      
      setAppointments(prev => prev.map(a => a.id === aptId ? data.appointment : a))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDiagnosisUpdate(aptId) {
    setState({ ...state, status: 'loading' })
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(aptId)}/diagnosis`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ 
          diagnosis: diagnosisInputs[aptId] || '',
          followUpDate: followUpInputs[aptId] || null
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`)
      
      setAppointments(prev => {
        let updated = prev.map(a => a.id === aptId ? data.appointment : a)
        if (data.newAppointment) {
          updated = [data.newAppointment, ...updated]
        }
        return updated
      })
    } catch (err) {
      alert(err.message)
    } finally {
      setState({ ...state, status: 'ready' })
    }
  }

  return (
    <div className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>Doctor Portal</h2>
        <p>View appointment requests from patients.</p>
      </div>

      {state.status === 'loading' ? (
        <div style={{ textAlign: 'center', padding: 24 }}>Loading…</div>
      ) : state.status === 'error' ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ color: 'crimson', marginBottom: 12 }}>{state.error || 'Session expired. Please log in again.'}</div>
          <Link className="btn-primary" to="/login/" style={{ padding: '12px 18px' }}>
            Go to Login
          </Link>
        </div>
      ) : (
        <div style={{ maxWidth: 980, marginInline: 'auto' }}>
          <div className="glass-card" style={{ textAlign: 'left', marginBottom: 18 }}>
            <h3 className="card-title">Profile</h3>
            <p className="card-desc">
              <strong>Name:</strong> {user?.name}
              <br />
              <strong>Email:</strong> {user?.email}
              <br />
              <strong>Department:</strong> {user?.department || '—'}
            </p>
            <button className="btn-outline" onClick={logout} style={{ marginTop: 10, padding: '10px 14px' }}>
              Log out
            </button>
          </div>

          <div className="section-header" style={{ marginTop: 0 }}>
            <h2 style={{ fontSize: '1.6rem' }}>Appointment requests</h2>
            <p>Latest requests appear first.</p>
          </div>

          {appointments.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center' }}>
              No appointment requests yet.
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {appointments.map((a) => (
                <div key={a.id} className="glass-card" style={{ textAlign: 'left' }}>
                  <h3 className="card-title">{a.patient?.name || 'Patient'}</h3>
                  <p className="card-desc" style={{ marginBottom: 10 }}>
                    <strong>Email:</strong> {a.patient?.email || '—'}
                    <br />
                    <strong>Date & time:</strong> {a.datetime}
                    <br />
                    <strong>Status:</strong> <span style={{ color: a.status === 'accepted' ? '#4ade80' : a.status === 'rejected' ? '#f87171' : 'var(--hs-muted)' }}>{a.status}</span>
                    <br />
                    <strong>Reason:</strong> {a.reason || '—'}
                  </p>
                  
                  {a.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 15, marginBottom: 15 }}>
                      <button 
                        className="btn-outline" 
                        style={{ padding: '8px 14px', borderColor: 'rgba(74, 222, 128, 0.5)', color: '#4ade80' }}
                        disabled={state.status === 'loading'}
                        onClick={() => handleStatusUpdate(a.id, 'accepted')}
                      >
                        Accept
                      </button>
                      <button 
                        className="btn-outline" 
                        style={{ padding: '8px 14px', borderColor: 'rgba(248, 113, 113, 0.5)', color: '#f87171' }}
                        disabled={state.status === 'loading'}
                        onClick={() => handleStatusUpdate(a.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {a.status === 'accepted' && (
                    <div style={{ marginTop: 15, marginBottom: 15 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.9rem', color: 'var(--hs-primary)' }}>Diagnosis & Prescription</div>
                      {a.diagnosis ? (
                        <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                          {a.diagnosis}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            rows={3}
                            placeholder="Write the diagnosis and prescription plan here..."
                            value={diagnosisInputs[a.id] || ''}
                            onChange={(e) => setDiagnosisInputs(prev => ({ ...prev, [a.id]: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', resize: 'vertical' }}
                          />
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--hs-muted)' }}>Follow-up Date & Time (Optional)</label>
                            <input
                              type="datetime-local"
                              value={followUpInputs[a.id] || ''}
                              onChange={(e) => setFollowUpInputs(prev => ({ ...prev, [a.id]: e.target.value }))}
                              style={{ width: '100%', maxWidth: '300px', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                            />
                          </div>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '8px 16px', marginTop: 15, fontSize: '0.9rem' }}
                            disabled={state.status === 'loading' || !diagnosisInputs[a.id]}
                            onClick={() => handleDiagnosisUpdate(a.id)}
                          >
                            {followUpInputs[a.id] ? "Save Diagnosis & Schedule Follow-up" : "Save Diagnosis"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 12, opacity: 0.75 }}>{a.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

