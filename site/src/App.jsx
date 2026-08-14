import { useState } from 'react'
import Hero from './components/Hero'
import SignupForm from './components/SignupForm'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [account, setAccount] = useState(null)

  if (account) {
    return <Dashboard account={account} />
  }

  return (
    <>
      <Hero />
      <SignupForm onSignup={setAccount} />
    </>
  )
}

export default App
