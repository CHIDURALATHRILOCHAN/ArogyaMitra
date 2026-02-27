import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AROMIFloating from './components/AROMIFloating'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AssessmentPage from './pages/AssessmentPage'
import DashboardPage from './pages/DashboardPage'
import WorkoutPage from './pages/WorkoutPage'
import NutritionPage from './pages/NutritionPage'
import CoachPage from './pages/CoachPage'
import ProgressPage from './pages/ProgressPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuthStore()
    return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
    const { isAuthenticated } = useAuthStore()
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
    const { isAuthenticated } = useAuthStore()

    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
                <Route path="/assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/workouts" element={<ProtectedRoute><WorkoutPage /></ProtectedRoute>} />
                <Route path="/nutrition" element={<ProtectedRoute><NutritionPage /></ProtectedRoute>} />
                <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Activity 4.3: AROMI floating assistant — visible on all authenticated pages */}
            {isAuthenticated && <AROMIFloating />}
        </BrowserRouter>
    )
}
