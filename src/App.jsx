import { useState } from 'react'
import { useSelector } from 'react-redux'
import Hero from './components/Hero'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import ComingSoon from './components/ComingSoon'
import './App.css'

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const [authView, setAuthView] = useState('login')
  const [activeTab, setActiveTab] = useState('Dashboard')

  if (isAuthenticated) {
    return (
      <div className="dashboard">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'Dashboard' ? <Dashboard /> : <ComingSoon label={activeTab} />}
      </div>
    )
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
