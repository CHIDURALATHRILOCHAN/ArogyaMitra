import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
})

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

// Auth
export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data)
}

// Assessment
export const assessmentApi = {
    getQuestions: () => api.get('/assessment/questions'),
    submit: (responses) => api.post('/assessment/submit', { responses }),
    status: () => api.get('/assessment/status'),
    latest: () => api.get('/assessment/latest'),
}

// Workout
export const workoutApi = {
    generate: () => api.post('/workout/generate'),
    getPlan: () => api.get('/workout/plan'),
    getVideos: (query) => api.get(`/workout/videos/${encodeURIComponent(query)}`),
}

// Nutrition
export const nutritionApi = {
    generate: () => api.post('/nutrition/generate'),
    getPlan: () => api.get('/nutrition/plan'),
    getGroceryList: () => api.get('/nutrition/grocery-list'),
    getRecipe: (mealName) => api.get(`/nutrition/recipe/${encodeURIComponent(mealName)}`),
}

// Coach
export const coachApi = {
    chat: (message, userStatus) => api.post('/coach/chat', { message, user_status: userStatus || 'normal' }),
    history: () => api.get('/coach/history'),
    analyzeProgress: () => api.get('/coach/analyze-progress'),
    adjustPlan: (data) => api.post('/coach/adjust-plan', data),
}

// Progress
export const progressApi = {
    log: (data) => api.post('/progress/log', data),
    dashboard: () => api.get('/progress/dashboard'),
    history: () => api.get('/progress/history'),
}

// Calendar
export const calendarApi = {
    getAuthUrl: () => api.get('/calendar/auth-url'),
    sync: () => api.post('/calendar/sync'),
    status: () => api.get('/calendar/status'),
}

export default api
