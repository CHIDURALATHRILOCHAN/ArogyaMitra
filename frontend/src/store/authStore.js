/**
 * Activity 4.4 — authStore.js
 * Zustand store persisted to localStorage.
 * Holds full user profile including fitness preferences,
 * streak_points, charity_donations, and assessment status.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usePlanStore } from './planStore'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            // ── Actions ────────────────────────────────────────────
            login: (user, token) => set({ user, token, isAuthenticated: true }),

            logout: () => {
                usePlanStore.getState().clearAllPlans();
                set({ user: null, token: null, isAuthenticated: false });
            },

            updateUser: (updates) => set(state => ({
                user: state.user ? { ...state.user, ...updates } : updates
            })),

            // Update specific fitness stats from API response
            syncUserStats: (stats) => set(state => ({
                user: state.user ? {
                    ...state.user,
                    streak_days: stats.streak_days ?? state.user.streak_days,
                    total_workouts: stats.total_workouts ?? state.user.total_workouts,
                    total_donations: stats.total_donations ?? state.user.total_donations,
                    fitness_goal: stats.fitness_goal ?? state.user.fitness_goal,
                    fitness_level: stats.fitness_level ?? state.user.fitness_level,
                    workout_preference: stats.workout_preference ?? state.user.workout_preference,
                    diet_preference: stats.diet_preference ?? state.user.diet_preference,
                } : state.user
            })),
        }),
        {
            name: 'arogya-auth',             // localStorage key
            partialize: (state) => ({        // only persist these fields
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
