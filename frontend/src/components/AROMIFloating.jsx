/**
 * Activity 4.3 — AROMIFloating.jsx
 * Always-available floating AI coach accessible from every page.
 * Uses planStore for chat history (persisted), coachApi for responses.
 * Features: status modes, typing indicator, suggested questions, minimize/maximize.
 */
import React, { useState, useRef, useEffect } from 'react'
import { Send, X, Minimize2, MessageCircle, Zap, Bot } from 'lucide-react'
import { coachApi } from '../services/api'
import { usePlanStore } from '../store/planStore'
import { useAuthStore } from '../store/authStore'

const QUICK_PROMPTS = [
    '💪 Suggest a quick workout',
    '🥗 What should I eat now?',
    '✈️ I am traveling — help me',
    '😴 I am tired, any tips?',
]

const STATUS_OPTIONS = [
    { id: 'normal', label: '💬 Normal', color: '#10b981' },
    { id: 'traveling', label: '✈️ Traveling', color: '#06b6d4' },
    { id: 'recovering', label: '🩹 Recovering', color: '#f59e0b' },
    { id: 'fatigued', label: '😴 Fatigued', color: '#a855f7' },
]

export default function AROMIFloating() {
    const { user } = useAuthStore()
    const { aromiOpen, aromiMessages, openAromi, closeAromi, addAromiMessage } = usePlanStore()
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [userStatus, setUserStatus] = useState('normal')
    const [showStatusPicker, setShowStatusPicker] = useState(false)
    const [minimized, setMinimized] = useState(false)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    // Seed welcome message if history is empty
    const displayMessages = aromiMessages.length > 0 ? aromiMessages : [{
        id: 'welcome',
        type: 'aromi',
        content: `🙏 Namaste! I'm **AROMI**, your personal AI health companion powered by ArogyaMitra! 💚\n\nI can help with workouts, nutrition, motivation — anytime, from any page!`,
        timestamp: new Date()
    }]

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [displayMessages, aromiOpen])

    useEffect(() => {
        if (aromiOpen && !minimized) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [aromiOpen, minimized])

    const send = async (msg) => {
        const text = msg || input.trim()
        if (!text || loading) return
        setInput('')
        setShowStatusPicker(false)

        addAromiMessage({ type: 'user', content: text })
        setLoading(true)

        try {
            const { data } = await coachApi.chat(text, userStatus)
            addAromiMessage({ type: 'aromi', content: data.reply || data.content || '...' })
        } catch {
            addAromiMessage({ type: 'aromi', content: "I'm having a moment 🙏 Please try again!" })
        }
        setLoading(false)
    }

    const activeStatus = STATUS_OPTIONS.find(s => s.id === userStatus)

    return (
        <>
            {/* ── Floating Toggle Button ─────────────────────────── */}
            {!aromiOpen && (
                <button
                    onClick={openAromi}
                    aria-label="Open AROMI AI Coach"
                    style={{
                        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
                        width: 60, height: 60, borderRadius: '50%',
                        background: 'var(--gradient-main)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, boxShadow: '0 4px 24px rgba(168,85,247,0.5)',
                        animation: 'pulse-glow 3s ease-in-out infinite',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🤖
                    {/* Notification dot */}
                    <span style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 12, height: 12, borderRadius: '50%',
                        background: '#10b981', border: '2px solid var(--bg-primary)',
                    }} />
                </button>
            )}

            {/* ── Chat Panel ─────────────────────────────────────── */}
            {aromiOpen && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
                    width: 380, maxHeight: minimized ? 60 : 560,
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: 20,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.1)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                }}>

                    {/* Header */}
                    <div style={{
                        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(6,182,212,0.1))',
                        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--gradient-main)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                boxShadow: '0 0 12px rgba(168,85,247,0.4)',
                            }}>🤖</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>AROMI</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeStatus.color }} />
                                    <span style={{ fontSize: 11, color: activeStatus.color }}>
                                        {activeStatus.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {/* Status Picker Toggle */}
                            <button
                                onClick={() => setShowStatusPicker(p => !p)}
                                title="Change status mode"
                                style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 12, color: '#ccc' }}>
                                ⚙️
                            </button>
                            <button onClick={() => setMinimized(m => !m)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#ccc' }}>
                                <Minimize2 size={13} />
                            </button>
                            <button onClick={closeAromi} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', color: '#f87171' }}>
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Status Picker Dropdown */}
                    {showStatusPicker && !minimized && (
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6, flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)' }}>
                            {STATUS_OPTIONS.map(s => (
                                <button key={s.id} onClick={() => { setUserStatus(s.id); setShowStatusPicker(false) }}
                                    style={{
                                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                        border: `1px solid ${userStatus === s.id ? s.color : 'rgba(255,255,255,0.1)'}`,
                                        background: userStatus === s.id ? `${s.color}22` : 'transparent',
                                        color: userStatus === s.id ? s.color : '#888',
                                    }}>{s.label}</button>
                            ))}
                        </div>
                    )}

                    {!minimized && (
                        <>
                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {displayMessages.map((m, i) => (
                                    <div key={m.id || i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: m.type === 'user' ? 'row-reverse' : 'row' }}>
                                        {m.type !== 'user' && (
                                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🤖</div>
                                        )}
                                        <div style={{
                                            padding: '9px 13px', borderRadius: m.type === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                            background: m.type === 'user' ? 'var(--gradient-main)' : 'rgba(255,255,255,0.07)',
                                            color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6,
                                            maxWidth: '82%', whiteSpace: 'pre-wrap',
                                        }}
                                            dangerouslySetInnerHTML={{
                                                __html: m.content
                                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                    .replace(/\n/g, '<br/>')
                                            }} />
                                    </div>
                                ))}
                                {loading && (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
                                        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: 4 }}>
                                            {[0, 0.15, 0.3].map((d, i) => (
                                                <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-purple)', display: 'inline-block', animation: `pulse-glow 1s ${d}s infinite` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Quick Prompts */}
                            {displayMessages.length <= 1 && (
                                <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {QUICK_PROMPTS.map(q => (
                                        <button key={q} onClick={() => send(q)}
                                            style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent-purple)'; e.target.style.color = 'var(--accent-purple)' }}
                                            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)' }}>
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                                    placeholder="Ask AROMI anything..."
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                                />
                                <button onClick={() => send()} disabled={!input.trim() || loading}
                                    style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--gradient-main)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || loading ? 0.5 : 1 }}>
                                    <Send size={15} color="white" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    )
}
