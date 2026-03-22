import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import LandingNavbar from '../components/LandingNavbar'
import {
  createBlogPost,
  updateBlogPost,
  getBlogPost,
  type BlogPostDetail,
} from '../api'
import { useAuth } from '../state/AuthContext'

export default function BlogEditPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const isNew = location.pathname === '/blog/new'

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [mediaUrls, setMediaUrls] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      try {
        const data = await getBlogPost(id)
        if (!cancelled && data.post) {
          const p = data.post
          setTitle(p.title)
          setContent(p.content)
          setExcerpt(p.excerpt ?? '')
          setMetaTitle(p.metaTitle ?? '')
          setMetaDescription(p.metaDescription ?? '')
          setMediaUrls((p.mediaUrls ?? []).join('\n'))
          setStatus((p as { status?: string }).status === 'published' ? 'published' : 'draft')
        }
      } catch {
        if (!cancelled) setError('Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const urls = mediaUrls.split('\n').map((u) => u.trim()).filter(Boolean)
    try {
      if (isNew) {
        const { slug } = await createBlogPost({
          title,
          content,
          excerpt: excerpt || undefined,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          mediaUrls: urls,
          status,
        })
        navigate(status === 'published' ? `/blog/${slug}` : '/blog')
      } else {
        await updateBlogPost(id!, {
          title,
          content,
          excerpt: excerpt || undefined,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          mediaUrls: urls,
          status,
        })
        navigate('/blog')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || (!isNew && loading)) {
    return (
      <div className="min-h-screen bg-elite-black">
        <LandingNavbar />
        <div className="pt-32 flex justify-center text-elite-gold">Loading…</div>
      </div>
    )
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-elite-black">
        <LandingNavbar />
        <div className="pt-32 px-4 max-w-2xl mx-auto">
          <p className="text-elite-text-muted mb-4">Admin access required.</p>
          <Link to="/blog" className="text-elite-gold hover:underline">Back to Blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elite-black">
      <LandingNavbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-serif font-bold text-white">{isNew ? 'New Post' : 'Edit Post'}</h1>
            <Link to="/blog" className="text-elite-gold hover:underline text-sm">← Back to Blog</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-elite-text-muted mb-2">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white focus:outline-none focus:border-elite-gold/50"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-elite-text-muted mb-2">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={12}
                className="w-full px-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white focus:outline-none focus:border-elite-gold/50 resize-y"
                placeholder="Write your post..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-elite-text-muted mb-2">Excerpt (for preview, max 300 chars)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value.slice(0, 300))}
                rows={2}
                className="w-full px-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white focus:outline-none focus:border-elite-gold/50"
                placeholder="Short summary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-elite-text-muted mb-2">SEO: Meta Title (max 70 chars)</label>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value.slice(0, 70))}
                  className="w-full px-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white focus:outline-none focus:border-elite-gold/50"
                  placeholder={title || 'Defaults to title'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-elite-text-muted mb-2">SEO: Meta Description (max 160 chars)</label>
                <input
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                  className="w-full px-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white focus:outline-none focus:border-elite-gold/50"
                  placeholder="For search results"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-elite-text-muted mb-2">Media URLs (one per line)</label>
              <textarea
                value={mediaUrls}
                onChange={(e) => setMediaUrls(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white focus:outline-none focus:border-elite-gold/50 font-mono text-sm"
                placeholder="https://example.com/image1.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-elite-text-muted mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-4 py-3 bg-elite-gray border border-white/10 rounded-lg text-white focus:outline-none focus:border-elite-gold/50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {error && <p className="text-red-400">{error}</p>}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-elite-gold text-black font-bold rounded-lg hover:bg-elite-gold-dim disabled:opacity-50"
              >
                {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
              </button>
              <Link to="/blog" className="px-6 py-3 border border-white/20 text-white rounded-lg hover:border-elite-gold/50">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
