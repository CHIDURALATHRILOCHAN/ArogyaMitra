import React, { useState, useEffect } from 'react'
import { RefreshCw, ShoppingCart, Apple, Beef, Wheat } from 'lucide-react'
import { nutritionApi, progressApi } from '../services/api'
import { usePlanStore } from '../store/planStore'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' }
const MACRO_COLORS = { protein: '#a855f7', carbs: '#06b6d4', fat: '#f59e0b' }

export default function NutritionPage() {
    const navigate = useNavigate()
    const { mealPlan, setMealPlan } = usePlanStore()
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState('Today') // 'Today', 'This Week', 'Shopping List'
    const [activeDay, setActiveDay] = useState(0) // 0-6 corresponding to days of week
    const [error, setError] = useState('')
    const [completedMeals, setCompletedMeals] = useState({}) // track { "0-breakfast": true }
    const [recipeModal, setRecipeModal] = useState(null)   // { title, image, ingredients, instructions, nutrients }
    const [recipeLoading, setRecipeLoading] = useState(false)

    useEffect(() => { if (!mealPlan) loadPlan() }, [])

    const toggleMealCompletion = async (dayIndex, mealType) => {
        const key = `${dayIndex}-${mealType}`
        const isCompleted = completedMeals[key]

        setCompletedMeals(prev => ({ ...prev, [key]: !isCompleted }))

        try {
            const today = new Date().toISOString().split('T')[0]
            await progressApi.log({
                log_date: today,
                healthy_meals: isCompleted ? -1 : 1
            })
        } catch (e) {
            console.error('Failed to log meal progress', e)
            // Revert on failure
            setCompletedMeals(prev => ({ ...prev, [key]: isCompleted }))
        }
    }

    const loadPlan = async () => {
        setLoading(true)
        try { const { data } = await nutritionApi.getPlan(); setMealPlan(data) } catch { setError('No meal plan found.') }
        setLoading(false)
    }

    const generateNew = async () => {
        setGenerating(true)
        try { const { data } = await nutritionApi.generate(); setMealPlan(data) } catch { }
        setGenerating(false)
    }

    const viewRecipe = async (mealName) => {
        setRecipeModal({ loading: true, title: mealName })
        setRecipeLoading(true)
        try {
            const { data } = await nutritionApi.getRecipe(mealName)
            if (data.recipe) {
                setRecipeModal(data.recipe)
            } else {
                setRecipeModal({ title: mealName, error: data.message || 'No recipe found' })
            }
        } catch {
            setRecipeModal({ title: mealName, error: 'Failed to fetch recipe' })
        }
        setRecipeLoading(false)
    }

    const plan = mealPlan?.plan_data
    const days = plan?.days || []
    const grocery = mealPlan?.grocery_list || {}
    const currentDay = days[activeDay]

    if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}><Navbar /><div className="spinner" /></div>
    if (error) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}><Navbar /><div style={{ textAlign: 'center', padding: '80px 24px' }}><p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p><button className="btn-primary" onClick={() => navigate('/assessment')}>Take Assessment</button></div></div>

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Navbar />

            {/* ===== RECIPE MODAL ===== */}
            {recipeModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
                    onClick={() => setRecipeModal(null)}>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: 32, maxWidth: 680, width: '90%', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--border)' }}
                        onClick={e => e.stopPropagation()}>
                        {recipeModal.loading ? (
                            <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto 16px' }} /><p>Fetching recipe from Spoonacular...</p></div>
                        ) : recipeModal.error ? (
                            <><h2>{recipeModal.title}</h2><p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>{recipeModal.error}</p></>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                                    {recipeModal.image && <img src={recipeModal.image} alt={recipeModal.title} style={{ width: 180, height: 130, objectFit: 'cover', borderRadius: 12 }} />}
                                    <div>
                                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--accent-purple)' }}>{recipeModal.title}</h2>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            {recipeModal.readyInMinutes && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>⏱ {recipeModal.readyInMinutes} mins</span>}
                                            {recipeModal.servings && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🍽 {recipeModal.servings} servings</span>}
                                        </div>
                                        {recipeModal.nutrients && (
                                            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                                                {Object.entries(recipeModal.nutrients).slice(0, 4).map(([k, v]) => (
                                                    <div key={k} style={{ background: 'rgba(168,85,247,0.1)', borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>
                                                        <span style={{ color: 'var(--accent-purple)' }}>{k}:</span> {v}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {recipeModal.ingredients?.length > 0 && (
                                    <div style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--accent-cyan)' }}>🥗 Ingredients</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {recipeModal.ingredients.map((ing, i) => (
                                                <span key={i} style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>
                                                    {ing.amount} {ing.unit} {ing.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {recipeModal.instructions?.length > 0 && (
                                    <div>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--accent-green)' }}>📋 Instructions</h3>
                                        <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {recipeModal.instructions.map(s => (
                                                <li key={s.step} style={{ display: 'flex', gap: 12 }}>
                                                    <span style={{ minWidth: 28, height: 28, background: 'var(--accent-green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{s.step}</span>
                                                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{s.text}</p>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                                {recipeModal.sourceUrl && (
                                    <a href={recipeModal.sourceUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ display: 'inline-block', marginTop: 20, fontSize: 13, color: 'var(--accent-purple)' }}>
                                        View Full Recipe ↗
                                    </a>
                                )}
                            </>
                        )}
                        <button className="btn-secondary" onClick={() => setRecipeModal(null)}
                            style={{ marginTop: 24, width: '100%' }}>Close</button>
                    </div>
                </div>
            )}

            <div className="container" style={{ padding: '40px 24px', maxWidth: 1100, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-purple)', marginBottom: 8 }}>Indian Nutrition Plans</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        AI-powered traditional Indian meal planning for optimal nutrition 💚
                        <br /><span style={{ fontSize: 12, opacity: 0.6 }}>Daily target: {plan?.daily_calorie_target} kcal</span>
                    </p>
                </div>

                {/* Tabs Bar */}
                <div style={{ display: 'flex', marginBottom: 32 }}>
                    <div style={{
                        display: 'inline-flex',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 12,
                        padding: 6,
                        gap: 6,
                        border: '1px solid var(--border)'
                    }}>
                        {['Today', 'This Week', 'Shopping List'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: activeTab === tab ? '#ffffff' : 'transparent',
                                    color: activeTab === tab ? '#000000' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: activeTab === tab ? 700 : 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'all 0.2s'
                                }}>
                                {tab === 'Today' && <span>🥣</span>}
                                {tab === 'This Week' && <span>📅</span>}
                                {tab === 'Shopping List' && <ShoppingCart size={16} />}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div>
                    {/* Shopping List Tab */}
                    {activeTab === 'Shopping List' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', maxWidth: 900 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}><ShoppingCart size={20} /> Weekly Shopping List</h2>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {Object.entries(grocery).map(([category, items]) => (
                                    <React.Fragment key={category}>
                                        {(items || []).map(item => (
                                            <div key={item} style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 12,
                                                padding: '16px 24px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }} className="hover:bg-[rgba(255,255,255,0.06)]">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</span>
                                                    </div>
                                                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{item}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                    <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>×1</span>
                                                    <button
                                                        style={{
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 20px',
                                                            borderRadius: 8,
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                                                        }}
                                                        onClick={() => window.open(`https://blinkit.com/s/?q=${encodeURIComponent(item)}`, '_blank', 'noopener,noreferrer')}
                                                    >
                                                        <ShoppingCart size={15} /> Buy <span style={{ fontSize: 14 }}>↗</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Today Tab */}
                    {activeTab === 'Today' && currentDay && (
                        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                            {/* Meals Grid (Takes up remaining space) */}
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                                {Object.entries(currentDay.meals || {}).map(([mealType, meal]) => {
                                    const isCompleted = completedMeals[`${activeDay}-${mealType}`]
                                    return (
                                        <div key={mealType} className="card" style={{ padding: 24, position: 'relative', opacity: isCompleted ? 0.7 : 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ fontSize: 24 }}>{MEAL_ICONS[mealType]}</div>
                                                    <div>
                                                        <div style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>{mealType}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--accent-orange)' }}>
                                                            {mealType === 'breakfast' ? '7:00 AM' : mealType === 'lunch' ? '12:30 PM' : mealType === 'dinner' ? '7:30 PM' : '4:00 PM'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleMealCompletion(activeDay, mealType)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: `1px solid ${isCompleted ? 'var(--accent-green)' : 'var(--text-secondary)'}`,
                                                        borderRadius: 8,
                                                        width: 32,
                                                        height: 32,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        color: isCompleted ? 'var(--accent-green)' : 'var(--text-secondary)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    ✓
                                                </button>
                                            </div>

                                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, lineHeight: 1.4, color: 'var(--text-primary)' }}>{meal.name}</h3>

                                            {/* Macros row */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0', marginBottom: 20 }}>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Calories</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800 }}>{meal.calories}</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Protein</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800 }}>{meal.protein}g</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Carbs</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800 }}>{meal.carbs}g</div>
                                                </div>
                                                <div style={{ textAlign: 'center', flex: 1 }}>
                                                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Fat</div>
                                                    <div style={{ fontSize: 14, fontWeight: 800 }}>{meal.fat}g</div>
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Ingredients:</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {(meal.ingredients || []).map(ing => <span key={ing} style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '4px 8px', color: '#ccc' }}>{ing}</span>)}
                                                </div>
                                                <button
                                                    onClick={() => viewRecipe(meal.name)}
                                                    style={{ marginTop: 12, width: '100%', padding: '8px 12px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, color: 'var(--accent-purple)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                                    🍳 View Full Recipe
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Daily Summary Sidebar */}
                            <div style={{ width: 340, flexShrink: 0 }}>
                                <div className="card" style={{ padding: 24 }}>
                                    <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>📊 Daily Summary<br />Breakdown</h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        {currentDay.daily_totals && Object.entries(currentDay.daily_totals).map(([key, val]) => (
                                            <div key={key} style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: 13, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key}</span>
                                                    <span style={{ fontWeight: 800, fontSize: 14, color: MACRO_COLORS[key] || 'var(--text-primary)', textAlign: 'right' }}>
                                                        {typeof val === 'number' ? val.toFixed(0) : val}
                                                        {key !== 'calories' ? 'g' : ''}
                                                        {key === 'calories' && <div style={{ fontSize: 10, color: 'var(--text-primary)', marginTop: 2 }}>kcal</div>}
                                                    </span>
                                                </div>
                                                {key !== 'calories' && (
                                                    <div className="progress-bar" style={{ height: 4, background: 'rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                                                        <div className="progress-fill" style={{ width: `${Math.min(100, (val / (key === 'protein' ? 150 : key === 'carbs' ? 250 : 70)) * 100)}%`, background: MACRO_COLORS[key] || 'var(--gradient-main)' }} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* This Week Tab */}
                    {activeTab === 'This Week' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {days.map((d, i) => (
                                <div key={i} className="card" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                                    {/* Highlight bar for active day */}
                                    {activeDay === i && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--accent-green)' }} />}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 18 }}>🗓️</span> {d.day}
                                        </h3>
                                        {activeDay === i && <span className="badge badge-green" style={{ fontSize: 11, padding: '2px 8px' }}>Today</span>}
                                    </div>

                                    <div className="grid-4" style={{ gap: 12 }}>
                                        {Object.entries(d.meals || {}).map(([mealType, meal]) => {
                                            const isMealCompleted = completedMeals[`${i}-${mealType}`]
                                            return (
                                                <div key={mealType} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)', position: 'relative' }}>
                                                    {isMealCompleted && (
                                                        <div style={{ position: 'absolute', top: 12, right: 12, color: 'var(--accent-green)', fontSize: 12, fontWeight: 700 }}>✓ Done</div>
                                                    )}
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: 4 }}>
                                                        {MEAL_ICONS[mealType]} {mealType}
                                                    </div>
                                                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, lineHeight: 1.3, minHeight: 40, opacity: isMealCompleted ? 0.6 : 1 }}>
                                                        {meal.name}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-orange)' }} /> {meal.calories} cal
                                                        </span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-purple)' }} /> {meal.protein}g
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
