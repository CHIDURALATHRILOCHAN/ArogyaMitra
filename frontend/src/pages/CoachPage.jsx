/**
 * CoachPage.jsx — Activity 3.5: AROMI AI Coach with Real-Time Adaptive Support
 *
 * Features:
 * - Status-aware coaching (normal / traveling / recovering / fatigued)
 * - Dynamic plan adjustment panel (travel / injury / time constraint / health issue)
 * - AI progress analysis from last 7 days
 * - Full conversation history with context modes
 * - Quick suggestion chips for common queries
 */
import React, { useState, useEffect, useRef } from 'react'
import { Send, Bot, Zap, RefreshCw, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { coachApi, workoutApi, nutritionApi } from '../services/api'
import Navbar from '../components/Navbar'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../store/settingsStore'
import { usePlanStore } from '../store/planStore'

const STATUS_MODES = [
    { id: 'normal', labelKey: 'coach.status_normal', icon: '💬', color: '#10b981' },
    { id: 'traveling', labelKey: 'coach.status_traveling', icon: '✈️', color: '#06b6d4' },
    { id: 'recovering', labelKey: 'coach.status_recovering', icon: '🩹', color: '#f59e0b' },
    { id: 'fatigued', labelKey: 'coach.status_fatigued', icon: '😴', color: '#a855f7' },
]

const ADJUST_REASONS = [
    { id: 'travel', labelKey: 'coach.adjust_travel', descKey: 'coach.adjust_travel_desc' },
    { id: 'injury', labelKey: 'coach.adjust_injury', descKey: 'coach.adjust_injury_desc' },
    { id: 'time_constraint', labelKey: 'coach.adjust_time', descKey: 'coach.adjust_time_desc' },
    { id: 'health_issue', labelKey: 'coach.adjust_health', descKey: 'coach.adjust_health_desc' },
    { id: 'custom', labelKey: 'coach.adjust_custom', descKey: 'coach.adjust_custom_desc' }
]

const SUGGESTIONS = [
    'coach.sugg_1',
    'coach.sugg_2',
    'coach.sugg_3',
    'coach.sugg_4',
    'coach.sugg_5',
    'coach.sugg_6',
]

export default function CoachPage() {
    const { user } = useAuthStore()
    const { t } = useTranslation()
    const [messages, setMessages] = useState([{
        role: 'assistant',
        content: `${t('coach.greeting_start') || 'Hi'} ${user?.full_name || user?.username}! 👋\n\n${t('coach.greeting_body') || 'I am AROMI...'}`,
        created_at: new Date().toISOString()
    }])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [userStatus, setUserStatus] = useState('normal')
    const [analysis, setAnalysis] = useState(null)
    const [analysisLoading, setAnalysisLoading] = useState(false)
    const [showAdjust, setShowAdjust] = useState(false)
    const [adjustReason, setAdjustReason] = useState('travel')
    const [customReason, setCustomReason] = useState('')
    const [adjustDays, setAdjustDays] = useState(3)
    const [adjusting, setAdjusting] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        coachApi.history().then(({ data }) => {
            if (data?.messages?.length) {
                setMessages(data.messages.map(m => ({ role: m.role, content: m.content, created_at: m.created_at })))
            }
        }).catch(() => { })
    }, [])

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const send = async (msg) => {
        const text = msg || input.trim()
        if (!text || loading) return
        setInput('')
        const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() }
        setMessages(prev => [...prev, userMsg])
        setLoading(true)
        try {
            const { data } = await coachApi.chat(text, userStatus)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply || data.content || '...',
                created_at: new Date().toISOString()
            }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again! 🙏",
                created_at: new Date().toISOString()
            }])
        }
        setLoading(false)
    }

    const analyzeProgress = async () => {
        setAnalysisLoading(true)
        try {
            const { data } = await coachApi.analyzeProgress()
            setAnalysis(data.analysis)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `📊 **Your Progress Analysis:**\n\n${data.analysis}`,
                created_at: new Date().toISOString()
            }])
        } catch {
            setAnalysis('Unable to analyze progress right now.')
        }
        setAnalysisLoading(false)
    }

    const adjustPlan = async () => {
        const payloadReason = adjustReason === 'custom' ? customReason.trim() : adjustReason
        if (adjustReason === 'custom' && !payloadReason) return

        setAdjusting(true)
        try {
            let currentPlan = {}
            try { const { data } = await workoutApi.getPlan(); currentPlan = data?.plan_data || {} } catch { }

            const { data } = await coachApi.adjustPlan({
                reason: payloadReason,
                duration_days: adjustDays,
                current_plan: currentPlan,
                user_data: { fitness_goal: user?.fitness_goal, fitness_level: user?.fitness_level }
            })
            const adj = data.adjusted_plan?.adjusted_plan || data.adjusted_plan || {}

            let markdownPlan = ''
            if (adj.days && Array.isArray(adj.days)) {
                markdownPlan = `\n\n**${adj.week_summary || 'Your Adjusted Plan:'}**\n`
                adj.days.slice(0, adjustDays).forEach(d => {
                    markdownPlan += `\n**${d.day}**: ${d.focus || 'Workout'}`
                    if (d.main_workout && d.main_workout.length) {
                        const exs = d.main_workout.map(w => w.exercise).join(', ')
                        markdownPlan += `\n* Exercises: ${exs}`
                    }
                })
            } else if (adj.note) {
                // Fallbacks for mock note and exercises 
                const note = adj.note || `Plan adjusted for ${payloadReason}`
                const exercises = Array.isArray(adj.exercises) ? adj.exercises.join(', ') : (adj.exercises || '')
                markdownPlan = `\n\n${note}${exercises ? `\n\n🏋️ Suggested: ${exercises}` : ''}`
            } else {
                markdownPlan = `\n\nPlan adjusted for ${payloadReason}.`
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ **Plan Adjusted for ${adjustDays} days (${payloadReason})**${markdownPlan}\n\nYou've got this! Consistency is key 💪`,
                created_at: new Date().toISOString()
            }])
            setShowAdjust(false)
            setCustomReason('') // Reset custom field on success

            // Automatically sync the global store with the new DB changes
            try {
                const updated = await workoutApi.getPlan()
                usePlanStore.getState().setWorkoutPlan(updated.data)
            } catch (e) {
                console.error("Could not sync plan store", e)
            }

        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Couldn't adjust your plan right now. Try again shortly!",
                created_at: new Date().toISOString()
            }])
        }
        setAdjusting(false)
    }

    const activeStatus = STATUS_MODES.find(s => s.id === userStatus)

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: 14, maxHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>

                {/* ── Header ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, background: 'var(--gradient-main)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>🤖</div>
                        <div>
                            <h1 style={{ fontSize: 20, fontWeight: 800 }}>{t('coach.title') || 'AROMI AI Coach'}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: activeStatus?.color || '#10b981', boxShadow: `0 0 8px ${activeStatus?.color || '#10b981'}` }} />
                                <span style={{ fontSize: 12, color: activeStatus?.color || '#10b981', fontWeight: 600 }}>
                                    {activeStatus?.icon} {activeStatus?.labelKey ? t(activeStatus.labelKey) : activeStatus?.label} {t('coach.mode') || 'Mode'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Status + Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {STATUS_MODES.map(m => (
                            <button key={m.id} onClick={() => setUserStatus(m.id)}
                                style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${userStatus === m.id ? m.color : 'var(--border)'}`, background: userStatus === m.id ? `${m.color}22` : 'transparent', color: userStatus === m.id ? m.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}>
                                {m.icon} {t(m.labelKey)}
                            </button>
                        ))}
                        <button onClick={analyzeProgress} disabled={analysisLoading}
                            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.1)', color: '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {analysisLoading ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#10b981' }} /> {t('coach.analyzing') || 'Analyzing...'}</> : <><TrendingUp size={13} /> {t('coach.my_progress') || 'My Progress'}</>}
                        </button>
                        <button onClick={() => setShowAdjust(!showAdjust)}
                            style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.5)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RefreshCw size={13} /> {t('coach.adjust_plan') || 'Adjust Plan'} {showAdjust ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    </div>
                </div>

                {/* ── Adjust Plan Panel (Activity 3.5) ───────────────── */}
                {showAdjust && (
                    <div className="card" style={{ padding: 20, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 14 }}>{t('coach.dynamic_adjustment') || '⚙️ Dynamic Plan Adjustment'}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                            {t('coach.adjust_desc') || 'Tell AROMI what changed — it will adapt your workout plan accordingly.'}
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: adjustReason === 'custom' ? 10 : 14 }}>
                            {ADJUST_REASONS.map(r => (
                                <button key={r.id} onClick={() => setAdjustReason(r.id)}
                                    style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${adjustReason === r.id ? '#f59e0b' : 'var(--border)'}`, background: adjustReason === r.id ? 'rgba(245,158,11,0.15)' : 'transparent', color: adjustReason === r.id ? '#f59e0b' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                                    {t(r.labelKey)}
                                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{t(r.descKey)}</div>
                                </button>
                            ))}
                        </div>
                        {adjustReason === 'custom' && (
                            <textarea
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                                placeholder="E.g., I am traveling in a train and only have access to train food..."
                                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', marginBottom: 14, minHeight: 60, resize: 'vertical', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                            />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('coach.duration') || 'Duration:'}</label>
                            <input type="range" min={1} max={14} value={adjustDays} onChange={e => setAdjustDays(Number(e.target.value))}
                                style={{ flex: 1, accentColor: '#f59e0b' }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', minWidth: 60 }}>{adjustDays} {t('coach.days') || 'days'}</span>
                            <button onClick={adjustPlan} disabled={adjusting} className="btn-primary"
                                style={{ padding: '8px 20px', fontSize: 13, background: '#f59e0b', minWidth: 100 }}>
                                {adjusting ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /></> : `✅ ${t('coach.apply') || 'Apply'}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Chat Messages ───────────────────────────────────── */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
                    {messages.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.role === 'user' ? 'var(--gradient-main)' : 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                                {m.role === 'user' ? (user?.full_name?.[0]?.toUpperCase() || '👤') : '🤖'}
                            </div>
                            <div className={`chat-bubble chat-bubble-${m.role === 'user' ? 'user' : 'ai'}`}
                                style={{ whiteSpace: 'pre-wrap', maxWidth: '75%', lineHeight: 1.6 }}
                                dangerouslySetInnerHTML={{
                                    __html: m.content
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        .replace(/\n/g, '<br/>')
                                }} />
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                            <div className="chat-bubble chat-bubble-ai" style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 16px' }}>
                                {[0, 0.2, 0.4].map((delay, i) => (
                                    <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)', display: 'inline-block', animation: `pulse-glow 1s ${delay}s infinite` }} />
                                ))}
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>AROMI is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* ── Quick Suggestions ───────────────────────────────── */}
                {messages.length < 4 && (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                        {SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => send(t(s) || s)}
                                style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}
                                onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-purple)'; e.target.style.color = 'var(--accent-purple)' }}
                                onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}>
                                {t(s) || s}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Input Box ───────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '8px 8px 8px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    <input value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                        placeholder={`${t('coach.ask_aromi') || 'Ask AROMI'} (${activeStatus?.labelKey ? t(activeStatus.labelKey) : activeStatus?.label} ${t('coach.mode') ? t('coach.mode').toLowerCase() : 'mode'})...`}
                        style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: 15 }} />
                    <button onClick={() => send()} disabled={!input.trim() || loading}
                        className="btn-primary" style={{ padding: '10px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
