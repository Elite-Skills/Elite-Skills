import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import LandingNavbar from '../components/LandingNavbar'
import { listBlogs, type BlogPostListItem } from '../api'
import { useAuth } from '../state/AuthContext'

export default function BlogListPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [search, setSearch] = useState('')

  const query = useMemo(() => search.trim(), [search])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listBlogs({ q: query || undefined, limit: 24 })
        if (!cancelled) setPosts(data.posts)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [query])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <LandingNavbar />
      <header className="pt-32 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-serif font-bold text-white mb-4">Blog</h1>
          <p className="text-elite-text-muted mb-8">
            Latest insights on investment banking, technical prep, and career strategy.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-elite-text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white placeholder:text-elite-text-muted focus:outline-none focus:border-elite-gold/50"
            />
          </div>
          {user?.isAdmin && (
            <Link
              to="/blog/new"
              className="inline-flex items-center gap-2 mt-6 text-elite-gold hover:text-elite-gold-dim font-semibold text-sm uppercase tracking-wider"
            >
              + New Post
            </Link>
          )}
        </div>
      </header>

      <main className="pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {error && <div className="text-red-400 py-4">{error}</div>}
          {loading && <div className="text-elite-text-muted py-8">Loading…</div>}

          {!loading && posts.length === 0 && (
            <div className="text-elite-text-muted py-16 text-center">
              {query ? 'No posts match your search.' : 'No posts yet.'}
            </div>
          )}

          <div className="grid gap-8 sm:grid-cols-2">
            {posts.map((p) => (
              <div key={p.id} className="bento-card p-6 rounded-xl border border-white/10 hover:border-elite-gold/30 transition-colors group">
                <Link to={`/blog/${p.slug}`}>
                  <h2 className="text-xl font-serif font-bold text-white mb-2 line-clamp-2">{p.title}</h2>
                  <p className="text-elite-text-muted text-sm line-clamp-2 mb-4">{p.excerpt}</p>
                  <div className="text-xs text-elite-text-muted">
                    {p.authorName} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}
                  </div>
                </Link>
                {user?.isAdmin && (
                  <Link
                    to={`/blog/edit/${p.id}`}
                    className="mt-3 inline-block text-xs text-elite-gold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Edit
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
