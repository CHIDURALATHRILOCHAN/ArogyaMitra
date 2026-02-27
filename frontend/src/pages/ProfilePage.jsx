import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, Bell, Shield, Edit2, Camera, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Navbar from '../components/Navbar'

export default function ProfilePage() {
    const { user } = useAuthStore()
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState('Profile')
    const [toastMessage, setToastMessage] = useState('')

    // Simulate user stats (these could be fetched from progressApi in reality)
    const stats = {
        workouts: user?.total_workouts || 24,
        activeDays: user?.streak_days || 18,
        weightLost: '3kg' // Simulated for UI
    }

    const [formData, setFormData] = useState({
        full_name: user?.full_name || 'Aragonda Srinivas',
        email: user?.email || 'abcd@gmail.com',
        phone: '',
        age: user?.age || 22,
        gender: user?.gender || 'Male',
        height_cm: user?.height_cm || 170,
        weight_kg: user?.weight_kg || 80
    })

    const handlePhotoUpload = () => {
        if (!isEditing) return;
        setToastMessage('Profile photo uploaded successfully!')
        setTimeout(() => setToastMessage(''), 3000)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
            <Navbar />

            {toastMessage && (
                <div style={{ position: 'absolute', top: 80, right: 24, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 100, fontWeight: 600, fontSize: 13, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ background: '#22c55e', color: 'white', borderRadius: '50%', padding: 2 }}><CheckCircle size={14} /></div>
                    {toastMessage}
                </div>
            )}

            <div className="container" style={{ padding: '32px 24px', maxWidth: 1000, margin: '0 auto' }}>

                {/* Header Sub Nav & Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-purple)' }}>
                            <User size={28} /> My Profile
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage your account settings and preferences</p>
                    </div>

                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{ background: isEditing ? 'rgba(168,85,247,0.1)' : 'var(--bg-secondary)', border: `1px solid ${isEditing ? 'var(--accent-purple)' : 'var(--border)'}`, color: isEditing ? 'var(--accent-purple)' : 'var(--text-primary)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Edit2 size={14} /> {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </button>
                </div>

                {/* Horizontal Tabs */}
                <div className="hide-scroll" style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '6px', marginBottom: 24, gap: 4, overflowX: 'auto' }}>
                    {[
                        { name: 'Profile', icon: <User size={14} /> },
                        { name: 'Settings', icon: <Settings size={14} /> },
                        { name: 'Notifications', icon: <Bell size={14} /> },
                        { name: 'Privacy', icon: <Shield size={14} /> }
                    ].map(tab => (
                        <button key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            style={{
                                flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 8, border: 'none',
                                background: activeTab === tab.name ? '#ffffff' : 'transparent',
                                color: activeTab === tab.name ? '#000000' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.name ? 700 : 500,
                                fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                whiteSpace: 'nowrap'
                            }}>
                            {tab.icon} {tab.name}
                        </button>
                    ))}
                </div>

                {activeTab === 'Profile' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: 24, alignItems: 'start' }}>

                        {/* Avatar & Summary Card */}
                        <div className="card" style={{ padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ position: 'relative', marginBottom: 16 }}>
                                <div style={{
                                    width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 48, fontWeight: 800, color: 'white', border: '4px solid var(--bg-card)',
                                    boxShadow: '0 4px 20px rgba(168,85,247,0.3)', position: 'relative', overflow: 'hidden'
                                }}>
                                    {isEditing ? (
                                        <img src="https://i.pravatar.cc/150?u=aragonda" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        formData.full_name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                {isEditing && (
                                    <button
                                        onClick={handlePhotoUpload}
                                        style={{ position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', border: '3px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                                    >
                                        <Camera size={16} />
                                    </button>
                                )}
                            </div>

                            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{formData.full_name}</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>{formData.email}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%', borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{stats.workouts}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Workouts</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{stats.activeDays}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Active Days</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{stats.weightLost}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Lost</div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information Form */}
                        <div className="card" style={{ padding: '32px 24px' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Personal Information</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                { /* Full Name */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
                                    />
                                </div>

                                { /* Email */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
                                    />
                                </div>

                                { /* Phone */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
                                    />
                                </div>

                                { /* Age */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Age</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
                                    />
                                </div>

                                { /* Gender */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Gender</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500, WebkitAppearance: 'none' }}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                { /* Height */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Height (cm)</label>
                                    <input
                                        type="number"
                                        value={formData.height_cm}
                                        onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
                                    />
                                </div>

                                { /* Weight */}
                                <div style={{ gridColumn: '1 / -1', width: 'calc(50% - 12px)' }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Weight (kg)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            value={formData.weight_kg}
                                            onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                            disabled={!isEditing}
                                            style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}
                                        />
                                        <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', color: 'var(--text-muted)' }}>
                                            <span style={{ fontSize: 10, lineHeight: 1 }}>▲</span>
                                            <span style={{ fontSize: 10, lineHeight: 1 }}>▼</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Fallbacks for other tabs */}
                {['Settings', 'Notifications', 'Privacy'].includes(activeTab) && (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
                        <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>{activeTab} Coming Soon</h3>
                        <p style={{ fontSize: 14 }}>We're building out these preference panels next.</p>
                    </div>
                )}

            </div>
        </div>
    )
}
