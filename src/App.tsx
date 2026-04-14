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
import Training from './pages/Training'
import ProHome from './pages/ProHome'
import ProPractice from './pages/ProPractice'
import ProExercise from './pages/ProExercise'
import ProCategories from './pages/ProCategories'
import ProProgress from './pages/ProProgress'

export default function App() {
  const { loadProfile, isLoading, isOnboarded, profile } = useUserStore()

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  if (isLoading) {
    return <LoadingScreen />
  }

  const isPro = profile?.userMode === 'professional'

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      {!isOnboarded ? (
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      ) : (
        <Route element={<AppShell />}>
          {/* General Mode Routes */}
          <Route path="/" element={isPro ? <ProHome /> : <Home />} />
          <Route path="/practice" element={isPro ? <ProPractice /> : <Practice />} />
          <Route path="/exercise/:id" element={<Exercise />} />
          <Route path="/categories" element={isPro ? <ProCategories /> : <Categories />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/progress" element={isPro ? <ProProgress /> : <Progress />} />
          <Route path="/training" element={<Training />} />
          <Route path="/settings" element={<Settings />} />

          {/* Professional Mode Routes */}
          <Route path="/pro/practice" element={<ProPractice />} />
          <Route path="/pro/exercise/:id" element={<ProExercise />} />
          <Route path="/pro/categories" element={<ProCategories />} />
          <Route path="/pro/progress" element={<ProProgress />} />

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
