import AIChatSimulator from '../components/AIChatSimulator'

export default function BoardroomPage() {
  return (
    <div className="page">
      <div className="card">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 6 }}>Boardroom Simulation</h2>
          <p className="muted">
            Stress-test your technical intuition against our Senior MD model. Unlimited access for logged-in users.
          </p>
        </div>
        <AIChatSimulator />
      </div>
    </div>
  )
}
