import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/api'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [form, setForm] = useState({ full_name: '', username: '', email: '', age: '', gender: '', height_cm: '', weight_kg: '', password: '', confirm: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const pwStrength = () => {
        const p = form.password
        if (!p) return { level: 0, label: '' }
        if (p.length < 6) return { level: 1, label: 'Weak', color: '#ef4444' }
        if (p.length < 10) return { level: 2, label: 'Fair', color: '#f59e0b' }
        if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { level: 4, label: 'Strong', color: '#10b981' }
        return { level: 3, label: 'Good', color: '#06b6d4' }
    }
    const strength = pwStrength()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.password !== form.confirm) { setError('Passwords do not match'); return }
        setLoading(true); setError('')
        try {
            const payload = { full_name: form.full_name, username: form.username, email: form.email, password: form.password, age: form.age ? parseInt(form.age) : null, gender: form.gender || null, height_cm: form.height_cm ? parseInt(form.height_cm) : null, weight_kg: form.weight_kg ? parseInt(form.weight_kg) : null }
            const { data } = await authApi.register(payload)
            login(data.user, data.access_token)
            navigate('/assessment')
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Try again.')
        } finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: '24px' }}>
            <div className="orb orb-purple" style={{ top: '-80px', left: '-80px' }} />
            <div className="orb orb-pink" style={{ bottom: '-60px', right: '-60px' }} />
            <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>← Back to Home</Link>
                <div className="card card-glow fade-in">
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ width: 60, height: 60, background: 'var(--gradient-main)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>💪</div>
                        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Join ArogyaMitra!</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>Start your AI-powered fitness journey today</p>
                    </div>

                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ef4444', fontSize: 14 }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <input className="input" placeholder="Enter your full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input className="input" placeholder="Choose a username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Email Address</label>
                            <input className="input" type="email" placeholder="Enter your email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>🧬 Personal Information (Optional)</p>
                            <div className="grid-2" style={{ marginBottom: 0 }}>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Age</label>
                                    <input className="input" type="number" placeholder="e.g., 25" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} min="10" max="100" />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Gender</label>
                                    <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                        <option value="">Select Gender</option>
                                        <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                                    </select>
                                </div>
                                <div className="input-group" style={{ marginBottom: 0, marginTop: 12 }}>
                                    <label className="input-label">Height (cm)</label>
                                    <input className="input" type="number" placeholder="e.g., 175" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0, marginTop: 12 }}>
                                    <label className="input-label">Weight (kg)</label>
                                    <input className="input" type="number" placeholder="e.g., 70" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Create a strong password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                            {form.password && (
                                <div style={{ marginTop: 8 }}>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${strength.level * 25}%`, background: strength.color }} /></div>
                                    <span style={{ fontSize: 11, color: strength.color, marginTop: 4, display: 'block' }}>{strength.label}</span>
                                </div>
                            )}
                        </div>
                        <div className="input-group">
                            <label className="input-label">Confirm Password</label>
                            <input className="input" type="password" placeholder="Confirm your password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
                        </div>

                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
                            By creating an account, you agree to our <a href="#" style={{ color: 'var(--accent-purple)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--accent-purple)' }}>Privacy Policy</a>.
                        </p>
                        <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', fontSize: 15, padding: '14px' }}>
                            {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</span> : '👤 Create My Account'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent-purple)', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
                    </p>

                    <div className="grid-2" style={{ marginTop: 24, gap: 10 }}>
                        {[['🤖', 'AI Plans'], ['📅', 'Auto Schedule'], ['📊', 'Progress Track'], ['❤️', 'Charity Impact']].map(([icon, label]) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{icon} {label}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
