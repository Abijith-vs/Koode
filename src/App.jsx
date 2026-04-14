import React, { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import './index.css'
import OrganEase from './pages/OrganEase.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import DoctorDirectory from './pages/DoctorDirectory.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminOrgans from './pages/AdminOrgans.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import { clearToken, getToken } from './lib/auth.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

const Shell = ({ children }) => {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const token = useMemo(() => getToken(), [])
  const [isAuthed, setIsAuthed] = useState(Boolean(token))
  const [user, setUser] = useState(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'koode_token') setIsAuthed(Boolean(getToken()))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadMe() {
      const t = getToken()
      if (!t) {
        setUser(null)
        return
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { authorization: `Bearer ${t}` } })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || `Failed to load profile (${res.status})`)
        if (!cancelled) setUser(data.user ?? null)
      } catch {
        clearToken()
        if (!cancelled) {
          setUser(null)
          setIsAuthed(false)
        }
      }
    }
    void loadMe()
    return () => {
      cancelled = true
    }
  }, [isAuthed])

  function logout() {
    clearToken()
    setIsAuthed(false)
    setUser(null)
    navigate('/login/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <nav className="glass-nav" style={{ padding: scrolled ? '15px 5%' : '20px 5%' }}>
        <Link className="logo" to="/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <i className="fas fa-layer-group" style={{ color: 'var(--hs-accent)' }}></i>
          Koode
        </Link>
        <ul className="nav-links">
          <li><Link to="/search/" style={{ color: 'inherit', textDecoration: 'none' }}>Discover</Link></li>
          <li><Link to="/multiple-hospital/" style={{ color: 'inherit', textDecoration: 'none' }}>Specialities</Link></li>
          <li><Link to="/doctors/" style={{ color: 'inherit', textDecoration: 'none' }}>Doctors</Link></li>
          <li><Link to="/organease/" style={{ color: 'inherit', textDecoration: 'none' }}>OrganEase</Link></li>
          {user?.role === 'patient' && (
            <li><Link to="/patient-dashboard/" style={{ color: 'inherit', textDecoration: 'none' }}>Patient Portal</Link></li>
          )}
          {user?.role === 'doctor' && (
            <li><Link to="/doctor-dashboard/" style={{ color: 'inherit', textDecoration: 'none' }}>Doctor Portal</Link></li>
          )}
          {user?.role === 'admin' && (
            <li><Link to="/admin/organs/" style={{ color: 'inherit', textDecoration: 'none' }}>Admin</Link></li>
          )}
        </ul>
        {isAuthed ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="btn-outline" onClick={logout} style={{ padding: '10px 14px' }}>
              Log out
            </button>
          </div>
        ) : (
          <div>
            <Link
              className="btn-outline"
              style={{ marginRight: '15px' }}
              to="/login/"
            >
              Log In
            </Link>
            <Link
              className="btn-primary"
              to="/patient-register/"
            >
              Sign Up
            </Link>
          </div>
        )}
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
      
      <footer style={{ background: '#0f172a', color: 'white', padding: '24px 5%', textAlign: 'center' }}>
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '10px', fontSize: '1.4rem' }}>
          <i className="fas fa-layer-group" style={{ color: 'var(--hs-accent)' }}></i>
          Koode
        </div>
        <p style={{ color: 'var(--hs-muted)' }}>&copy; 2026 Koode Project. Building the future of medicine.</p>
      </footer>
    </div>
  )
}

const Home = () => (
  <>
    <section className="hero">
      <div className="hero-content">
        <h1 className="fade-in">Healthcare,<br /> Reimagined.</h1>
        <p className="fade-in delay-1">
          Experience a seamless, secure, and modern way to manage your health, connect with elite professionals, and access top-tier medical facilities worldwide. Build the framework for your wellness today.
        </p>
        <div className="fade-in delay-2">
          <Link
            className="btn-primary"
            style={{ marginRight: '20px', padding: '15px 40px', fontSize: '1.1rem' }}
            to="/search/"
          >
            Find a Doctor
          </Link>
          <Link
            className="btn-outline"
            style={{ padding: '15px 40px', fontSize: '1.1rem' }}
            to="/multiple-hospital/"
          >
            Explore Facilities
          </Link>
        </div>
      </div>
    </section>

    <section className="section" style={{ backgroundColor: 'white' }}>
      <div className="section-header">
        <h2>Specialized Care Core</h2>
        <p>Consult with renowned experts across vital medical fields.</p>
      </div>
      <div className="grid">
        <Link className="glass-card" to="/search/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <div className="icon-wrap"><i className="fas fa-brain"></i></div>
          <h3 className="card-title">Neurology</h3>
          <p className="card-desc">Advanced diagnosis and comprehensive care for intricate neurological conditions and brain health.</p>
        </Link>
        <Link className="glass-card" to="/search/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <div className="icon-wrap"><i className="fas fa-heartbeat"></i></div>
          <h3 className="card-title">Cardiology</h3>
          <p className="card-desc">State-of-the-art heart monitoring, preventative strategies, and elite cardiac interventions.</p>
        </Link>
        <Link className="glass-card" to="/search/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <div className="icon-wrap"><i className="fas fa-bone"></i></div>
          <h3 className="card-title">Orthopedics</h3>
          <p className="card-desc">Pioneering treatments for joint mobility, bone vitality, and comprehensive muscular restoration.</p>
        </Link>
      </div>
    </section>

    <section className="section">
      <div className="section-header">
        <h2>Our Global Network</h2>
        <p>Trust in a system designed for complete transparency and accessibility.</p>
      </div>
      <div className="grid">
        <Link className="glass-card" to="/booking/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <h3 className="card-title">Instant Booking</h3>
          <p className="card-desc">Schedule appointments seamlessly without the endless waiting.</p>
        </Link>
        <Link className="glass-card" to="/patient-dashboard/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <h3 className="card-title">Unified Records</h3>
          <p className="card-desc">Securely access your medical history anytime, from any connected device.</p>
        </Link>
        <Link className="glass-card" to="/chat/" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <h3 className="card-title">Telehealth Ready</h3>
          <p className="card-desc">Consult specialists through our encrypted, high-definition video portal.</p>
        </Link>
      </div>
    </section>
  </>
)

const SimplePage = ({ title }) => (
  <div className="section" style={{ minHeight: '50vh' }}>
    <div className="section-header">
      <h2>{title}</h2>
      <p>This page is now handled by React Router (no full-page reload).</p>
    </div>
    <div style={{ textAlign: 'center' }}>
      <Link className="btn-primary" to="/" style={{ padding: '12px 28px' }}>Back to Home</Link>
    </div>
  </div>
)

const App = () => {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/" element={<Login />} />
        <Route path="/admin/login/" element={<AdminLogin />} />
        <Route path="/admin/organs/" element={<AdminOrgans />} />
        <Route path="/patient-register/" element={<Register />} />
        <Route path="/search/" element={<SimplePage title="Discover Doctors" />} />
        <Route path="/multiple-hospital/" element={<SimplePage title="Specialities & Hospitals" />} />
        <Route path="/doctors/" element={<DoctorDirectory />} />
        <Route path="/organease/" element={<OrganEase />} />
        <Route path="/patient-dashboard/" element={<PatientDashboard />} />
        <Route path="/doctor-dashboard/" element={<DoctorDashboard />} />
        <Route path="/booking/" element={<SimplePage title="Booking" />} />
        <Route path="/chat/" element={<SimplePage title="Chat" />} />
        <Route path="*" element={<SimplePage title="404 - Not Found" />} />
      </Routes>
    </Shell>
  )
}

export default App
