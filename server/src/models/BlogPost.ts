import mongoose, { type InferSchemaType } from 'mongoose'

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    content: { type: String, required: true, default: '' },
    excerpt: { type: String, default: '', trim: true, maxlength: 300 },
    mediaUrls: { type: [String], default: [] },
    authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    metaTitle: { type: String, default: '', trim: true, maxlength: 70 },
    metaDescription: { type: String, default: '', trim: true, maxlength: 160 },
    publishedAt: { type: Date, default: null, index: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  },
  { timestamps: true }
)

blogPostSchema.index({ status: 1, publishedAt: -1 })
blogPostSchema.index({ title: 'text', content: 'text' })

export type BlogPostDocument = InferSchemaType<typeof blogPostSchema>

export const BlogPost = mongoose.models.BlogPost ?? mongoose.model('BlogPost', blogPostSchema)
