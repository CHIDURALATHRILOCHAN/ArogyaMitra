import React from 'react';
import { Trophy, Flame, CheckCircle, Clock, Zap } from 'lucide-react';

export default function WorkoutSummaryModal({ stats, onClose }) {
    if (!stats) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,10,15,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(10px)' }}>
            <div className="card card-glow fade-in" style={{ width: '100%', maxWidth: 500, padding: 32, background: 'var(--bg-secondary)', position: 'relative' }}>

                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <Trophy size={28} /> Workout Complete!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Amazing effort today! You crushed it! 💪</p>
                </div>

                <div className="grid-2" style={{ marginBottom: 32 }}>
                    <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: 24, borderRadius: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-orange)' }}>{stats.calories}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            Calories Burned <Flame size={14} color="var(--accent-orange)" />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: 24, borderRadius: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-green)' }}>{stats.setsCompleted}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            Sets Completed <CheckCircle size={14} color="var(--accent-green)" />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', padding: 24, borderRadius: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-cyan)' }}>{stats.minutes}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            Minutes Worked <Clock size={14} color="var(--accent-cyan)" />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: 24, borderRadius: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-purple)' }}>{stats.intensity}%</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            Average Intensity <Zap size={14} color="var(--accent-purple)" />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, marginBottom: 32 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#facc15' }}>
                        <Trophy size={18} /> What You Achieved Today
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'var(--text-secondary)' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={16} color="var(--accent-green)" /> Improved cardiovascular endurance</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={16} color="var(--accent-green)" /> Built muscle strength and tone</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={16} color="var(--accent-green)" /> Boosted metabolism for the day</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={16} color="var(--accent-green)" /> Enhanced energy levels</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CheckCircle size={16} color="var(--accent-green)" /> Progressed towards your fitness goals</li>
                    </ul>
                </div>

                <button className="btn-primary" onClick={onClose} style={{ width: '100%', padding: '16px', fontSize: 16, background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
                    Keep Going! 🚀
                </button>
            </div>
        </div>
    );
}
