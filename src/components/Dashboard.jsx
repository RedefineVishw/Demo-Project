import { useSelector } from 'react-redux'

const STAT_CARDS = [
  { label: 'Tests run this week', value: '1,284' },
  { label: 'Bugs caught', value: '37' },
  { label: 'Avg. release time', value: '4.2h' },
]

const ACTIVITY = [
  { title: 'Checkout flow regression suite', detail: 'Passed · 42 checks', time: '2h ago' },
  { title: 'Signup form validation', detail: 'Passed · 18 checks', time: '5h ago' },
  { title: 'Nightly browser matrix', detail: '1 flaky retry · 96 checks', time: 'Yesterday' },
]

function Dashboard() {
  const user = useSelector((state) => state.auth.user)

  return (
    <main className="dashboard-main">
      <section className="dashboard-welcome">
        <h1>Welcome back{user?.email ? `, ${user.email}` : ''}</h1>
        <p>Here's a snapshot of what's happening across your test suites.</p>
      </section>

      <section className="dashboard-stats" aria-label="Summary stats">
        {STAT_CARDS.map((card) => (
          <div className="stat-card" key={card.label}>
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </section>

      <section className="dashboard-activity" aria-label="Recent activity">
        <h2>Recent activity</h2>
        <ul>
          {ACTIVITY.map((item) => (
            <li key={item.title}>
              <div>
                <span className="activity-title">{item.title}</span>
                <span className="activity-detail">{item.detail}</span>
              </div>
              <span className="activity-time">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default Dashboard
