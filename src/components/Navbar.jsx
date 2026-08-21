import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'

const NAV_TABS = ['Dashboard', 'Reports', 'Team', 'Settings']

function Navbar({ activeTab, onTabChange }) {
  const dispatch = useDispatch()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <header className="dashboard-nav">
      <span className="dashboard-brand">Redefine QA Pilot</span>

      <nav className="navbar-tabs" aria-label="Primary">
        {NAV_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`navbar-tab${tab === activeTab ? ' navbar-tab-active' : ''}`}
            aria-current={tab === activeTab ? 'page' : undefined}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {confirmingLogout ? (
        <div className="logout-confirm" role="group" aria-label="Confirm log out">
          <span className="logout-confirm-text">Log out?</span>
          <button type="button" className="logout-confirm-cancel" onClick={() => setConfirmingLogout(false)}>
            Cancel
          </button>
          <button type="button" className="logout-confirm-yes" onClick={() => dispatch(logout())}>
            Log out
          </button>
        </div>
      ) : (
        <button type="button" className="logout-button" onClick={() => setConfirmingLogout(true)}>
          Log out
        </button>
      )}
    </header>
  )
}

export default Navbar
