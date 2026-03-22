import { Router } from 'express'
import type { Request, Response } from 'express'
import { BlogPost } from '../models/BlogPost.js'
import { User } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { uniqueSlug } from '../utils/slug.js'

export const blogsRouter = Router()

/** List published blogs, with optional search */
blogsRouter.get('/', async (req: Request, res: Response) => {
  const q = String(req.query?.q ?? '').trim().toLowerCase().slice(0, 100)
  const limit = Math.min(50, Math.max(1, Number(req.query?.limit ?? 12)))

  const filter: Record<string, unknown> = { status: 'published' }
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { content: { $regex: q, $options: 'i' } },
      { excerpt: { $regex: q, $options: 'i' } },
    ]
  }

  const posts = await BlogPost.find(filter)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select({ title: 1, slug: 1, excerpt: 1, publishedAt: 1, authorUserId: 1 })

  const authorIds = [...new Set(posts.map((p) => String(p.authorUserId)))]
  const users = await User.find({ _id: { $in: authorIds } }).select({ name: 1 })
  const userMap = new Map(users.map((u) => [String(u._id), u.name]))

  res.json({
    posts: posts.map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      authorName: userMap.get(String(p.authorUserId)) ?? 'Unknown',
    })),
  })
})

/** Get single published blog by slug (public, SEO) - must be before /:id */
blogsRouter.get('/by-slug/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug ?? '').trim()
  const post = await BlogPost.findOne({ slug, status: 'published' })
  if (!post) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const user = await User.findById(post.authorUserId).select({ name: 1 })
  res.json({
    post: {
      id: String(post._id),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      mediaUrls: post.mediaUrls ?? [],
      authorName: user?.name ?? 'Unknown',
      authorUserId: String(post.authorUserId),
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      publishedAt: post.publishedAt,
    },
  })
})

/** Get blog by id (admin only, for editing) */
blogsRouter.get('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const post = await BlogPost.findById(req.params.id)
  if (!post) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const user = await User.findById(post.authorUserId).select({ name: 1 })
  res.json({
    post: {
      id: String(post._id),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      mediaUrls: post.mediaUrls ?? [],
      authorName: user?.name ?? 'Unknown',
      authorUserId: String(post.authorUserId),
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      publishedAt: post.publishedAt,
      status: post.status,
    },
  })
})

/** Create blog (admin only) */
blogsRouter.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const title = String(req.body?.title ?? '').trim()
  const content = String(req.body?.content ?? '').trim()
  const excerpt = String(req.body?.excerpt ?? '').trim().slice(0, 300)
  const metaTitle = String(req.body?.metaTitle ?? '').trim().slice(0, 70)
  const metaDescription = String(req.body?.metaDescription ?? '').trim().slice(0, 160)
  const mediaUrls = Array.isArray(req.body?.mediaUrls)
    ? req.body.mediaUrls.map((u: unknown) => String(u).trim()).filter(Boolean)
    : []
  const status = req.body?.status === 'published' ? 'published' : 'draft'

  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }

  const existingSlugs = (await BlogPost.distinct('slug')) as string[]
  const slug = uniqueSlug(title, existingSlugs)

  const publishedAt = status === 'published' ? new Date() : null

  const post = await BlogPost.create({
    title,
    slug,
    content,
    excerpt: excerpt || content.slice(0, 300),
    mediaUrls,
    authorUserId: req.userId,
    metaTitle: metaTitle || title,
    metaDescription: metaDescription || (excerpt || content.slice(0, 160)),
    publishedAt,
    status,
  })

  res.json({ id: String(post._id), slug: post.slug })
})

/** Update blog (admin only) */
blogsRouter.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const post = await BlogPost.findById(req.params.id)
  if (!post) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  if (req.body?.title !== undefined) post.title = String(req.body.title).trim()
  if (req.body?.content !== undefined) post.content = String(req.body.content).trim()
  if (req.body?.excerpt !== undefined) post.excerpt = String(req.body.excerpt).trim().slice(0, 300)
  if (req.body?.metaTitle !== undefined) post.metaTitle = String(req.body.metaTitle).trim().slice(0, 70)
  if (req.body?.metaDescription !== undefined) post.metaDescription = String(req.body.metaDescription).trim().slice(0, 160)
  if (Array.isArray(req.body?.mediaUrls)) post.mediaUrls = req.body.mediaUrls.map((u: unknown) => String(u).trim()).filter(Boolean)

  if (req.body?.status === 'published' && post.status !== 'published') {
    post.status = 'published'
    post.publishedAt = post.publishedAt ?? new Date()
  } else if (req.body?.status === 'draft') {
    post.status = 'draft'
  }

  if (req.body?.slug !== undefined) {
    const newSlug = String(req.body.slug).trim().toLowerCase().replace(/\s+/g, '-')
    if (newSlug && newSlug !== post.slug) {
      const existing = await BlogPost.findOne({ slug: newSlug, _id: { $ne: post._id } })
      if (!existing) post.slug = newSlug
    }
  }

  await post.save()
  res.json({ id: String(post._id), slug: post.slug })
})

/** Delete blog (admin only) */
blogsRouter.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const post = await BlogPost.findByIdAndDelete(req.params.id)
  if (!post) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({ ok: true })
})
