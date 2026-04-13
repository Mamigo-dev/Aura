import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './stores/userStore'
import { AppShell } from './components/layout/AppShell'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Exercise from './pages/Exercise'
import Categories from './pages/Categories'
import Stories from './pages/Stories'
import Progress from './pages/Progress'
import Settings from './pages/Settings'

export default function App() {
  const { loadProfile, isLoading, isOnboarded } = useUserStore()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      {!isOnboarded ? (
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      ) : (
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/exercise/:id" element={<Exercise />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-aura-midnight flex flex-col items-center justify-center gap-6">
      <img src="/Aura/Aura_logo.png" alt="Aura" className="w-20 h-20 rounded-2xl animate-pulse" />
      <div className="gradient-aura-text text-2xl font-bold">Aura</div>
      <div className="w-8 h-8 border-2 border-aura-purple border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
