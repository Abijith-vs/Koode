import React, { useEffect, useMemo, useState } from 'react'
import { getToken } from '../lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export default function DoctorDirectory() {
  const [departments, setDepartments] = useState([])
  const [department, setDepartment] = useState('')
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [doctorId, setDoctorId] = useState('')
  const [datetime, setDatetime] = useState('')
  const [reason, setReason] = useState('')
  const [submit, setSubmit] = useState({ status: 'idle', message: '' })

  const selectedDoctor = useMemo(() => doctors.find((d) => d.id === doctorId), [doctors, doctorId])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [depsRes, docsRes] = await Promise.all([
        fetch(`${API_BASE}/api/departments`),
        fetch(`${API_BASE}/api/doctors${department ? `?department=${encodeURIComponent(department)}` : ''}`),
      ])
      if (!depsRes.ok) throw new Error(`Failed to load departments (${depsRes.status})`)
      if (!docsRes.ok) throw new Error(`Failed to load doctors (${docsRes.status})`)
      const depsData = await depsRes.json().catch(() => ({}))
      const docsData = await docsRes.json().catch(() => ({}))
      setDepartments(depsData.departments ?? [])
      setDoctors(docsData.doctors ?? [])
    } catch (e) {
      setError(e?.message ?? 'Failed to load directory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department])

  async function book(e) {
    e.preventDefault()
    setSubmit({ status: 'submitting', message: '' })
    try {
      const token = getToken()
      if (!token) throw new Error('Please log in as a patient to book.')

      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId, datetime, reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Booking failed (${res.status})`)
      setSubmit({ status: 'done', message: 'Appointment requested (pending).' })
      setReason('')
      setDatetime('')
      setDoctorId('')
    } catch (err) {
      setSubmit({ status: 'error', message: err?.message ?? 'Booking failed' })
    }
  }

  return (
    <div className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>Doctors by Department</h2>
        <p>Select a department, then book an online appointment.</p>
      </div>

      <div style={{ maxWidth: 980, marginInline: 'auto' }}>
        <div className="glass-card" style={{ padding: 14, marginBottom: 18, textAlign: 'left' }}>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Department</div>
            <select
              value={department}
              onChange={(ev) => setDepartment(ev.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Loading…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'crimson' }}>{error}</div>
        ) : (
          <>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {doctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="glass-card"
                  onClick={() => setDoctorId(d.id)}
                  style={{
                    cursor: 'pointer',
                    textAlign: 'left',
                    border: doctorId === d.id ? '2px solid var(--hs-accent)' : '2px solid transparent',
                  }}
                >
                  <h3 className="card-title">{d.name}</h3>
                  <p className="card-desc" style={{ marginBottom: 8 }}>
                    <strong>Department:</strong> {d.department || '—'}
                    <br />
                    <strong>Email:</strong> {d.email}
                  </p>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{d.id}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 32, maxWidth: 680, marginInline: 'auto' }}>
              <h3 style={{ textAlign: 'center', marginBottom: 10 }}>Book an appointment</h3>
              <p style={{ textAlign: 'center', opacity: 0.75, marginTop: 0 }}>
                Selected: <strong>{selectedDoctor ? `${selectedDoctor.name} (${selectedDoctor.department || '—'})` : 'None'}</strong>
              </p>

              <form onSubmit={book} className="glass-card" style={{ padding: 18 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <label>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Date & time</div>
                    <input
                      type="datetime-local"
                      value={datetime}
                      onChange={(ev) => setDatetime(ev.target.value)}
                      required
                      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
                    />
                  </label>

                  <label>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Reason (optional)</div>
                    <textarea
                      value={reason}
                      onChange={(ev) => setReason(ev.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
                    />
                  </label>

                  <button className="btn-primary" style={{ padding: '12px 18px' }} disabled={!doctorId || submit.status === 'submitting'} type="submit">
                    {submit.status === 'submitting' ? 'Submitting…' : 'Request appointment'}
                  </button>

                  {submit.status !== 'idle' && (
                    <div style={{ textAlign: 'center', color: submit.status === 'error' ? 'crimson' : 'inherit' }}>{submit.message}</div>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

