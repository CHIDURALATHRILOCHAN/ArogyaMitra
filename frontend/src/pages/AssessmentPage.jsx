import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, CheckCircle, Target, User, Activity, Flame, MapPin, Clock, Stethoscope, AlertTriangle, Pill, CalendarCheck, Scale, Ruler } from 'lucide-react'
import { assessmentApi, workoutApi, nutritionApi } from '../services/api'
import { usePlanStore } from '../store/planStore'

// Centralized question definitions matching the backend
const QUESTIONS = [
    { id: 'age', q: 'What is your age?', icon: <User size={20} color="#f59e0b" />, type: 'number', placeholder: '22', unit: '' },
    { id: 'gender', q: 'What is your gender?', icon: <User size={20} color="#a855f7" />, type: 'options', opts: ['Male', 'Female', 'Other'] },
    { id: 'height_cm', q: 'What is your height (in cm)?', icon: <Ruler size={20} color="#64748b" />, type: 'number', placeholder: '170', unit: 'cm' },
    { id: 'weight_kg', q: 'What is your weight (in kg)?', icon: <Scale size={20} color="#f59e0b" />, type: 'number', placeholder: 'e.g., 75', unit: 'kg' },
    { id: 'fitness_level', q: 'What is your current fitness level?', icon: <Activity size={20} color="#f59e0b" />, type: 'options', opts: ['Beginner', 'Intermediate', 'Advanced'] },
    { id: 'fitness_goal', q: 'What is your primary fitness goal?', icon: <Target size={20} color="#ef4444" />, type: 'options', opts: ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Strength Training', 'Endurance'] },
    { id: 'workout_location', q: 'Where do you prefer to work out?', icon: <MapPin size={20} color="#10b981" />, type: 'options', opts: ['Home', 'Gym', 'Outdoor', 'Mixed'] },
    { id: 'workout_time', q: 'When do you prefer to work out?', icon: <Clock size={20} color="#ef4444" />, type: 'options', opts: ['Morning', 'Evening'] },
    { id: 'medical_history', q: 'Do you have any medical history? (Optional)', icon: <Stethoscope size={20} color="#a855f7" />, type: 'text', placeholder: 'e.g., Heart condition, Hypertension, etc.' },
    { id: 'health_conditions', q: 'Do you have any current health conditions? (Optional)', icon: <AlertTriangle size={20} color="#f59e0b" />, type: 'text', placeholder: 'e.g., Diabetes, Asthma, Arthritis, etc.' },
    { id: 'injuries', q: 'Do you have any injuries or physical limitations? (Optional)', icon: <Activity size={20} color="#ef4444" />, type: 'text', placeholder: 'e.g., Knee pain, lower back issues...' },
    { id: 'equipment', q: 'What equipment do you have access to?', icon: <Flame size={20} color="#f59e0b" />, type: 'options', opts: ['No equipment (bodyweight)', 'Basic Home Gym', 'Full Gym Access'] },
    { id: 'diet_type', q: 'What is your diet type?', icon: <Flame size={20} color="#10b981" />, type: 'options', opts: ['No restriction', 'Vegetarian', 'Vegan', 'Keto', 'High-protein'] },
    { id: 'sync_calendar', q: 'Would you like to sync your plan to Google Calendar?', icon: <CalendarCheck size={20} color="#3b82f6" />, type: 'checkbox', label: 'Automatically sync plans to my Google Calendar', desc: 'Your workout and nutrition schedule will be added to your Google Calendar for easy tracking. \nNote: Make sure to connect your Google Calendar first from the Dashboard!' }
]

export default function AssessmentPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState({})
    const [genStatus, setGenStatus] = useState('Submitting your answers...')
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
            setGenStatus('Analyzing your health profile...')
            await assessmentApi.submit(answers)
            setDone(true)

            setGenStatus('AROMI is crafting your workout plan...')
            const workoutRes = await workoutApi.generate()
            usePlanStore.getState().setWorkoutPlan(workoutRes.data)

            setGenStatus('Designing your personalized nutrition plan...')
            const nutritionRes = await nutritionApi.generate()
            usePlanStore.getState().setMealPlan(nutritionRes.data)

            setGenStatus('All set! Preparing your dashboard...')
            setTimeout(() => navigate('/dashboard'), 1500)
        } catch (e) {
            console.error(e)
            setSubmitting(false)
            alert('Something went wrong. Please try again.')
        }
    }

    if (done || submitting) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: 24, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 64 }} className="float">✨</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {done ? 'Almost Ready!' : 'Finalizing...'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 400 }}>{genStatus}</p>
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
                        <h1 style={{ fontSize: 28, fontWeight: 800, background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Smart Fitness Planner</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Answer a few questions to get your personalized plan</p>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Question {step + 1} of {QUESTIONS.length}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
                        <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--gradient-main)' }} />
                    </div>
                </div>

                {/* Question Card */}
                <div className="card fade-in" key={step} style={{ padding: '32px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 16 }}>

                    <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {q.icon} {q.q}
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
                                {q.opts.map((opt) => (
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
                                        {opt}
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
                                            {q.label}
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                            ✨ {q.desc.split('\n')[0]}<br /><br />
                                            <span style={{ color: '#f59e0b' }}>⚠️ {q.desc.split('\n')[1].replace('Note: ', '')}</span>
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
                        ← Previous
                    </button>

                    {step < QUESTIONS.length - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isAnswered}
                            style={{ padding: '14px 24px', borderRadius: 12, background: isAnswered ? '#6366f1' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: isAnswered ? 'pointer' : 'not-allowed', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', width: '48%' }}
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{ padding: '14px 24px', borderRadius: 12, background: 'var(--gradient-main)', color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '48%' }}
                        >
                            {submitting ? 'Processing...' : 'Generate Plan ⚡'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
