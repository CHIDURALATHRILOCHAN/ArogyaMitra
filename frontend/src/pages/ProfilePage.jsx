import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, Bell, Shield, Edit2, Camera, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore, useTranslation } from '../store/settingsStore'
import { authApi } from '../services/api'
import Navbar from '../components/Navbar'

export default function ProfilePage() {
    const { user, setUser } = useAuthStore()
    const { theme, setTheme, language, setLanguage, units, setUnits } = useSettingsStore()
    const { t } = useTranslation()
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState('profile.tab_profile')
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
        setToastMessage(t('profile.toast_photo') || 'Profile photo uploaded successfully!')
        setTimeout(() => setToastMessage(''), 3000)
    }

    const handleSaveProfile = async () => {
        if (isEditing) {
            try {
                const res = await authApi.updateProfile({
                    full_name: formData.full_name,
                    age: parseInt(formData.age),
                    gender: formData.gender,
                    height_cm: parseFloat(formData.height_cm),
                    weight_kg: parseFloat(formData.weight_kg)
                })
                setUser(res.data) // Update global auth store with fresh DB row
                setToastMessage(t('profile.toast_save') || 'Profile updated successfully!')
                setTimeout(() => setToastMessage(''), 3000)
            } catch (error) {
                console.error('Failed to update profile:', error)
                setToastMessage(t('profile.toast_err') || 'Error saving profile data')
            }
        }
        setIsEditing(!isEditing)
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
                            <User size={28} /> {t('profile.title') || 'My Profile'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{t('profile.subtitle') || 'Manage your account settings and preferences'}</p>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        style={{ background: isEditing ? 'rgba(168,85,247,0.1)' : 'var(--bg-secondary)', border: `1px solid ${isEditing ? 'var(--accent-purple)' : 'var(--border)'}`, color: isEditing ? 'var(--accent-purple)' : 'var(--text-primary)', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        <Edit2 size={14} /> {isEditing ? (t('profile.save') || 'Save Changes') : (t('profile.edit') || 'Edit Profile')}
                    </button>
                </div>

                {/* Horizontal Tabs */}
                <div className="hide-scroll" style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '6px', marginBottom: 24, gap: 4, overflowX: 'auto' }}>
                    {[
                        { id: 'profile.tab_profile', icon: <User size={14} /> },
                        { id: 'profile.tab_settings', icon: <Settings size={14} /> },
                        { id: 'profile.tab_notifications', icon: <Bell size={14} /> },
                        { id: 'profile.tab_privacy', icon: <Shield size={14} /> }
                    ].map(tab => (
                        <button key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 8, border: 'none',
                                background: activeTab === tab.id ? '#ffffff' : 'transparent',
                                color: activeTab === tab.id ? '#000000' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                whiteSpace: 'nowrap'
                            }}>
                            {tab.icon} {t(tab.id)}
                        </button>
                    ))}
                </div>

                {activeTab === 'profile.tab_profile' && (
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
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('profile.workouts') || 'Workouts'}</div>
                                </div>
                                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{stats.activeDays}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('profile.active_days') || 'Active Days'}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{stats.weightLost}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t('profile.lost') || 'Lost'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information Form */}
                        <div className="card" style={{ padding: '32px 24px' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>{t('profile.personal_info') || 'Personal Information'}</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                { /* Full Name */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('profile.full_name') || 'Full Name'}</label>
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
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('profile.email') || 'Email'}</label>
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
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('profile.phone') || 'Phone'}</label>
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
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('profile.age') || 'Age'}</label>
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
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('profile.gender') || 'Gender'}</label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        disabled={!isEditing}
                                        style={{ width: '100%', padding: '12px 16px', background: isEditing ? '#ffffff' : 'rgba(255,255,255,0.03)', border: `1px solid ${isEditing ? '#e2e8f0' : 'var(--border)'}`, borderRadius: 8, color: isEditing ? '#0f172a' : 'var(--text-primary)', fontSize: 14, fontWeight: 500, WebkitAppearance: 'none' }}
                                    >
                                        <option value="Male">{t('assessment.opt_male') || 'Male'}</option>
                                        <option value="Female">{t('assessment.opt_female') || 'Female'}</option>
                                        <option value="Other">{t('assessment.opt_other') || 'Other'}</option>
                                    </select>
                                </div>

                                { /* Height */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('profile.height') || 'Height (cm)'}</label>
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
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>{t('profile.weight') || 'Weight (kg)'}</label>
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

                {/* Settings Tab */}
                {activeTab === 'profile.tab_settings' && (
                    <div className="card" style={{ padding: '32px 24px' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Settings size={20} color="var(--accent-purple)" /> {t('profile.app_settings') || 'App Settings'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t('profile.theme') || 'App Theme'}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t('profile.theme_desc') || 'Choose your preferred color mode'}</div>
                                </div>
                                <select className="input" style={{ width: 140 }} value={theme} onChange={(e) => setTheme(e.target.value)}>
                                    <option value="System Default">{t('profile.theme_sys') || 'System Default'}</option>
                                    <option value="Dark Mode">{t('profile.theme_dark') || 'Dark Mode'}</option>
                                    <option value="Light Mode">{t('profile.theme_light') || 'Light Mode'}</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t('profile.lang') || 'App Language'}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t('profile.lang_desc') || 'Select the display language'}</div>
                                </div>
                                <select className="input" style={{ width: 140 }} value={language} onChange={(e) => setLanguage(e.target.value)}>
                                    <option value="English">English</option>
                                    <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                                    <option value="Telugu (తెలుగు)">Telugu (తెలుగు)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>{t('profile.units') || 'Measurement Units'}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t('profile.units_desc') || 'Metric (kg/cm) or Imperial (lb/in)'}</div>
                                </div>
                                <select className="input" style={{ width: 140 }} value={units} onChange={(e) => setUnits(e.target.value)}>
                                    <option value="Metric (kg, cm)">{t('profile.metric') || 'Metric (kg, cm)'}</option>
                                    <option value="Imperial (lbs, in)">{t('profile.imperial') || 'Imperial (lbs, in)'}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'profile.tab_notifications' && (
                    <div className="card" style={{ padding: '32px 24px' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Bell size={20} color="#f59e0b" /> {t('profile.notif_prefs') || 'Notification Preferences'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {[
                                { titleKey: 'profile.notif_workout', descKey: 'profile.notif_workout_desc', title: 'Workout Reminders', desc: 'Daily push notifications to start your workout', defaultChecked: true },
                                { titleKey: 'profile.notif_meal', descKey: 'profile.notif_meal_desc', title: 'Meal Time Alerts', desc: 'Alerts before breakfast, lunch, and dinner', defaultChecked: true },
                                { titleKey: 'profile.notif_coach', descKey: 'profile.notif_coach_desc', title: 'AROMI Coach Updates', desc: 'Messages and check-ins from your AI Coach', defaultChecked: true },
                                { titleKey: 'profile.notif_weekly', descKey: 'profile.notif_weekly_desc', title: 'Weekly Progress Report', desc: 'Email summaries of your week\'s activity', defaultChecked: false }
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 3 ? '1px solid var(--border)' : 'none', paddingBottom: idx < 3 ? 16 : 8 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15 }}>{t(item.titleKey) || item.title}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t(item.descKey) || item.desc}</div>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input type="checkbox" defaultChecked={item.defaultChecked} style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }} />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'profile.tab_privacy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="card" style={{ padding: '32px 24px' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Shield size={20} color="#10b981" /> {t('profile.privacy_settings') || 'Data & Privacy Settings'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {[
                                    { titleKey: 'profile.priv_public', descKey: 'profile.priv_public_desc', title: 'Public Profile', desc: 'Allow other users to view your achievements', defaultChecked: false },
                                    { titleKey: 'profile.priv_board', descKey: 'profile.priv_board_desc', title: 'Leaderboard Opt-in', desc: 'Show your points on the community leaderboard', defaultChecked: true },
                                    { titleKey: 'profile.priv_aromi', descKey: 'profile.priv_aromi_desc', title: 'Share Data with AROMI', desc: 'Allow AI to use your history for better plans', defaultChecked: true }
                                ].map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 2 ? '1px solid var(--border)' : 'none', paddingBottom: idx < 2 ? 16 : 8 }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 15 }}>{t(item.titleKey) || item.title}</div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{t(item.descKey) || item.desc}</div>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input type="checkbox" defaultChecked={item.defaultChecked} style={{ width: 18, height: 18, accentColor: '#10b981' }} />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="card" style={{ padding: '32px 24px', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: '#ef4444' }}>{t('profile.danger') || 'Danger Zone'}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t('profile.export') || 'Export Your Data'}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('profile.export_desc') || 'Download a copy of your personal data'}</div>
                                    </div>
                                    <button className="btn-secondary" style={{ fontSize: 12 }}>{t('profile.req_export') || 'Request Export'}</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(239, 68, 68, 0.1)', paddingTop: 16 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: '#ef4444' }}>{t('profile.delete') || 'Delete Account'}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('profile.delete_desc') || 'Permanently delete your account and all data'}</div>
                                    </div>
                                    <button className="btn-secondary" style={{ fontSize: 12, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>{t('profile.delete') || 'Delete Account'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
