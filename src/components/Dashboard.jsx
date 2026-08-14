function Dashboard({ account }) {
  return (
    <section className="dashboard">
      <h1>Welcome, {account.email}</h1>
      <p>Your account was created. This is a placeholder for the app.</p>
    </section>
  )
}

export default Dashboard
