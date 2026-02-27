import { useEffect, useMemo, useState } from 'react'
import { scanHistory, scanResume, type ScanHistoryItem, type ScanResult } from '../api'
import { useAuth } from '../state/AuthContext'

function formatDate(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString()
}

export default function CheckerPage() {
  useAuth()

  const [jobDescription, setJobDescription] = useState('')
  const [resume, setResume] = useState<File | null>(null)

  const [result, setResult] = useState<ScanResult | null>(null)
  const [history, setHistory] = useState<ScanHistoryItem[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
  }

  const scoreTone = useMemo(() => {
    const score = result?.score ?? 0
    if (score >= 80) return 'good'
    if (score >= 55) return 'warn'
    return 'bad'
  }, [result?.score])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await scanHistory()
        if (!cancelled) setHistory(data.scans)
      } catch {
        if (!cancelled) setHistory([])
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!resume) {
      setError('Please upload a PDF resume.')
      return
    }

    if (!jobDescription.trim()) {
      setError('Please paste the job description.')
      return
    }

    setLoading(true)
    try {
      const data = await scanResume({ resume, jobDescription })
      setResult(data)

      const updated = await scanHistory()
      setHistory(updated.scans)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 0 }}>
        <h2 style={{ marginBottom: 4 }}>ATS Resume Checker</h2>
        <p className="muted" style={{ margin: 0 }}>Upload your resume PDF and paste the job description to get an ATS score with keyword gaps and actionable tips.</p>
      </div>
      <form onSubmit={onSubmit} className="form">
        <div className="card">
          <h2>New Scan</h2>
          <label className="label">
            Resume (PDF)
            <input
              className="input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2>Job Description</h2>
          <label className="label">
            Paste the job description
            <textarea
              className="textarea"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              placeholder="Paste the job description here…"
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <button className="btn" disabled={loading} type="submit" style={{ marginTop: 20 }}>
            {loading ? 'Analyzing…' : 'Get ATS Score'}
          </button>
        </div>
      </form>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Result</h2>
        {!result ? (
          <div className="muted">Upload a PDF and paste a job description to see your ATS score.</div>
        ) : (
          <>
              <div className={`score ${scoreTone}`}>
                <div className="scoreValue">{result.score}</div>
                <div className="scoreLabel">ATS Score</div>
              </div>

              <div className="split">
                <div>
                  <h3>Matched keywords</h3>
                  <div className="chips">
                    {result.matchedKeywords.slice(0, 30).map((k) => (
                      <span key={k} className="chip good">
                        {k}
                      </span>
                    ))}
                    {result.matchedKeywords.length === 0 ? <span className="muted">None</span> : null}
                  </div>
                </div>

                <div>
                  <h3>Missing keywords</h3>
                  <div className="chips">
                    {result.missingKeywords.slice(0, 30).map((k) => (
                      <span key={k} className="chip bad">
                        {k}
                      </span>
                    ))}
                    {result.missingKeywords.length === 0 ? <span className="muted">None</span> : null}
                  </div>
                </div>
              </div>

              <h3 style={{ marginTop: 16 }}>Extracted resume keywords</h3>
              <div className="chips">
                {result.resumeKeywords.slice(0, 40).map((k) => (
                  <span key={`rk-${k}`} className="chip">
                    {k}
                  </span>
                ))}
                {result.resumeKeywords.length === 0 ? <span className="muted">None</span> : null}
              </div>

              <h3 style={{ marginTop: 16 }}>Extracted job description keywords</h3>
              <div className="chips">
                {result.jobKeywords.slice(0, 60).map((k) => (
                  <span key={`jk-${k}`} className="chip">
                    {k}
                  </span>
                ))}
                {result.jobKeywords.length === 0 ? <span className="muted">None</span> : null}
              </div>

              <h3 style={{ marginTop: 16 }}>Tips</h3>
              <div className="list">
                {result.tips.length === 0 ? <div className="muted">No tips — looks good!</div> : null}
                {result.tips.map((t) => (
                  <div key={t} className="listItem">
                    {t}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <h3 style={{ margin: 0 }}>Corrected resume draft</h3>
                  <button className="btn secondary" type="button" onClick={() => copy(result.correctedResume)}>
                    Copy
                  </button>
                </div>
                <textarea className="textarea" readOnly value={result.correctedResume} rows={10} style={{ marginTop: 10 }} />
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <h3 style={{ margin: 0 }}>Suggested additions (based on job description)</h3>
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={() =>
                      copy(
                        [...result.suggestedAdditions.summary, ...result.suggestedAdditions.experienceBullets, ...result.suggestedAdditions.skills]
                          .filter(Boolean)
                          .join('\n')
                      )
                    }
                  >
                    Copy all
                  </button>
                </div>

                <div className="list" style={{ marginTop: 10 }}>
                  <div className="listItem">
                    <div className="muted" style={{ marginBottom: 6 }}>
                      Summary
                    </div>
                    {result.suggestedAdditions.summary.length === 0 ? <div className="muted">No suggestions.</div> : null}
                    {result.suggestedAdditions.summary.map((t) => (
                      <div key={`sum-${t}`} style={{ marginTop: 6 }}>
                        <div>{t}</div>
                        <div style={{ marginTop: 8 }}>
                          <button className="btn secondary" type="button" onClick={() => copy(t)}>
                            Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="listItem">
                    <div className="muted" style={{ marginBottom: 6 }}>
                      Experience bullets
                    </div>
                    {result.suggestedAdditions.experienceBullets.length === 0 ? <div className="muted">No suggestions.</div> : null}
                    {result.suggestedAdditions.experienceBullets.map((t) => (
                      <div key={`exp-${t}`} style={{ marginTop: 6 }}>
                        <div>{t}</div>
                        <div style={{ marginTop: 8 }}>
                          <button className="btn secondary" type="button" onClick={() => copy(t)}>
                            Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="listItem">
                    <div className="muted" style={{ marginBottom: 6 }}>
                      Skills
                    </div>
                    {result.suggestedAdditions.skills.length === 0 ? <div className="muted">No suggestions.</div> : null}
                    {result.suggestedAdditions.skills.map((t) => (
                      <div key={`sk-${t}`} style={{ marginTop: 6 }}>
                        <div>{t}</div>
                        <div style={{ marginTop: 8 }}>
                          <button className="btn secondary" type="button" onClick={() => copy(t)}>
                            Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <h3 style={{ marginTop: 16 }}>Section breakdown</h3>
              <div className="list">
                {result.sections.length === 0 ? <div className="muted">No sections detected.</div> : null}
                {result.sections.map((s) => (
                  <details key={`${s.name}-${s.startLine}-${s.endLine}`} className="listItem" open>
                    <summary style={{ cursor: 'pointer' }}>
                      <strong>{s.name}</strong>{' '}
                      <span className="muted">
                        (Lines {s.startLine}–{s.endLine})
                      </span>
                    </summary>

                    {s.issues.length > 0 ? (
                      <div style={{ marginTop: 10 }}>
                        <div className="muted" style={{ marginBottom: 6 }}>
                          Section action items
                        </div>
                        <div className="list">
                          {s.issues.map((it) => (
                            <div key={`${s.name}-secissue-${it}`} className="listItem">
                              {it}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div style={{ marginTop: 10 }}>
                      <div className="muted" style={{ marginBottom: 6 }}>
                        Matched keywords ({s.matchedKeywords.length})
                      </div>
                      <div className="chips">
                        {s.matchedKeywords.slice(0, 12).map((k) => (
                          <span key={`${s.name}-m-${k}`} className="chip good">
                            {k}
                          </span>
                        ))}
                        {s.matchedKeywords.length === 0 ? <span className="muted">None</span> : null}
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div className="muted" style={{ marginBottom: 6 }}>
                        Missing keywords (suggested) ({s.missingKeywords.length})
                      </div>
                      <div className="chips">
                        {s.missingKeywords.slice(0, 12).map((k) => (
                          <span key={`${s.name}-x-${k}`} className="chip bad">
                            {k}
                          </span>
                        ))}
                        {s.missingKeywords.length === 0 ? <span className="muted">None</span> : null}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div className="muted" style={{ marginBottom: 6 }}>
                        Suggested changes
                      </div>

                      {s.lines.filter((l) => l.issues.length > 0 || l.suggestedKeywords.length > 0 || Boolean(l.suggestedRewrite)).length ===
                      0 ? (
                        <div className="muted">No section-level changes suggested.</div>
                      ) : (
                        <div className="list">
                          {s.lines
                            .filter((l) => l.issues.length > 0 || l.suggestedKeywords.length > 0 || Boolean(l.suggestedRewrite))
                            .map((l) => (
                              <div key={`${s.name}-line-${l.lineNumber}`} className="listItem">
                                <div className="muted">Line {l.lineNumber}</div>
                                <div style={{ marginTop: 6 }}>{l.text}</div>

                                {l.suggestedRewrite ? (
                                  <div style={{ marginTop: 8 }}>
                                    <div className="muted" style={{ marginBottom: 6 }}>
                                      Suggested rewrite
                                    </div>
                                    <div className="list">
                                      <div className="listItem">
                                        <div>{l.suggestedRewrite}</div>
                                        <div style={{ marginTop: 8 }}>
                                          <button className="btn secondary" type="button" onClick={() => copy(l.suggestedRewrite ?? '')}>
                                            Copy rewrite
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}

                                {l.issues.length > 0 ? (
                                  <div style={{ marginTop: 8 }}>
                                    <div className="muted" style={{ marginBottom: 6 }}>
                                      Issues
                                    </div>
                                    <div className="list">
                                      {l.issues.map((it) => (
                                        <div key={`${l.lineNumber}-issue-${it}`} className="listItem">
                                          {it}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {l.suggestedKeywords.length > 0 ? (
                                  <div style={{ marginTop: 8 }}>
                                    <div className="muted" style={{ marginBottom: 6 }}>
                                      Suggested keywords to add near this bullet
                                    </div>
                                    <div className="chips">
                                      {l.suggestedKeywords.slice(0, 10).map((k) => (
                                        <span key={`${l.lineNumber}-sk-${k}`} className="chip bad">
                                          {k}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
          <h2>Recent scans</h2>
          {history.length === 0 ? (
            <div className="muted">No scans yet.</div>
          ) : (
            <div className="table">
              {history.map((h) => (
                <div key={h.id} className="tableRow">
                  <div className="tableCell">{formatDate(h.createdAt)}</div>
                  <div className="tableCell" style={{ textAlign: 'right' }}>
                    <span className="pill">{h.score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
