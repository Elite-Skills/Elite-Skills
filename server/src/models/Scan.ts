import mongoose, { type InferSchemaType } from 'mongoose'

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobDescription: { type: String, required: true },
    resumeText: { type: String, required: true },
    score: { type: Number, required: true },
    matchedKeywords: { type: [String], required: true },
    missingKeywords: { type: [String], required: true },
    tips: { type: [String], required: true },
  },
  { timestamps: true }
)

export type ScanDocument = InferSchemaType<typeof scanSchema>

export const Scan = mongoose.models.Scan ?? mongoose.model('Scan', scanSchema)
