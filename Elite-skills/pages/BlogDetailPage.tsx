import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LandingNavbar from '../components/LandingNavbar'
import { useAuth } from '../state/AuthContext'
import { getBlogBySlug, type BlogPostDetail } from '../api'

function useSeo(title: string, description: string, slug?: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    let descEl = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!descEl) {
      descEl = document.createElement('meta')
      descEl.name = 'description'
      document.head.appendChild(descEl)
    }
    const prevDesc = descEl.content
    descEl.content = description
    return () => {
      document.title = prevTitle
      descEl!.content = prevDesc
    }
  }, [title, description])
}

export default function BlogDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [post, setPost] = useState<BlogPostDetail | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getBlogBySlug(slug)
        if (!cancelled) setPost(data.post)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Not found')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-elite-black">
        <LandingNavbar />
        <div className="pt-32 flex items-center justify-center text-elite-gold">Loading…</div>
      </div>
    )
  }
  if (error || !post) {
    return (
      <div className="min-h-screen bg-elite-black">
        <LandingNavbar />
        <div className="pt-32 flex flex-col items-center justify-center px-4">
          <p className="text-elite-text-muted mb-4">{error ?? 'Post not found'}</p>
          <Link to="/blog" className="text-elite-gold hover:underline">Back to Blog</Link>
        </div>
      </div>
    )
  }

  const metaTitle = post.metaTitle || post.title
  const metaDesc = post.metaDescription || post.excerpt
  useSeo(`${metaTitle} | Elite Skills Blog`, metaDesc)

  return (
    <div className="min-h-screen bg-elite-black">
      <LandingNavbar />
      <article>
        <header className="pt-32 pb-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link to="/blog" className="text-elite-gold hover:underline text-sm">← Back to Blog</Link>
              {user?.isAdmin && (
                <Link to={`/blog/edit/${post.id}`} className="text-elite-gold hover:underline text-sm">Edit</Link>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">{post.title}</h1>
            <div className="text-elite-text-muted text-sm">
              {post.authorName} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
            </div>
          </div>
        </header>

        <div className="px-4 pb-20">
          <div className="max-w-3xl mx-auto prose prose-invert prose-lg max-w-none">
            {post.mediaUrls.length > 0 && (
              <div className="mb-8 space-y-4">
                {post.mediaUrls.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full rounded-lg border border-white/10" />
                ))}
              </div>
            )}
            <div
              className="text-elite-white leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
            />
          </div>
        </div>
      </article>
    </div>
  )
}
