import React, { useRef, useState, useEffect } from 'react';
import { Camera, Play, Pause, X, CheckCircle, SkipForward } from 'lucide-react';

// phase: 'idle' | 'working' | 'resting' | 'done'
export default function LiveWorkoutPage({ exercise, videoPlaceholder, onComplete, onCancel }) {
    const videoRef = useRef(null);

    const [phase, setPhase] = useState('idle');   // idle | working | resting | done
    const [reps, setReps] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [restSeconds, setRestSeconds] = useState(0);
    const [loadingModel, setLoadingModel] = useState(false);
    const [status, setStatus] = useState('');

    // Refs so MediaPipe callback always sees fresh values
    const phaseRef = useRef('idle');
    const stageRef = useRef('down');
    const repsRef = useRef(0);
    const currentSetRef = useRef(1);
    const exerciseRef = useRef(exercise);
    const poseRef = useRef(null);
    const animFrameRef = useRef(null);
    const restTimerRef = useRef(null);

    // Keep refs in sync
    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { repsRef.current = reps; }, [reps]);
    useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);
    useEffect(() => { exerciseRef.current = exercise; }, [exercise]);

    // ---------- Angle helper ----------
    const calcAngle = (a, b, c) => {
        const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(rad * 180 / Math.PI);
        if (angle > 180) angle = 360 - angle;
        return angle;
    };

    // ---------- Start rest between sets ----------
    const startRest = (completedSet, restDuration = 30) => {
        phaseRef.current = 'resting';
        setPhase('resting');
        setRestSeconds(restDuration);

        restTimerRef.current = setInterval(() => {
            setRestSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(restTimerRef.current);
                    beginNextSet(completedSet + 1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const skipRest = () => {
        clearInterval(restTimerRef.current);
        beginNextSet(currentSetRef.current + 1);
    };

    const beginNextSet = (nextSet) => {
        repsRef.current = 0;
        stageRef.current = 'down';
        setReps(0);
        setCurrentSet(nextSet);
        currentSetRef.current = nextSet;
        phaseRef.current = 'working';
        setPhase('working');
    };

    // ---------- MediaPipe onResults ----------
    const onResultsCallback = (results) => {
        if (phaseRef.current !== 'working') return;
        if (!results.poseLandmarks) return;

        const lm = results.poseLandmarks;
        const ex = exerciseRef.current;
        const exName = (ex.exercise || '').toLowerCase();

        let a, b, c;
        if (exName.includes('squat') || exName.includes('lunge') || exName.includes('leg')) {
            a = lm[23]; b = lm[25]; c = lm[27];   // Hip, Knee, Ankle
        } else if (exName.includes('plank') || exName.includes('crunch') || exName.includes('sit')) {
            a = lm[11]; b = lm[23]; c = lm[25];   // Shoulder, Hip, Knee
        } else {
            a = lm[11]; b = lm[13]; c = lm[15];   // Shoulder, Elbow, Wrist
        }

        if (!a || !b || !c) return;
        if ((a.visibility ?? 1) < 0.4 || (b.visibility ?? 1) < 0.4 || (c.visibility ?? 1) < 0.4) return;

        const angle = calcAngle(a, b, c);

        if (angle > 155 && stageRef.current === 'down') {
            stageRef.current = 'up';
            const newReps = repsRef.current + 1;
            repsRef.current = newReps;
            setReps(newReps);

            const targetReps = parseInt(ex.reps) || 10;
            const totalSets = parseInt(ex.sets) || 3;

            if (newReps >= targetReps) {
                const doneSet = currentSetRef.current;
                if (doneSet >= totalSets) {
                    // All sets complete
                    phaseRef.current = 'done';
                    setPhase('done');
                    stopDetection();
                    onComplete({ reps: newReps, setsCompleted: doneSet });
                } else {
                    // Go to rest
                    startRest(doneSet);
                }
            }
        } else if (angle < 90) {
            stageRef.current = 'down';
        }
    };

    // ---------- MediaPipe init ----------
    const initPose = async () => {
        setLoadingModel(true);
        setStatus('Loading AI model...');
        if (!window.Pose) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js';
                s.crossOrigin = 'anonymous';
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        const pose = new window.Pose({
            locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
        });
        pose.setOptions({
            modelComplexity: 1, smoothLandmarks: true,
            enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
        });
        pose.onResults(onResultsCallback);
        await pose.initialize();
        poseRef.current = pose;
        setLoadingModel(false);
        setStatus('');
        return pose;
    };

    const stopDetection = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
    };

    const stopCamera = () => {
        phaseRef.current = 'idle';
        setPhase('idle');
        stopDetection();
        clearInterval(restTimerRef.current);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startCamera = async () => {
        let pose = poseRef.current;
        if (!pose) {
            try { pose = await initPose(); } catch {
                setStatus('Failed to load AI model.'); setLoadingModel(false); return;
            }
        }
        let ms;
        try {
            ms = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        } catch { setStatus('Camera access denied.'); return; }

        videoRef.current.srcObject = ms;
        await new Promise(r => { videoRef.current.onloadedmetadata = r; });
        await videoRef.current.play();

        phaseRef.current = 'working';
        setPhase('working');

        const detect = async () => {
            if (phaseRef.current === 'idle') return;
            if (videoRef.current?.readyState >= 2 && poseRef.current && phaseRef.current === 'working') {
                try { await poseRef.current.send({ image: videoRef.current }); } catch { }
            }
            animFrameRef.current = requestAnimationFrame(detect);
        };
        animFrameRef.current = requestAnimationFrame(detect);
    };

    const toggleWorkout = () => {
        if (phase === 'idle') { startCamera(); }
        else { stopCamera(); }
    };

    useEffect(() => {
        return () => {
            phaseRef.current = 'idle';
            stopDetection();
            clearInterval(restTimerRef.current);
            if (videoRef.current?.srcObject)
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        };
    }, []);

    const totalSets = parseInt(exercise.sets) || 3;
    const targetReps = parseInt(exercise.reps) || 10;
    const isWorking = phase === 'working';
    const isResting = phase === 'resting';

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-primary)', zIndex: 1000, overflowY: 'auto' }}>
            {/* Navbar */}
            <div className="navbar" style={{ padding: '0 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--gradient-main)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💪</div>
                    <div>
                        <h2 style={{ fontSize: 18, margin: 0 }}>{exercise.exercise}</h2>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sets: {exercise.sets} • Reps: {exercise.reps}</span>
                    </div>
                </div>
                <button className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => { stopCamera(); onCancel(); }}>
                    <X size={16} /> Exit
                </button>
            </div>

            {/* ========== REST PHASE OVERLAY ========== */}
            {isResting && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000,
                    background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 32, backdropFilter: 'blur(6px)'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
                        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#10b981', margin: 0 }}>Set {currentSet} Complete!</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 18 }}>
                            {currentSet < totalSets ? `Next up: Set ${currentSet + 1} of ${totalSets}` : ''}
                        </p>
                    </div>

                    {/* Circular countdown */}
                    <div style={{ position: 'relative', width: 160, height: 160 }}>
                        <svg viewBox="0 0 100 100" style={{ width: 160, height: 160, transform: 'rotate(-90deg)' }}>
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - restSeconds / 30)}`}
                                style={{ transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: 40, fontWeight: 900, color: 'white' }}>{restSeconds}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>rest</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                        <button className="btn-primary" onClick={skipRest}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 16 }}>
                            <SkipForward size={18} /> Skip Rest — Start Set {currentSet + 1}
                        </button>
                        <button className="btn-secondary" onClick={() => { stopCamera(); onComplete({ reps, setsCompleted: currentSet }); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 16 }}>
                            <CheckCircle size={18} /> End Workout
                        </button>
                    </div>
                </div>
            )}

            {/* ========== MAIN LAYOUT ========== */}
            <div className="container" style={{ padding: '32px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 24 }}>

                    {/* Left: Video + Instructions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {videoPlaceholder && (
                            <div style={{ padding: 0, overflow: 'hidden', height: 350, background: '#000', borderRadius: 16 }}>
                                <iframe width="100%" height="100%"
                                    src={`https://www.youtube.com/embed/${videoPlaceholder}?autoplay=1&mute=1&rel=0`}
                                    title="Workout Guide" frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen />
                            </div>
                        )}

                        <div className="card">
                            <h3 style={{ fontSize: 18, marginBottom: 16, color: 'var(--accent-purple)' }}>Instructions</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{exercise.description || 'Start in correct position. Maintain control throughout the movement.'}</p>
                            <div style={{ marginTop: 24 }}>
                                {isWorking ? (
                                    <button className="btn-secondary" onClick={toggleWorkout}
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, borderColor: '#ef4444', color: '#ef4444' }}>
                                        <Pause size={18} /> Pause
                                    </button>
                                ) : (
                                    <button className="btn-primary" onClick={toggleWorkout} disabled={loadingModel || isResting}
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}>
                                        {loadingModel
                                            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading AI...</>
                                            : <><Play size={18} /> {phase !== 'idle' ? 'Resume' : 'Start Workout'}</>}
                                    </button>
                                )}
                                {status && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-cyan)', textAlign: 'center' }}>{status}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right: Camera + Progress */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Camera feed */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', height: 350, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <video ref={videoRef} playsInline muted
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: phase !== 'idle' ? 'block' : 'none' }} />
                            {phase === 'idle' && (
                                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                                    <Camera size={48} style={{ marginBottom: 12 }} />
                                    <p>Camera not started</p>
                                    <p style={{ fontSize: 13 }}>Click "Start Workout" to activate</p>
                                </div>
                            )}
                            {isWorking && (
                                <>
                                    {/* AI active badge */}
                                    <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.7)', padding: '6px 14px', borderRadius: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }} />
                                        <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>AI Tracking Active</span>
                                    </div>
                                    {/* Live rep counter overlay */}
                                    <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(168,85,247,0.9)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 70 }}>
                                        <div style={{ fontSize: 36, fontWeight: 900, color: 'white', lineHeight: 1 }}>{reps}</div>
                                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>/ {targetReps} REPS</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Progress card */}
                        <div className="card">
                            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Workout Progress</h3>

                            {/* Set indicator dots */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                                {Array.from({ length: totalSets }).map((_, i) => (
                                    <div key={i} style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: i + 1 < currentSet ? 'var(--accent-green)'
                                            : i + 1 === currentSet ? 'var(--accent-purple)'
                                                : 'var(--bg-secondary)',
                                        border: `2px solid ${i + 1 === currentSet ? 'var(--accent-purple)' : 'transparent'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 700, color: 'white',
                                        boxShadow: i + 1 === currentSet ? '0 0 12px var(--accent-purple)' : 'none'
                                    }}>
                                        {i + 1 < currentSet ? '✓' : i + 1}
                                    </div>
                                ))}
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--accent-purple)' }}>
                                    Set {currentSet} of {totalSets}
                                </div>
                                <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: 4, background: 'var(--accent-purple)', width: `${(reps / targetReps) * 100}%`, transition: 'width 0.2s' }} />
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>{reps} / {targetReps} reps</div>
                            </div>

                            <button className="btn-primary"
                                onClick={() => { stopCamera(); clearInterval(restTimerRef.current); onComplete({ reps, setsCompleted: currentSet }); }}
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8, background: 'var(--accent-green)' }}>
                                <CheckCircle size={18} /> Complete Early
                            </button>
                        </div>

                        {/* Pro tips */}
                        <div className="card" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                            <h3 style={{ fontSize: 15, color: 'var(--accent-orange)', marginBottom: 10 }}>⚡ Pro Tips</h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <li>✓ Face the camera so your full upper body is visible</li>
                                <li>✓ Ensure good lighting on your body</li>
                                <li>✓ Perform full range of motion for accurate counting</li>
                                <li>✓ Use the rest period between sets to recover</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
