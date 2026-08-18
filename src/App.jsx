import { useSelector } from 'react-redux'
import Hero from './components/Hero'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  if (isAuthenticated) {
    return <Dashboard />
  }

  return (
    <>
      <Hero />
      <LoginForm />
    </>
  )
}

export default App
