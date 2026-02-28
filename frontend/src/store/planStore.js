/**
 * Activity 4.4 — planStore.js
 * Zustand store for workout plans, meal plans, assessment,
 * progress data, and AROMI chat history.
 * Persisted to localStorage so data survives page refreshes.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePlanStore = create(
    persist(
        (set, get) => ({
            // ── Core Plan Data ─────────────────────────────────────
            workoutPlan: null,
            mealPlan: null,
            assessment: null,
            progressData: null,

            // ── UI State ───────────────────────────────────────────
            calendarConnected: false,
            lastSyncedAt: null,

            // ── AROMI Chat History (Activity 4.3) ──────────────────
            aromiMessages: [],
            aromiOpen: false,

            // ── Actions ────────────────────────────────────────────
            setWorkoutPlan: (plan) => set({ workoutPlan: plan }),
            setMealPlan: (plan) => set({ mealPlan: plan }),
            setAssessment: (data) => set({ assessment: data }),
            setProgressData: (data) => set({ progressData: data }),
            setCalendarStatus: (val) => set({ calendarConnected: val }),
            setLastSynced: (time) => set({ lastSyncedAt: time }),

            // AROMI floating widget
            openAromi: () => set({ aromiOpen: true }),
            closeAromi: () => set({ aromiOpen: false }),
            toggleAromi: () => set(s => ({ aromiOpen: !s.aromiOpen })),

            addAromiMessage: (msg) => set(s => ({
                aromiMessages: [...s.aromiMessages, {
                    id: Date.now().toString(),
                    ...msg,
                    timestamp: new Date()
                }]
            })),

            clearAromiHistory: () => set({ aromiMessages: [] }),

            clearAllPlans: () => set({
                workoutPlan: null,
                mealPlan: null,
                assessment: null,
                progressData: null,
                aromiMessages: []
            }),

            // Computed helpers (not persisted, called as functions)
            hasWorkoutPlan: () => !!get().workoutPlan,
            hasMealPlan: () => !!get().mealPlan,
            hasAssessment: () => !!get().assessment,
        }),
        {
            name: 'arogya-plans',
            partialize: (state) => ({           // persist only essential data
                workoutPlan: state.workoutPlan,
                mealPlan: state.mealPlan,
                assessment: state.assessment,
                calendarConnected: state.calendarConnected,
                aromiMessages: state.aromiMessages.slice(-50), // keep last 50 msgs
            }),
        }
    )
)
