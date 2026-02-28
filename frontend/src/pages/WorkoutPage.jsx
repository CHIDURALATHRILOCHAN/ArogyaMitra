import React, { useState, useEffect } from 'react'
import { Play, ChevronDown, ChevronUp, Dumbbell, Clock, Flame, RefreshCw, CheckCircle2 } from 'lucide-react'
import { workoutApi, progressApi } from '../services/api'
import { usePlanStore } from '../store/planStore'
import { useTranslation } from '../store/settingsStore'
import Navbar from '../components/Navbar'
import LiveWorkoutPage from './LiveWorkoutPage'
import WorkoutSummaryModal from '../components/WorkoutSummaryModal'
import { useNavigate, useLocation } from 'react-router-dom'

export default function WorkoutPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation()
    const { workoutPlan, setWorkoutPlan } = usePlanStore()
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [logging, setLogging] = useState(false)
    const realTodayIndex = (new Date().getDay() + 6) % 7;
    // Make Monday = 0, Tuesday = 1, ... Sunday = 6
    const [activeDay, setActiveDay] = useState(() => {
        return location.state?.targetDay === 'tomorrow' ? (realTodayIndex + 1) % 7 : realTodayIndex
    })
    const isToday = activeDay === realTodayIndex;
    const [videos, setVideos] = useState([])
    const [expandedEx, setExpandedEx] = useState(null)
    const [error, setError] = useState('')
    const [loggedToday, setLoggedToday] = useState(false)
    const [activeLiveWorkout, setActiveLiveWorkout] = useState(null)
    const [liveVideoId, setLiveVideoId] = useState(null)
    const [loadingLive, setLoadingLive] = useState(null)
    const [workoutStats, setWorkoutStats] = useState(null)
    const [completedExercises, setCompletedExercises] = useState([])

    useEffect(() => {
        if (!workoutPlan) { loadPlan() }
        else { loadVideos(workoutPlan.plan_data?.days?.[activeDay]?.youtube_search) }
    }, [])

    const loadPlan = async () => {
        setLoading(true)
        try {
            const { data } = await workoutApi.getPlan()
            setWorkoutPlan(data)
            loadVideos(data.plan_data?.days?.[activeDay]?.youtube_search)
        } catch {
            setWorkoutPlan(null)
            setError('No workout plan found. Complete the assessment first!')
        }
        setLoading(false)
    }

    const loadVideos = async (query) => {
        if (!query) return
        try { const { data } = await workoutApi.getVideos(query); setVideos(data.items || []) } catch { }
    }

    const generateNew = async () => {
        setGenerating(true)
        try { const { data } = await workoutApi.generate(); setWorkoutPlan(data); loadVideos(data.plan_data?.days?.[0]?.youtube_search) } catch { }
        setGenerating(false)
    }

    const startLiveWorkout = async (exercise) => {
        if (!isToday) return; // Prevent launch if not today
        setLoadingLive(exercise.exercise)
        try {
            const { data } = await workoutApi.getVideos(exercise.exercise)
            setLiveVideoId(data.items?.[0]?.videoId || (videos.length > 0 ? videos[0].videoId : null))
        } catch {
            setLiveVideoId(videos.length > 0 ? videos[0].videoId : null)
        }
        setLoadingLive(null)
        setActiveLiveWorkout(exercise)
    }

    const completeLiveWorkout = async (stats) => {
        setCompletedExercises(prev => [...prev, activeLiveWorkout.exercise])
        const finishedCount = completedExercises.length + 1;
        const totalCount = currentDay?.main_workout?.length || 1;

        setActiveLiveWorkout(null)

        // Show summary only if it's the last exercise
        if (finishedCount >= totalCount) {
            setWorkoutStats({
                calories: Math.floor(currentDay?.calories_estimated || 200),
                setsCompleted: stats?.setsCompleted || 3,
                minutes: Math.floor((currentDay?.duration_minutes || 45) * 0.8),
                intensity: Math.floor(Math.random() * 20) + 80 // 80-100%
            })
        }
    }

    const closeSummaryAndLog = async () => {
        setWorkoutStats(null)
        await logWorkout()
    }

    const logWorkout = async () => {
        if (!currentDay) return
        setLogging(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            await progressApi.log({
                log_date: today,
                workouts_done: 1,
                calories_burned: currentDay.calories_estimated || 0,
                mood: 7 // default high mood for completing workout
            })
            setLoggedToday(true)
            setTimeout(() => setLoggedToday(false), 3000)
        } catch (e) {
            console.error('Logging failed', e)
        }
        setLogging(false)
    }

    const plan = workoutPlan?.plan_data
    const days = plan?.days || []
    const currentDay = days[activeDay]

    if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}><Navbar /><div className="spinner" /><p style={{ color: 'var(--text-secondary)' }}>Loading your workout plan...</p></div>
    if (error) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}><Navbar /><div style={{ textAlign: 'center', padding: '80px 24px' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div><p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{t('workout.no_plan') || error}</p><button className="btn-primary" onClick={() => navigate('/assessment')}>Take Assessment</button></div></div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />
            <div className="container" style={{ padding: '32px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800 }}>💪 {t('workout.title')}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{plan?.week_summary}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {currentDay && currentDay.duration_minutes > 0 && isToday && (
                            <button className="btn-primary" onClick={logWorkout} disabled={logging || loggedToday} style={{ display: 'flex', alignItems: 'center', gap: 8, background: loggedToday ? '#10b981' : 'var(--gradient-main)' }}>
                                {loggedToday ? <><CheckCircle2 size={16} /> {t('workout.workout_logged')}</> : logging ? <span className="spinner" style={{ width: 16, height: 16, border: '2px solid white' }} /> : t('workout.log_completion')}
                            </button>
                        )}
                        <button className="btn-secondary" onClick={generateNew} disabled={generating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} /> {generating ? t('workout.regenerating') : t('workout.new_plan')}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, marginBottom: 24, paddingRight: 24 }} className="hide-scroll">
                    {days.map((d, i) => (
                        <div key={i} onClick={() => { setActiveDay(i); loadVideos(d.youtube_search); setLoggedToday(false) }}
                            className="card card-glow"
                            style={{
                                padding: '16px',
                                borderRadius: 12,
                                border: `2px solid ${activeDay === i ? 'var(--accent-purple)' : 'var(--border)'}`,
                                background: activeDay === i ? 'rgba(168,85,247,0.1)' : 'var(--bg-card)',
                                color: activeDay === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                minWidth: 140,
                                flexShrink: 0,
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                            {activeDay === i && <div style={{ position: 'absolute', top: 0, left: 0, height: 4, width: '100%', background: 'var(--gradient-main)' }} />}
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: activeDay === i ? 'var(--accent-purple)' : 'inherit' }}>{d.day}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: 6 }}>{d.focus}</div>
                            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} /> {d.duration_minutes || 'Rest'} min
                            </div>
                        </div>
                    ))}
                </div>

                {currentDay && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
                        {/* Workout detail */}
                        <div>
                            <div className="card" style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Dumbbell size={18} color="var(--accent-purple)" /><span style={{ fontWeight: 700, color: 'var(--accent-purple)', fontSize: 18 }}>{currentDay.focus}</span></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 20 }}><Clock size={14} color="var(--text-secondary)" /><span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{currentDay.duration_minutes || 'Rest'} min</span></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', padding: '4px 12px', borderRadius: 20 }}><Flame size={14} color="#f59e0b" /><span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{currentDay.calories_estimated} kcal</span></div>
                                    </div>

                                    {isToday ? (
                                        <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            ⏳ Incomplete
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(156,163,175,0.1)', border: '1px solid rgba(156,163,175,0.3)', color: '#9ca3af', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            👁️ Preview Mode (Not Today)
                                        </div>
                                    )}
                                </div>

                                {currentDay.duration_minutes === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
                                        <h3>{t('workout.rest_day') || 'Rest Day!'}</h3>
                                        <p style={{ marginTop: 8, fontSize: 14 }}>{t('workout.rest_desc') || 'Take it easy. Recovery is part of progress!'}</p>
                                    </div>
                                ) : (
                                    <>
                                        {currentDay.warmup?.length > 0 && (
                                            <div style={{ marginBottom: 20 }}>
                                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#06b6d4', marginBottom: 10 }}>🔥 Warm-Up</h3>
                                                {currentDay.warmup.map((w, i) => <div key={i} style={{ padding: '8px 12px', background: 'rgba(6,182,212,0.06)', borderRadius: 8, marginBottom: 6, fontSize: 14 }}>{w.exercise} – {w.duration}</div>)}
                                            </div>
                                        )}
                                        <div style={{ marginBottom: 20 }}>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-purple)', marginBottom: 10 }}>💪 {t('workout.today_workout') || 'Main Workout'}</h3>
                                            {currentDay.main_workout?.map((ex, i) => {
                                                const isCompleted = completedExercises.includes(ex.exercise);
                                                return (
                                                    <div key={i} style={{
                                                        background: isCompleted ? 'rgba(16,185,129,0.05)' : 'rgba(168,85,247,0.06)',
                                                        borderRadius: 10,
                                                        marginBottom: 8,
                                                        border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(168,85,247,0.15)'}`,
                                                        overflow: 'hidden',
                                                        opacity: isCompleted ? 0.8 : 1
                                                    }}>
                                                        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setExpandedEx(expandedEx === i ? null : i)}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <div style={{
                                                                    width: 14, height: 14, borderRadius: '50%',
                                                                    background: isCompleted ? 'var(--accent-green)' : 'transparent',
                                                                    border: `2px solid ${isCompleted ? 'var(--accent-green)' : 'var(--text-secondary)'}`,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}>
                                                                    {isCompleted && <CheckCircle2 size={10} color="white" />}
                                                                </div>
                                                                <div>
                                                                    <span style={{ fontWeight: 600, fontSize: 15, textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{ex.exercise}</span>
                                                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                                                                        <span className="badge badge-purple" style={{ padding: '2px 8px', marginRight: 6, opacity: isCompleted ? 0.6 : 1 }}>Sets: {ex.sets}</span>
                                                                        <span className="badge badge-green" style={{ padding: '2px 8px', marginRight: 6, opacity: isCompleted ? 0.6 : 1 }}>Reps: {ex.reps}</span>
                                                                        <span className="badge badge-orange" style={{ padding: '2px 8px', opacity: isCompleted ? 0.6 : 1 }}>Rest: {ex.rest}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isCompleted ? (
                                                                <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <CheckCircle2 size={14} /> Completed
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    className="btn-primary"
                                                                    onClick={(e) => { e.stopPropagation(); startLiveWorkout(ex); }}
                                                                    disabled={loadingLive === ex.exercise || !isToday}
                                                                    style={{ padding: '8px', paddingLeft: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, opacity: isToday ? 1 : 0.5, cursor: isToday ? 'pointer' : 'not-allowed' }}
                                                                >
                                                                    {loadingLive === ex.exercise ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Play size={16} />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {expandedEx === i && !isCompleted && (
                                                            <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                                                                <p style={{ lineHeight: 1.5 }}>{ex.description}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {currentDay.cooldown?.length > 0 && (
                                            <div>
                                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#10b981', marginBottom: 10 }}>🧘 Cool Down</h3>
                                                {currentDay.cooldown.map((c, i) => <div key={i} style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, marginBottom: 6, fontSize: 14 }}>{c.exercise} – {c.duration}</div>)}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Video panel */}
                        <div>
                            <div className="card">
                                <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Play size={18} color="var(--accent-purple)" /> {t('workout.guided_videos') || 'Exercise Videos'}</h3>
                                {videos.length ? videos.map((v, i) => (
                                    <div key={i} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => window.open(`https://www.youtube.com/watch?v=${v.videoId}`, '_blank')}>
                                        <img src={v.thumbnail} alt={v.title} style={{ width: '100%', borderRadius: 10, marginBottom: 6 }} />
                                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{v.title}</p>
                                    </div>
                                )) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No videos available. Add YouTube API key for real videos.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Portals / Modals */}
            {activeLiveWorkout && (
                <LiveWorkoutPage
                    exercise={activeLiveWorkout}
                    videoPlaceholder={liveVideoId}
                    onComplete={completeLiveWorkout}
                    onCancel={() => setActiveLiveWorkout(null)}
                />
            )}

            {workoutStats && (
                <WorkoutSummaryModal
                    stats={workoutStats}
                    onClose={closeSummaryAndLog}
                />
            )}
        </div>
    )
}
