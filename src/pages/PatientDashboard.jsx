import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export default function PatientDashboard() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', error: '' })
  const [user, setUser] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [groupedAppointments, setGroupedAppointments] = useState({})

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
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `Failed to load profile (${res.status})`)
        if (cancelled) return
        if (data?.user?.role && data.user.role !== 'patient') {
          if (data.user.role === 'doctor') navigate('/doctor-dashboard/')
          else if (data.user.role === 'admin') navigate('/admin/organs/')
          else navigate('/')
          return
        }
        
        const aptRes = await fetch(`${API_BASE}/api/appointments/me`, {
          headers: { authorization: `Bearer ${token}` }
        })
        const aptData = await aptRes.json().catch(() => ({}))
        if (!aptRes.ok) throw new Error(aptData.error || `Failed to load appointments`)

        setUser(data.user)
        setAppointments(aptData.appointments ?? [])
        
        // Group appointments by doctor
        const groups = {}
        for (const a of (aptData.appointments ?? [])) {
          const docId = a.doctorId
          if (!groups[docId]) {
            groups[docId] = {
              doctor: a.doctor,
              patient: a.patient,
              visits: []
            }
          }
          groups[docId].visits.push({
            id: a.id,
            datetime: a.datetime,
            status: a.status,
            reason: a.reason,
            diagnosis: a.diagnosis
          })
        }
        // Sort visits chronologically
        Object.values(groups).forEach(g => {
          g.visits.sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
        })
        
        setGroupedAppointments(groups)
        setState({ status: 'ready', error: '' })
      } catch (e) {
        clearToken()
        if (!cancelled) {
          setState({ status: 'error', error: e?.message ?? 'Failed to load profile' })
        }
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

  function exportPDF(record) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return alert('Please allow popups to download the PDF.')
    
    const visitsHtml = record.visits.map(v => `
      <div class="visit">
        <div class="visit-header">Visit Date: ${new Date(v.datetime).toLocaleString()} | Status: ${v.status}</div>
        <div class="label">Chief Complaint</div>
        <div class="value">${v.reason || 'Not specified'}</div>
        ${v.diagnosis ? `
          <div class="label" style="margin-top: 10px;">Diagnosis & Medical Plan</div>
          <div class="diagnosis-box">${v.diagnosis}</div>
        ` : `
          <div class="value" style="margin-top: 10px; font-style: italic;">No diagnosis written yet.</div>
        `}
      </div>
    `).join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>Unified Medical Record - Dr. ${record.doctor?.name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; }
            h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .label { font-weight: bold; color: #6b7280; font-size: 0.9em; text-transform: uppercase; }
            .value { font-size: 1.1em; margin-top: 4px; }
            .visit { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px; page-break-inside: avoid; }
            .visit-header { font-weight: bold; font-size: 1.1em; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #e5e7eb; color: #111827; }
            .diagnosis-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-family: monospace; font-size: 1.05em; margin-top: 5px; }
            .footer { margin-top: 50px; font-size: 0.85em; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h1>Unified Medical Record</h1>
          
          <div class="section">
            <div class="label">Patient Name</div>
            <div class="value">${record.patient?.name || 'Unknown'}</div>
          </div>
          
          <div class="section">
            <div class="label">Primary Doctor</div>
            <div class="value">Dr. ${record.doctor?.name || 'Unknown'} (${record.doctor?.department || 'General'})</div>
          </div>

          <h2 style="margin-top: 40px; color: #374151;">Consultation History</h2>
          ${visitsHtml}

          <div class="footer">
            Official Unified Record generated securely from Koode Medical Platform.<br/>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>Patient Portal</h2>
        <p>Your account and quick actions.</p>
      </div>

      {state.status === 'loading' ? (
        <div style={{ textAlign: 'center', padding: 24 }}>Loading…</div>
      ) : state.status === 'error' ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ color: 'crimson', marginBottom: 12 }}>{state.error || 'Session expired. Please log in again.'}</div>
          <Link className="btn-primary" to="/login/" style={{ padding: '12px 18px' }}>Go to Login</Link>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="glass-card" style={{ textAlign: 'left' }}>
            <h3 className="card-title">Profile</h3>
            <p className="card-desc">
              <strong>Name:</strong> {user?.name}
              <br />
              <strong>Email:</strong> {user?.email}
              <br />
              <strong>Role:</strong> {user?.role}
            </p>
            <button className="btn-outline" onClick={logout} style={{ marginTop: 10, padding: '10px 14px' }}>
              Log out
            </button>
          </div>

          <Link className="glass-card" to="/organease/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
            <h3 className="card-title">OrganEase</h3>
            <p className="card-desc">Browse available organs and submit requests.</p>
          </Link>

          <div className="glass-card" style={{ textAlign: 'left', gridColumn: '1 / -1' }}>
            <h3 className="card-title">My Unified Medical Records</h3>
            {Object.keys(groupedAppointments).length === 0 ? (
              <p className="card-desc">You have no medical records yet. <Link to="/search/" style={{ color: 'var(--hs-primary)' }}>Book an appointment here.</Link></p>
            ) : (
              <div style={{ display: 'grid', gap: 20, marginTop: 15 }}>
                {Object.entries(groupedAppointments).map(([docId, record]) => (
                  <div key={docId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--hs-glass-border)', padding: 20, borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Dr. {record.doctor?.name || 'Unknown'}</h4>
                        <div style={{ color: 'var(--hs-primary)' }}>{record.doctor?.department || '—'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--hs-muted)', marginTop: 4 }}>
                          Total Visits: {record.visits.length}
                        </div>
                      </div>
                      
                      <button 
                        className="btn-primary" 
                        style={{ padding: '10px 18px', fontSize: '0.9rem' }}
                        onClick={() => exportPDF(record)}
                      >
                        <i className="fas fa-file-pdf" style={{ marginRight: 6 }}></i>
                        Export Unified PDF
                      </button>
                    </div>

                    <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--hs-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Recent Visits</div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {record.visits.slice(0, 3).map(v => (
                          <div key={v.id} style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <strong style={{ fontSize: '0.95rem' }}>{new Date(v.datetime).toLocaleDateString()}</strong>
                              <span style={{ fontSize: '0.85rem', color: v.status === 'accepted' ? '#4ade80' : v.status === 'rejected' ? '#f87171' : 'var(--hs-muted)' }}>{v.status}</span>
                            </div>
                            {v.diagnosis ? (
                              <div style={{ fontSize: '0.9rem', color: 'var(--hs-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <i className="fas fa-check-circle" style={{ color: '#4ade80', marginRight: 5 }}></i>
                                {v.diagnosis}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.9rem', color: 'var(--hs-muted)', fontStyle: 'italic' }}>Pending diagnosis...</div>
                            )}
                          </div>
                        ))}
                        {record.visits.length > 3 && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--hs-primary)', textAlign: 'center' }}>
                            + {record.visits.length - 3} more visits (Included in PDF)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

