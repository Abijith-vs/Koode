import React, { useEffect, useMemo, useState } from 'react'

import { getToken } from '../lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export default function OrganEase() {
  const [organs, setOrgans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedOrganId, setSelectedOrganId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' })

  const selectedOrgan = useMemo(
    () => organs.find((o) => o.id === selectedOrganId),
    [organs, selectedOrganId],
  )

  async function loadOrgans() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/organease/organs`)
      if (!res.ok) throw new Error(`Failed to load organs (${res.status})`)
      const data = await res.json()
      setOrgans(data.organs ?? [])
    } catch (e) {
      setError(e?.message ?? 'Failed to load organs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrgans()
  }, [])

  async function submitRequest(e) {
    e.preventDefault()
    setSubmitState({ status: 'submitting', message: '' })
    try {
      const token = getToken()
      if (!token) throw new Error('You must be logged in to request an organ.')

      const res = await fetch(`${API_BASE}/api/organease/requests`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          organId: selectedOrganId,
          notes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      setSubmitState({ status: 'done', message: 'Request submitted. Organ reserved (pending confirmation).' })
      setNotes('')
      await loadOrgans()
    } catch (err) {
      setSubmitState({ status: 'error', message: err?.message ?? 'Request failed' })
    }
  }

  return (
    <div className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>OrganEase</h2>
        <p>Browse available organs across centers and submit a request.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>Loading…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'crimson' }}>{error}</div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {organs.map((o) => (
              <button
                key={o.id}
                type="button"
                className="glass-card"
                onClick={() => setSelectedOrganId(o.id)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'left',
                  border: selectedOrganId === o.id ? '2px solid var(--hs-accent)' : '2px solid transparent',
                }}
              >
                <h3 className="card-title">{o.type}</h3>
                <p className="card-desc" style={{ marginBottom: 8 }}>
                  <strong>Blood:</strong> {o.bloodGroup}
                  <br />
                  <strong>Center:</strong> {o.center}
                  <br />
                  <strong>Status:</strong> {o.status}
                </p>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{o.id}</div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 32, maxWidth: 680, marginInline: 'auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: 10 }}>Request an organ</h3>
            <p style={{ textAlign: 'center', opacity: 0.75, marginTop: 0 }}>
              Selected: <strong>{selectedOrgan ? `${selectedOrgan.type} (${selectedOrgan.bloodGroup})` : 'None'}</strong>
            </p>

            <form onSubmit={submitRequest} className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <label>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Requirements/Notes (optional)</div>
                  <textarea
                    value={notes}
                    onChange={(ev) => setNotes(ev.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }}
                  />
                </label>

                <button
                  className="btn-primary"
                  style={{ padding: '12px 18px' }}
                  disabled={!selectedOrganId || submitState.status === 'submitting'}
                  type="submit"
                >
                  {submitState.status === 'submitting' ? 'Submitting…' : 'Submit request'}
                </button>

                {submitState.status !== 'idle' && (
                  <div style={{ textAlign: 'center', color: submitState.status === 'error' ? 'crimson' : 'inherit' }}>
                    {submitState.message}
                  </div>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

