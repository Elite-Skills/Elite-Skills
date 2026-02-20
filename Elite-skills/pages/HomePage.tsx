import { Link } from 'react-router-dom'

import { useAuth } from '../state/AuthContext'

export default function HomePage() {
  const { token, user, logout } = useAuth()

  return (
    <div className="container">
      <header className="header">
        <div className="brand">ATS Resume Checker</div>
        <nav className="nav">
          {token ? (
            <>
              <span className="muted">{user?.email}</span>
              <Link className="btn" to="/checker">
                Open Checker
              </Link>
              <button className="btn secondary" onClick={logout} type="button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn secondary" to="/login">
                Login
              </Link>
              <Link className="btn" to="/register">
                Create Account
              </Link>
            </>
          )}
        </nav>
      </header>

      <div className="card">
        <h1>Improve your resume’s ATS score</h1>
        <p className="muted">
          Upload your resume PDF, paste the job description, and get an ATS score with keyword gaps and actionable tips.
        </p>

        <div className="row">
          <div className="metric">
            <div className="metricTitle">PDF parsing</div>
            <div className="metricValue">Text extraction</div>
          </div>
          <div className="metric">
            <div className="metricTitle">Keyword match</div>
            <div className="metricValue">Missing terms</div>
          </div>
          <div className="metric">
            <div className="metricTitle">Tips</div>
            <div className="metricValue">ATS-friendly structure</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {token ? (
            <Link className="btn" to="/checker">
              Start Checking
            </Link>
          ) : (
            <Link className="btn" to="/register">
              Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
