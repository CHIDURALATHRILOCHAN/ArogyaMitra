import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Calendar, CheckCircle, Heart, Zap, TrendingUp, MessageCircle, Activity } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../store/settingsStore'
import { progressApi, calendarApi, assessmentApi } from '../services/api'
import Navbar from '../components/Navbar'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const { t } = useTranslation()
    const [dashData, setDashData] = useState(null)
    const [calStatus, setCalStatus] = useState(null)
    const [loading, setLoading] = useState(true)

    const [assessmentStatus, setAssessmentStatus] = useState(null)

    useEffect(() => {
        const load = async () => {
            try {
                const [progress, cal, assessment] = await Promise.allSettled([progressApi.dashboard(), calendarApi.status(), assessmentApi.status()])
                if (progress.status === 'fulfilled') setDashData(progress.value.data)
                if (cal.status === 'fulfilled') setCalStatus(cal.value.data)
                if (assessment.status === 'fulfilled') setAssessmentStatus(assessment.value.data)
            } catch (e) { }
            setLoading(false)
        }
        load()
    }, [])

    const handleConnectCalendar = async () => {
        if (calStatus?.connected) return
        try {
            const { data } = await calendarApi.getAuthUrl()
            if (data.auth_url) window.location.href = data.auth_url
        } catch (e) {
            console.error('Failed to get calendar auth URL', e)
        }
    }

    const today = DAYS[new Date().getDay()]
    const tomorrow = DAYS[(new Date().getDay() + 1) % 7]
    const charity = dashData?.charity_impact || {}

    const quickActions = [
        ...(assessmentStatus?.completed ? [] : [
            { icon: '❤️', title: 'Start Health Assessment', desc: 'Get AI-powered personalized plans', action: () => navigate('/assessment'), color: '#a855f7', btn: 'Get Started →' }
        ]),
        { icon: '🤖', title: 'Ask AROMI Coach', desc: 'Chat with your AI health companion', action: () => navigate('/coach'), color: '#06b6d4', btn: 'Connect Now →' },
        { icon: '📊', title: 'Track Progress', desc: 'Log your daily fitness metrics', action: () => navigate('/progress'), color: '#10b981', btn: 'Get Started →' },
        ...(assessmentStatus?.completed ? [
            { icon: '🏋️', title: 'View Workout Plan', desc: 'See your personalized exercises', action: () => navigate('/workouts'), color: '#f59e0b', btn: 'View Plan →' }
        ] : [
            { icon: '🏋️', title: 'AI Fitness Coach', desc: 'Chat with your personal AI trainer', action: () => navigate('/coach'), color: '#f59e0b', btn: 'Get Started →' }
        ])
    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <div className="container" style={{ padding: '32px 24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{t('dashboard.welcome')}, <span className="gradient-text">{user?.full_name || user?.username}!</span></h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{t('dashboard.subtitle') || "Ready to continue your fitness journey? Let's make today count 💪"}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '10px 16px' }}>
                        <Flame size={20} color="#f59e0b" />
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{user?.streak_days || 0} day streak</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Quick Actions */}
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={18} color="var(--accent-purple)" /> Quick Actions</h2>
                            <div className="grid-2">
                                {quickActions.map((a, i) => (
                                    <div key={i} className="card" style={{ cursor: 'pointer' }} onClick={a.action}>
                                        <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: a.color }}>{a.title}</h3>
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{a.desc}</p>
                                        <span style={{ fontSize: 13, color: a.color, fontWeight: 600 }}>{a.btn}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Calendar status */}
                        <div className="card"
                            onClick={handleConnectCalendar}
                            style={{
                                borderColor: calStatus?.connected ? 'rgba(16,185,129,0.3)' : 'var(--border)',
                                cursor: calStatus?.connected ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Calendar size={22} color={calStatus?.connected ? '#10b981' : 'var(--text-muted)'} />
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: 15 }}>{calStatus?.connected ? '✅ Google Calendar Connected' : '📅 Connect Google Calendar'}</h3>
                                    {calStatus?.connected ? (
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Connected: <span style={{ color: '#10b981' }}>{calStatus.email || 'your account'}</span> – Plans auto-sync!</p>
                                    ) : (
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Sync your fitness plans to Google Calendar automatically</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Today's Tasks */}
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle size={18} color="var(--accent-green)" /> Today's Remaining Tasks
                            </h3>
                            {assessmentStatus?.completed ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(168,85,247,0.08)', borderRadius: 10, border: '1px solid rgba(168,85,247,0.2)' }}>
                                        <span style={{ fontSize: 14 }}>🏋️ Today's Workout</span>
                                        <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => navigate('/workouts')}>Start</button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <span style={{ fontSize: 14 }}>🥗 Log Today's Meals</span>
                                        <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => navigate('/nutrition')}>Log</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
                                    <p style={{ fontSize: 14 }}>No plan created yet.</p>
                                    <p style={{ fontSize: 13, marginTop: 4 }}>Start your fitness journey by completing health assessment!</p>
                                    <button className="btn-primary" style={{ marginTop: 16, fontSize: 13 }} onClick={() => navigate('/assessment')}>Take Assessment</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Charity Impact */}
                        <div className="card" style={{ borderColor: 'rgba(236,72,153,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Heart size={18} color="#ec4899" /> Charity Impact ❤️</h3>
                                <span className="badge badge-orange">🏆 Bronze</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Your fitness → Their health</p>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Amount Donated</p>
                                <p style={{ fontSize: 22, fontWeight: 800, color: '#ec4899' }}>₹{charity.amount_donated || 0}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>via your workouts & meals</p>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Level: <span style={{ color: '#f59e0b' }}>Bronze</span></p>
                            </div>
                            <div className="grid-2" style={{ gap: 10 }}>
                                {[['People Impacted', charity.people_impacted || 0, '#a855f7'], ['Calories Burned', dashData?.this_month?.calories_burned?.toFixed(0) || 0, '#06b6d4'], ['Workouts Done', charity.workouts_done || 0, '#10b981'], ['Healthy Meals', charity.healthy_meals || 0, '#f59e0b']].map(([label, val, color]) => (
                                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 12, padding: '12px', background: 'rgba(236,72,153,0.06)', borderRadius: 10, border: '1px solid rgba(236,72,153,0.15)', fontSize: 13, color: 'var(--text-secondary)' }}>
                                📣 Keep going! Every calorie brings hope to someone in need 💖
                            </div>
                        </div>

                        {/* Tomorrow's Schedule */}
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Calendar size={18} color="var(--accent-purple)" /> {t('dashboard.tomorrow_schedule')}
                            </h3>
                            {assessmentStatus?.completed ? (
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)' }} />
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>Morning Workout</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }} />
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>Healthy Meals</span>
                                    </div>
                                    <button className="btn-secondary" style={{ width: '100%', fontSize: 13, marginTop: 8 }} onClick={() => navigate('/workouts', { state: { targetDay: 'tomorrow' } })}>View Full Plan</button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                                    <Calendar size={32} style={{ margin: '0 auto', opacity: 0.4 }} />
                                    <p style={{ fontSize: 13, marginTop: 12 }}>No schedule set</p>
                                    <button className="btn-primary" style={{ marginTop: 12, fontSize: 12, padding: '8px 16px' }} onClick={() => navigate('/assessment')}>Create your plan</button>
                                </div>
                            )}
                        </div>

                        {/* Hydration Tracker */}
                        <div className="card" style={{ borderColor: 'rgba(56,189,248,0.2)' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 18 }}>💧</span> {t('dashboard.daily_hydration')}
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: '#38bdf8', lineHeight: 1 }}>{dashData?.chart_data?.slice(-1)[0]?.water || 0}</span>
                                <span style={{ fontSize: 16, color: 'var(--text-secondary)', paddingBottom: 4 }}>/ {dashData?.daily_water_target_glasses || 8} glasses</span>
                            </div>

                            <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                                <div style={{
                                    height: '100%',
                                    background: '#38bdf8',
                                    width: `${Math.min(100, ((dashData?.chart_data?.slice(-1)[0]?.water || 0) / (dashData?.daily_water_target_glasses || 8)) * 100)}%`,
                                    transition: 'width 0.5s ease-out'
                                }} />
                            </div>
                            <button className="btn-secondary" style={{ width: '100%', fontSize: 13, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }} onClick={() => navigate('/progress')}>Log Water</button>
                        </div>

                        {/* Stats */}
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📈 {t('dashboard.this_week')}</h3>
                            {[['🏋️', 'Workouts', dashData?.this_week?.workouts || 0, '#a855f7'], ['🔥', 'Calories', (dashData?.this_week?.calories || 0).toFixed(0), '#f59e0b'], ['🥗', 'Meals', dashData?.this_week?.meals || 0, '#10b981'], ['💧', 'Water', dashData?.this_week?.water_glasses || 0, '#38bdf8']].map(([icon, label, val, color]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{icon} {label}</span>
                                    <span style={{ fontSize: 16, fontWeight: 700, color }}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
