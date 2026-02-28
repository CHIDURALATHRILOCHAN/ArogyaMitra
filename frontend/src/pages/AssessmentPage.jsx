import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, CheckCircle, Target, User, Activity, Flame, MapPin, Clock, Stethoscope, AlertTriangle, Pill, CalendarCheck, Scale, Ruler } from 'lucide-react'
import { assessmentApi, workoutApi, nutritionApi } from '../services/api'
import { usePlanStore } from '../store/planStore'
import { useTranslation } from '../store/settingsStore'

// Centralized question definitions matching the backend
const QUESTIONS = [
    { id: 'age', qKey: 'assessment.q_age', icon: <User size={20} color="#f59e0b" />, type: 'number', placeholder: '22', unit: '' },
    { id: 'gender', qKey: 'assessment.q_gender', icon: <User size={20} color="#a855f7" />, type: 'options', opts: ['Male', 'Female', 'Other'], optsKeys: ['assessment.opt_male', 'assessment.opt_female', 'assessment.opt_other'] },
    { id: 'height_cm', qKey: 'assessment.q_height', icon: <Ruler size={20} color="#64748b" />, type: 'number', placeholder: '170', unit: 'cm' },
    { id: 'weight_kg', qKey: 'assessment.q_weight', icon: <Scale size={20} color="#f59e0b" />, type: 'number', placeholder: '75', unit: 'kg' },
    { id: 'fitness_level', qKey: 'assessment.q_fitness_level', icon: <Activity size={20} color="#f59e0b" />, type: 'options', opts: ['Beginner', 'Intermediate', 'Advanced'], optsKeys: ['assessment.opt_beg', 'assessment.opt_int', 'assessment.opt_adv'] },
    { id: 'fitness_goal', qKey: 'assessment.q_fitness_goal', icon: <Target size={20} color="#ef4444" />, type: 'options', opts: ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Strength Training', 'Endurance'], optsKeys: ['assessment.opt_wl', 'assessment.opt_mg', 'assessment.opt_gf', 'assessment.opt_st', 'assessment.opt_end'] },
    { id: 'workout_location', qKey: 'assessment.q_workout_location', icon: <MapPin size={20} color="#10b981" />, type: 'options', opts: ['Home', 'Gym', 'Outdoor', 'Mixed'], optsKeys: ['assessment.opt_home', 'assessment.opt_gym', 'assessment.opt_out', 'assessment.opt_mix'] },
    { id: 'workout_time', qKey: 'assessment.q_workout_time', icon: <Clock size={20} color="#ef4444" />, type: 'options', opts: ['Morning', 'Evening'], optsKeys: ['assessment.opt_morn', 'assessment.opt_eve'] },
    { id: 'medical_history', qKey: 'assessment.q_medical_history', icon: <Stethoscope size={20} color="#a855f7" />, type: 'text', placeholder: 'e.g., Heart condition, Hypertension, etc.' },
    { id: 'health_conditions', qKey: 'assessment.q_health_conditions', icon: <AlertTriangle size={20} color="#f59e0b" />, type: 'text', placeholder: 'e.g., Diabetes, Asthma, Arthritis, etc.' },
    { id: 'injuries', qKey: 'assessment.q_injuries', icon: <Activity size={20} color="#ef4444" />, type: 'text', placeholder: 'e.g., Knee pain, lower back issues...' },
    { id: 'equipment', qKey: 'assessment.q_equipment', icon: <Flame size={20} color="#f59e0b" />, type: 'options', opts: ['No equipment (bodyweight)', 'Basic Home Gym', 'Full Gym Access'], optsKeys: ['assessment.opt_no_equip', 'assessment.opt_basic_gym', 'assessment.opt_full_gym'] },
    { id: 'diet_type', qKey: 'assessment.q_diet_type', icon: <Flame size={20} color="#10b981" />, type: 'options', opts: ['No restriction', 'Vegetarian', 'Vegan', 'Keto', 'High-protein'], optsKeys: ['assessment.opt_no_rest', 'assessment.opt_veg', 'assessment.opt_vegan', 'assessment.opt_keto', 'assessment.opt_high_prot'] },
    { id: 'sync_calendar', qKey: 'assessment.q_sync_calendar', icon: <CalendarCheck size={20} color="#3b82f6" />, type: 'checkbox', labelKey: 'assessment.sync_label', descKeys: ['assessment.sync_desc1', 'assessment.sync_desc2'] }
]

export default function AssessmentPage() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState({})
    const [genStatusKey, setGenStatusKey] = useState('assessment.status_submit')
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)

    const q = QUESTIONS[step]
    const progress = ((step) / QUESTIONS.length) * 100

    // Check if current question is answered (optional text fields are always 'answered', sync calendar has default)
    const isAnswered = q.type === 'text' || q.type === 'checkbox' || (answers[q.id] !== undefined && answers[q.id] !== '')

    const handleInput = (val) => setAnswers({ ...answers, [q.id]: val })

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            setGenStatusKey('assessment.status_analyze')
            await assessmentApi.submit(answers)
            setDone(true)

            setGenStatusKey('assessment.status_workout')
            const workoutRes = await workoutApi.generate()
            usePlanStore.getState().setWorkoutPlan(workoutRes.data)

            setGenStatusKey('assessment.status_nutrition')
            const nutritionRes = await nutritionApi.generate()
            usePlanStore.getState().setMealPlan(nutritionRes.data)

            setGenStatusKey('assessment.status_done')
            setTimeout(() => navigate('/dashboard'), 1500)
        } catch (e) {
            console.error(e)
            setSubmitting(false)
            alert(t('assessment.error') || 'Something went wrong. Please try again.')
        }
    }

    if (done || submitting) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 24, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 64 }} className="float">✨</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {done ? (t('assessment.almost') || 'Almost Ready!') : (t('assessment.finalizing') || 'Finalizing...')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 400 }}>{t(genStatusKey)}</p>
            <div style={{ width: '100%', maxWidth: 300, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <div className="progress-fill" style={{
                    width: done ? '100%' : '60%',
                    height: '100%',
                    background: 'var(--gradient-main)',
                    transition: 'width 1s ease'
                }} />
            </div>
            <div className="spinner" style={{ width: 40, height: 40, marginTop: 20 }} />
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 640, position: 'relative', zIndex: 1 }}>

                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                        <Activity color="var(--accent-purple)" size={28} />
                        <h1 style={{ fontSize: 28, fontWeight: 800, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('assessment.title') || 'Smart Fitness Planner'}</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{t('assessment.subtitle') || 'Answer a few questions to get your personalized plan'}</p>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('assessment.question') || 'Question'} {step + 1} {t('assessment.of') || 'of'} {QUESTIONS.length}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{Math.round(progress)}% {t('assessment.complete') || 'Complete'}</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                        <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--gradient-main)' }} />
                    </div>
                </div>

                {/* Question Card */}
                <div className="card fade-in" key={step} style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16 }}>

                    <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {q.icon} {q.qKey ? t(q.qKey) : q.q}
                    </h2>

                    {/* Input Types */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {q.type === 'number' && (
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    placeholder={q.placeholder}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleInput(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 16, outline: 'none' }}
                                    autoFocus
                                />
                                {q.unit && <span style={{ position: 'absolute', right: 16, top: 18, color: 'var(--text-secondary)' }}>{q.unit}</span>}
                            </div>
                        )}

                        {q.type === 'text' && (
                            <textarea
                                placeholder={q.placeholder}
                                value={answers[q.id] || ''}
                                onChange={(e) => handleInput(e.target.value)}
                                style={{ width: '100%', padding: '16px', borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: 15, outline: 'none', minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
                                autoFocus
                            />
                        )}

                        {q.type === 'options' && (
                            <div style={{ display: 'grid', gridTemplateColumns: q.opts.length > 3 ? '1fr 1fr' : '1fr', gap: 12 }}>
                                {q.opts.map((opt, i) => (
                                    <button key={opt} onClick={() => handleInput(opt)}
                                        style={{
                                            padding: '16px',
                                            borderRadius: 12,
                                            border: `1px solid ${answers[q.id] === opt ? 'var(--accent-purple)' : 'var(--border)'}`,
                                            background: answers[q.id] === opt ? 'var(--gradient-main)' : 'rgba(255,255,255,0.03)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontSize: 15,
                                            fontWeight: answers[q.id] === opt ? 600 : 400
                                        }}>
                                        {q.optsKeys ? t(q.optsKeys[i]) : opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {q.type === 'checkbox' && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={answers[q.id] !== false} // default true
                                        onChange={(e) => handleInput(e.target.checked)}
                                        style={{ width: 20, height: 20, marginTop: 2, accentColor: 'var(--accent-purple)' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <CalendarCheck size={16} color="var(--accent-cyan)" />
                                            {q.labelKey ? t(q.labelKey) : q.label}
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                            ✨ {q.descKeys ? t(q.descKeys[0]) : q.desc.split('\n')[0]}<br /><br />
                                            <span style={{ color: '#f59e0b' }}>⚠️ {q.descKeys ? t(q.descKeys[1]) : q.desc.split('\n')[1].replace('Note: ', '')}</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}

                    </div>
                </div>

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 16 }}>
                    <button
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 0}
                        style={{ padding: '14px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 500, opacity: step === 0 ? 0.5 : 1, width: '48%' }}
                    >
                        ← {t('assessment.prev') || 'Previous'}
                    </button>

                    {step < QUESTIONS.length - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isAnswered}
                            style={{ padding: '14px 24px', borderRadius: 12, background: isAnswered ? '#6366f1' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: isAnswered ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', width: '48%' }}
                        >
                            {t('assessment.next') || 'Next'} <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{ padding: '14px 24px', borderRadius: 12, background: 'var(--gradient-main)', color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '48%' }}
                        >
                            {submitting ? (t('assessment.status_submit') || 'Processing...') : `⚡ ${t('assessment.next') || 'Generate Plan'}`}
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
