import { useState } from 'react'
import { useSelector } from 'react-redux'
import Hero from './components/Hero'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const [authView, setAuthView] = useState('login')

  if (isAuthenticated) {
    return <Dashboard />
  }

  return (
    <>
      <Hero />
      {authView === 'login' ? (
        <LoginForm onSwitchToSignup={() => setAuthView('signup')} />
      ) : (
        <SignupForm onSwitchToLogin={() => setAuthView('login')} />
      )}
    </>
  )
}

export default App
