import mongoose, { type InferSchemaType } from 'mongoose'

const referralPostSchema = new mongoose.Schema(
  {
    authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, required: true, trim: true },
    roleTitle: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    jobLink: { type: String, default: '', trim: true },
    referralType: { type: String, default: 'referral', trim: true },
    description: { type: String, required: true, trim: true },
    tags: { type: [String], default: [], index: true },
    questions: { type: [String], default: [] },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true }
)

export type ReferralPostDocument = InferSchemaType<typeof referralPostSchema>

export const ReferralPost = mongoose.models.ReferralPost ?? mongoose.model('ReferralPost', referralPostSchema)
