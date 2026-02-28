import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, Apple, TrendingUp, MessageCircle, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../store/settingsStore'

const links = [
    { to: '/dashboard', icon: <LayoutDashboard size={16} />, labelKey: 'nav.dashboard' },
    { to: '/workouts', icon: <Dumbbell size={16} />, labelKey: 'nav.workouts' },
    { to: '/nutrition', icon: <Apple size={16} />, labelKey: 'nav.nutrition' },
    { to: '/progress', icon: <TrendingUp size={16} />, labelKey: 'nav.progress' },
    { to: '/coach', icon: <MessageCircle size={16} />, labelKey: 'nav.coach' },
]

export default function Navbar() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { t } = useTranslation()

    const handleLogout = () => { logout(); navigate('/') }

    return (
        <nav className="navbar">
            <NavLink className="navbar-logo" to="/dashboard">
                <span>💪</span> ArogyaMitra
            </NavLink>

            <div className="navbar-links">
                {links.map(l => (
                    <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        {l.icon} {t(l.labelKey)}
                    </NavLink>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                    onClick={() => navigate('/profile')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '6px 12px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                        {user?.full_name?.[0] || user?.username?.[0] || '?'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{user?.full_name || user?.username}</span>
                </div>
                <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </nav>
    )
}
