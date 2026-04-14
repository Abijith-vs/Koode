import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clearToken, getToken } from '../lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export default function AdminOrgans() {
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', error: '' })
  const [organs, setOrgans] = useState([])
  const [requests, setRequests] = useState([])

  const [type, setType] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [center, setCenter] = useState('')
  const [createState, setCreateState] = useState({ status: 'idle', message: '' })

  const token = useMemo(() => getToken(), [])

  async function ensureAdmin() {
    const t = getToken()
    if (!t) {
      navigate('/admin/login/')
      return false
    }
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { authorization: `Bearer ${t}` } })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data?.user?.role !== 'admin') {
      clearToken()
      navigate('/admin/login/')
      return false
    }
    return true
  }

  async function loadOrgans() {
    setState({ status: 'loading', error: '' })
    try {
      const ok = await ensureAdmin()
      if (!ok) return
      const [orgRes, reqRes] = await Promise.all([
        fetch(`${API_BASE}/api/organease/organs`),
        fetch(`${API_BASE}/api/organease/requests`, {
          headers: { authorization: `Bearer ${getToken()}` },
        }),
      ])
      if (!orgRes.ok) throw new Error(`Failed to load organs (${orgRes.status})`)
      if (!reqRes.ok) throw new Error(`Failed to load requests (${reqRes.status})`)
      
      const orgData = await orgRes.json().catch(() => ({}))
      const reqData = await reqRes.json().catch(() => ({}))
      
      setOrgans(orgData.organs ?? [])
      setRequests(reqData.requests ?? [])
      setState({ status: 'ready', error: '' })
    } catch (e) {
      setState({ status: 'error', error: e?.message ?? 'Failed to load organs' })
    }
  }

  useEffect(() => {
    void loadOrgans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createOrgan(e) {
    e.preventDefault()
    setCreateState({ status: 'submitting', message: '' })
    try {
      const res = await fetch(`${API_BASE}/api/organease/organs`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ type, bloodGroup, center }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Create failed (${res.status})`)
      setCreateState({ status: 'done', message: 'Organ added.' })
      setType('')
      setBloodGroup('')
      setCenter('')
      await loadOrgans()
    } catch (err) {
      setCreateState({ status: 'error', message: err?.message ?? 'Create failed' })
    }
  }

  async function setStatus(organId, status) {
    const res = await fetch(`${API_BASE}/api/organease/organs/${encodeURIComponent(organId)}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ status }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`)
    setOrgans((prev) => prev.map((o) => (o.id === organId ? data.organ : o)))
  }

  async function remove(organId) {
    const res = await fetch(`${API_BASE}/api/organease/organs/${encodeURIComponent(organId)}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${getToken()}` },
    })
    if (res.status === 204) {
      setOrgans((prev) => prev.filter((o) => o.id !== organId))
      return
    }
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Delete failed (${res.status})`)
  }

  function logout() {
    clearToken()
    navigate('/admin/login/')
  }

  return (
    <div className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>Admin: Organ Inventory</h2>
        <p>Add organs and update availability.</p>
      </div>

      <div style={{ maxWidth: 980, marginInline: 'auto' }}>
        <div className="glass-card" style={{ padding: 14, marginBottom: 18, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ opacity: 0.8 }}>
              Token: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>{token ? 'set' : 'missing'}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link className="btn-outline" to="/organease/" style={{ padding: '10px 14px', textDecoration: 'none' }}>
                View public OrganEase
              </Link>
              <button className="btn-outline" onClick={logout} style={{ padding: '10px 14px' }}>
                Log out
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={createOrgan} className="glass-card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontWeight: 700 }}>Add new organ</div>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Type</div>
              <input value={type} onChange={(e) => setType(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Blood group</div>
              <input value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }} />
            </label>
            <label>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Center</div>
              <input value={center} onChange={(e) => setCenter(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)' }} />
            </label>
            <button className="btn-primary" style={{ padding: '12px 18px' }} type="submit" disabled={createState.status === 'submitting'}>
              {createState.status === 'submitting' ? 'Adding…' : 'Add organ'}
            </button>
            {createState.status !== 'idle' && (
              <div style={{ textAlign: 'center', color: createState.status === 'error' ? 'crimson' : 'inherit' }}>{createState.message}</div>
            )}
          </div>
        </form>

        {state.status === 'loading' ? (
          <div style={{ textAlign: 'center', padding: 24 }}>Loading…</div>
        ) : state.status === 'error' ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'crimson' }}>{state.error}</div>
        ) : (
          <>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {organs.map((o) => (
                <div key={o.id} className="glass-card" style={{ textAlign: 'left' }}>
                  <h3 className="card-title">{o.type}</h3>
                  <p className="card-desc" style={{ marginBottom: 10 }}>
                    <strong>Blood:</strong> {o.bloodGroup}
                    <br />
                    <strong>Center:</strong> {o.center}
                    <br />
                    <strong>Status:</strong> {o.status}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn-outline" style={{ padding: '10px 14px' }} type="button" onClick={() => void setStatus(o.id, 'available')}>
                      Mark available
                    </button>
                    <button className="btn-outline" style={{ padding: '10px 14px' }} type="button" onClick={() => void setStatus(o.id, 'reserved')}>
                      Mark reserved
                    </button>
                    <button className="btn-outline" style={{ padding: '10px 14px' }} type="button" onClick={() => void setStatus(o.id, 'unavailable')}>
                      Mark unavailable
                    </button>
                    <button className="btn-outline" style={{ padding: '10px 14px', borderColor: 'rgba(220, 38, 38, 0.5)' }} type="button" onClick={() => void remove(o.id)}>
                      Delete
                    </button>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>{o.id}</div>
                </div>
              ))}
            </div>

            <div className="section-header" style={{ marginTop: 60, marginBottom: 30 }}>
              <h2>Organ Requests</h2>
              <p>User submitted requests for organs.</p>
            </div>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', opacity: 0.7 }}>No requests yet.</div>
            ) : (
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {requests.map((r) => {
                  const organ = organs.find(o => o.id === r.organId)
                  return (
                    <div key={r.id} className="glass-card" style={{ textAlign: 'left' }}>
                      <h3 className="card-title">{organ ? `${organ.type} (${organ.bloodGroup})` : 'Unknown Organ'}</h3>
                      <p className="card-desc" style={{ marginBottom: 10 }}>
                        <strong>Requester:</strong> {r.requesterName} ({r.requesterEmail})
                        <br />
                        <strong>Status:</strong> {r.status}
                        <br />
                        <strong>Date:</strong> {new Date(r.createdAt).toLocaleString()}
                        {r.notes && (
                          <>
                            <br />
                            <strong>Notes:</strong> {r.notes}
                          </>
                        )}
                      </p>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{r.id} | Organ: {r.organId}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

