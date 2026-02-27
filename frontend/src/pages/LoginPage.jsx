import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/api'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [tab, setTab] = useState('user')
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const { data } = await authApi.login(form)
            if (tab === 'admin' && data.user.role !== 'admin') { setError('No admin access for this account'); setLoading(false); return }
            login(data.user, data.access_token)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please try again.')
        } finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: '24px' }}>
            <div className="orb orb-purple" style={{ top: '-80px', right: '-80px' }} />
            <div className="orb orb-cyan" style={{ bottom: '-60px', left: '-60px' }} />
            <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>← Back to Home</Link>
                <div className="card card-glow fade-in">
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ width: 60, height: 60, background: 'var(--gradient-main)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>💪</div>
                        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Welcome Back!</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>Continue your fitness journey with ArogyaMitra</p>
                    </div>

                    <div className="tabs" style={{ marginBottom: 24 }}>
                        <button className={`tab ${tab === 'user' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => { setTab('user'); setError('') }}>→ User Login</button>
                        <button className={`tab ${tab === 'admin' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => { setTab('admin'); setError('') }}>🛡 Admin Login</button>
                    </div>

                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ef4444', fontSize: 14 }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input className="input" placeholder="Enter your username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required autoComplete="username" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} autoComplete="current-password" />
                                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>
                        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', fontSize: 15, padding: '14px', marginTop: 8 }}>
                            {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</span> : '→ Sign In'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none' }}>Sign up here</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
