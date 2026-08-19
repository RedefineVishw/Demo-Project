import { useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'

const NAV_TABS = ['Dashboard', 'Reports', 'Team', 'Settings']

function Navbar({ activeTab, onTabChange }) {
  const dispatch = useDispatch()

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

      <button type="button" className="logout-button" onClick={() => dispatch(logout())}>
        Log out
      </button>
    </header>
  )
}

export default Navbar
