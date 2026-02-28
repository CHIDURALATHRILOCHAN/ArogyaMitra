import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Target, Zap, Trophy, TrendingUp, Scale, Dumbbell } from 'lucide-react'
import { progressApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import Navbar from '../components/Navbar'

export default function ProgressPage() {
    const { user } = useAuthStore()
    const [dashData, setDashData] = useState(null)
    const [logForm, setLogForm] = useState({ log_date: new Date().toISOString().split('T')[0], workouts_done: 0, calories_burned: 0, healthy_meals: 0, water_glasses: 0, mood: 7, weight_kg: '', notes: '' })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [activeChart, setActiveChart] = useState('calories')
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('Overview')

    useEffect(() => {
        progressApi.dashboard().then(({ data }) => setDashData(data)).catch(() => setDashData(null)).finally(() => setLoading(false))
    }, [])

    const handleLog = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await progressApi.log({ ...logForm, workouts_done: parseInt(logForm.workouts_done), calories_burned: parseFloat(logForm.calories_burned), healthy_meals: parseInt(logForm.healthy_meals), water_glasses: parseInt(logForm.water_glasses), mood: parseInt(logForm.mood), weight_kg: logForm.weight_kg ? parseFloat(logForm.weight_kg) : null })
            setSaved(true)
            const { data } = await progressApi.dashboard()
            setDashData(data)
            setTimeout(() => setSaved(false), 3000)
        } catch { }
        setSaving(false)
    }

    const chartData = dashData?.chart_data?.slice(-14) || []

    // Achievement Logic
    const workouts = dashData?.total_workouts || 0;
    const meals = dashData?.this_month?.healthy_meals || 0;
    const cals = dashData?.this_month?.calories_burned || 0;
    const streak = user?.streak_days || 0;

    const ACHIEVEMENTS = [
        { icon: '🏃', title: 'First Step', desc: 'Complete your first workout', progress: Math.min(100, (workouts / 1) * 100), pts: 10 },
        { icon: '💪', title: 'Workout Warrior', desc: 'Complete 5 workouts', progress: Math.min(100, (workouts / 5) * 100) },
        { icon: '🦍', title: 'Beast Mode', desc: 'Complete 10 workouts', progress: Math.min(100, (workouts / 10) * 100) },
        { icon: '🥗', title: 'Nutrition Ninja', desc: 'Track 5 meals', progress: Math.min(100, (meals / 5) * 100) },
        { icon: '⚡', title: 'Exercise Excellence', desc: 'Complete 25 exercises', progress: Math.min(100, (workouts * 4 / 25) * 100) },
        { icon: '🔥', title: 'Fire Starter', desc: 'Burn 500 calories', progress: Math.min(100, (cals / 500) * 100) },
        { icon: '🔥🔥', title: 'Fire Master', desc: 'Burn 1000 calories', progress: Math.min(100, (cals / 1000) * 100) },
        { icon: '📅', title: 'Consistency Counts', desc: 'Achieve 3-day streak', progress: Math.min(100, (streak / 3) * 100) },
        { icon: '👑', title: 'Streak King', desc: 'Achieve 7-day streak', progress: Math.min(100, (streak / 7) * 100) },
        { icon: '⚖️', title: 'Weight Loss Winner', desc: 'Lose 2kg', progress: 0 },
        { icon: '🎉', title: 'Major Transformation', desc: 'Lose 5kg', progress: 0 },
    ]

    const unlockedCount = ACHIEVEMENTS.filter(a => a.progress >= 100).length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <div className="container" style={{ padding: '32px 24px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-purple)' }}>
                            <TrendingUp size={28} /> Progress Tracking
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Monitor your fitness journey with detailed analytics</p>
                    </div>
                    <select className="input" style={{ width: 'auto', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <option>Last Month</option>
                        <option>This Week</option>
                        <option>All Time</option>
                    </select>
                </div>

                {/* Sub-Navigation */}
                <div className="hide-scroll" style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '6px', marginBottom: 32, gap: 4, overflowX: 'auto' }}>
                    {['Overview', 'Workouts', 'Nutrition', 'Body Metrics', 'Achievements'].map(tab => (
                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1, minWidth: 130, padding: '10px 16px', borderRadius: 8, border: 'none',
                                background: activeTab === tab ? '#ffffff' : 'transparent',
                                color: activeTab === tab ? '#000000' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab ? 700 : 500,
                                fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                whiteSpace: 'nowrap'
                            }}>
                            {tab === 'Overview' && <TrendingUp size={16} />}
                            {tab === 'Workouts' && <Activity size={16} />}
                            {tab === 'Nutrition' && <span style={{ fontSize: 16 }}>♡</span>}
                            {tab === 'Body Metrics' && <span style={{ fontSize: 16 }}>◎</span>}
                            {tab === 'Achievements' && <Trophy size={16} />}
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'Overview' && (
                    <div>
                        {/* Metric Cards Grid */}
                        <div className="grid-4" style={{ marginBottom: 32, gap: 20 }}>
                            {[
                                { label: 'Total Workouts', value: dashData?.total_workouts || 0, icon: <Activity size={24} color="#fff" />, color: '#3b82f6', change: '- 0%', changeColor: '#ef4444' },
                                { label: 'Weight Loss', value: '0 kg', icon: <Scale size={24} color="#fff" />, color: '#10b981', change: '- 0%', changeColor: '#ef4444' },
                                { label: 'Calories Burned', value: dashData?.this_month?.calories_burned?.toFixed(0) || 0, icon: <Zap size={24} color="#fff" />, color: '#f97316', change: '↗ 10%', changeColor: '#10b981' },
                                { label: 'BMI', value: '27.7', icon: <Target size={24} color="#fff" />, color: '#a855f7', change: '- 0%', changeColor: '#ef4444' },
                            ].map((s, i) => (
                                <div key={i} className="card" style={{ padding: 24, position: 'relative', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {s.icon}
                                        </div>
                                        <div style={{ fontSize: 12, color: s.changeColor, fontWeight: 700 }}>{s.change}</div>
                                    </div>
                                    <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>{s.value}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
                            {/* Charts */}
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20 }}>📊</span> Progress Tracking</h3>
                                    <div className="tabs" style={{ padding: 2 }}>
                                        {[['calories', '🔥 Calories'], ['workouts', '💪 Workouts'], ['mood', '😊 Mood']].map(([key, label]) => (
                                            <button key={key} className={`tab ${activeChart === key ? 'active' : ''}`} onClick={() => setActiveChart(key)} style={{ fontSize: 12, padding: '4px 12px' }}>{label}</button>
                                        ))}
                                    </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Your detailed progress charts and analytics appear here as you log activities.</p>

                                {chartData.length ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f8' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                            <Bar dataKey={activeChart} fill={`url(#color${activeChart})`} radius={[4, 4, 0, 0]} />
                                            <defs>
                                                <linearGradient id="colorcalories" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
                                                </linearGradient>
                                                <linearGradient id="colorworkouts" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.2} />
                                                </linearGradient>
                                                <linearGradient id="colormood" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Log progress to see your chart</div>}
                            </div>

                            {/* Log Form */}
                            <div className="card">
                                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📝 Log Today's Activity</h3>
                                {saved && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: '#10b981', fontSize: 14 }}>✅ Progress logged successfully!</div>}
                                <form onSubmit={handleLog}>
                                    {[['Date', 'log_date', 'date', null], ['Workouts Done', 'workouts_done', 'number', { min: 0, max: 10 }], ['Calories Burned', 'calories_burned', 'number', { min: 0 }], ['Healthy Meals', 'healthy_meals', 'number', { min: 0, max: 10 }], ['Weight (kg)', 'weight_kg', 'number', { step: 0.1 }]].map(([label, key, type, extra]) => (
                                        <div key={key} className="input-group">
                                            <label className="input-label">{label}</label>
                                            <input className="input" type={type} value={logForm[key]} onChange={e => setLogForm({ ...logForm, [key]: e.target.value })} {...(extra || {})} />
                                        </div>
                                    ))}

                                    {/* Hydration Logger */}
                                    <div className="card" style={{ background: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.2)', marginBottom: 20, padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <label className="input-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8' }}>
                                                <span style={{ fontSize: 18 }}>💧</span> Water Intake (250ml glasses)
                                            </label>
                                            <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>
                                                {logForm.water_glasses} <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>/ {dashData?.daily_water_target_glasses || 8}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <button type="button"
                                                className="btn-secondary"
                                                style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', fontSize: 20, background: 'rgba(0,0,0,0.2)' }}
                                                onClick={() => setLogForm(f => ({ ...f, water_glasses: Math.max(0, parseInt(f.water_glasses) - 1) }))}>
                                                -
                                            </button>

                                            <div style={{ flex: 1, height: 24, background: 'rgba(0,0,0,0.3)', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                                                <div style={{
                                                    position: 'absolute', top: 0, left: 0, height: '100%',
                                                    background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                                                    width: `${Math.min(100, (logForm.water_glasses / (dashData?.daily_water_target_glasses || 8)) * 100)}%`,
                                                    transition: 'width 0.3s ease-out'
                                                }} />
                                            </div>

                                            <button type="button"
                                                className="btn-primary"
                                                style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', fontSize: 20, background: '#0ea5e9' }}
                                                onClick={() => setLogForm(f => ({ ...f, water_glasses: parseInt(f.water_glasses) + 1 }))}>
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Mood (1-10): {logForm.mood}</label>
                                        <input type="range" min="1" max="10" value={logForm.mood} onChange={e => setLogForm({ ...logForm, mood: e.target.value })} style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}><span>😞</span><span>😊</span></div>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Notes</label>
                                        <input className="input" placeholder="How did you feel today?" value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} />
                                    </div>
                                    <button className="btn-primary" type="submit" disabled={saving} style={{ width: '100%' }}>
                                        {saving ? 'Saving...' : '💾 Save Progress'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Achievements' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Overall Progress Tracker */}
                        <div className="card" style={{ padding: '24px 32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Trophy size={22} color="#f59e0b" /> Achievement Progress
                                </h3>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-purple)' }}>{unlockedCount}/11</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Achievements Unlocked</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, marginTop: 16 }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Completion</span>
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round((unlockedCount / 11) * 100)}%</span>
                            </div>
                            <div className="progress-bar" style={{ height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 20 }}>
                                <div className="progress-fill" style={{ width: `${(unlockedCount / 11) * 100}%`, background: 'linear-gradient(90deg, #ec4899, #a855f7)', borderRadius: 20 }} />
                            </div>
                        </div>

                        {/* Achievements Grid */}
                        <div className="grid-3" style={{ gap: 20 }}>
                            {ACHIEVEMENTS.map((a, i) => (
                                <div key={i} className="card" style={{
                                    background: a.progress >= 100 ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : 'var(--bg-card)',
                                    borderColor: a.progress >= 100 ? '#38bdf8' : 'var(--border)',
                                    position: 'relative', overflow: 'hidden', padding: 24
                                }}>
                                    {a.pts && (
                                        <div style={{
                                            position: 'absolute', top: 16, right: 16,
                                            background: a.progress >= 100 ? 'rgba(255,255,255,0.2)' : 'rgba(168,85,247,0.1)',
                                            color: a.progress >= 100 ? '#fff' : 'var(--accent-purple)',
                                            padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800
                                        }}>
                                            +{a.pts} pts
                                        </div>
                                    )}

                                    <div style={{ fontSize: 36, marginBottom: 16 }}>{a.icon}</div>
                                    <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, color: a.progress >= 100 ? '#fff' : 'var(--text-primary)' }}>{a.title}</h4>
                                    <p style={{ fontSize: 13, color: a.progress >= 100 ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.4, minHeight: 36 }}>{a.desc}</p>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, color: a.progress >= 100 ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)', fontWeight: 600 }}>
                                            <span>Progress</span>
                                            <span>{Math.round(a.progress)}%</span>
                                        </div>
                                        <div className="progress-bar" style={{ height: 6, background: a.progress >= 100 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)' }}>
                                            <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, a.progress))}%`, background: a.progress >= 100 ? '#fff' : (a.progress > 0 ? 'var(--accent-purple)' : 'transparent') }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: a.progress >= 100 ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)', marginTop: 8 }}>
                                            {a.progress >= 100 ? '100% complete' : `${Math.round(a.progress)}% complete`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Workouts Tab */}
                {activeTab === 'Workouts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="grid-3" style={{ gap: 20 }}>
                            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 24 }}>
                                <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Total Workouts</h4>
                                <div style={{ fontSize: 36, fontWeight: 800, color: '#3b82f6' }}>{dashData?.total_workouts || 0}</div>
                            </div>
                            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 24 }}>
                                <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>This Month</h4>
                                <div style={{ fontSize: 36, fontWeight: 800, color: '#a855f7' }}>{dashData?.this_month?.workouts || 0}</div>
                            </div>
                            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 24 }}>
                                <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>This Week</h4>
                                <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{dashData?.this_week?.workouts || 0}</div>
                            </div>
                        </div>
                        <div className="card" style={{ padding: 24 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Workout Frequency</h3>
                            {chartData.length ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#888', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f8' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Bar dataKey="workouts" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Workouts" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Log workouts to see frequency chart</div>}
                        </div>
                    </div>
                )}

                {/* Nutrition Tab */}
                {activeTab === 'Nutrition' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div className="grid-3" style={{ gap: 20 }}>
                            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 24 }}>
                                <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Healthy Meals (Month)</h4>
                                <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981' }}>{dashData?.this_month?.healthy_meals || 0}</div>
                            </div>
                            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 24 }}>
                                <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Calories Burned (Month)</h4>
                                <div style={{ fontSize: 36, fontWeight: 800, color: '#f59e0b' }}>{dashData?.this_month?.calories_burned?.toFixed(0) || 0}</div>
                            </div>
                            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: 24 }}>
                                <h4 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Meals Tracked (Week)</h4>
                                <div style={{ fontSize: 36, fontWeight: 800, color: '#ec4899' }}>{dashData?.this_week?.meals || 0}</div>
                            </div>
                        </div>
                        <div className="grid-2" style={{ gap: 24 }}>
                            <div className="card" style={{ padding: 24 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Caloric Burn</h3>
                                {chartData.length ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f8' }} />
                                            <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} name="Calories" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No data available</div>}
                            </div>
                            <div className="card" style={{ padding: 24 }}>
                                <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Water Intake</h3>
                                {chartData.length ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: '#888', fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f8' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                            <Bar dataKey="water" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Water Glasses" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No data available</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Body Metrics Tab */}
                {activeTab === 'Body Metrics' && (
                    <div className="card" style={{ padding: 24 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Weight Tracking (kg)</h3>
                        {chartData.filter(d => d.weight).length > 0 ? (
                            <ResponsiveContainer width="100%" height={340}>
                                <LineChart data={chartData.filter(d => d.weight)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: '#1e1e2a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f8' }} />
                                    <Line type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', r: 5 }} activeDot={{ r: 8 }} name="Weight (kg)" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
                                <p>Log your weight to see your tracking chart</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}
