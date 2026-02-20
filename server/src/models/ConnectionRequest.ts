import mongoose, { type InferSchemaType } from 'mongoose'

const connectionRequestSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralPost', required: false, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionAnswers: {
      type: [
        {
          question: { type: String, required: true, trim: true },
          answer: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
)

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1, postId: 1, status: 1 })

export type ConnectionRequestDocument = InferSchemaType<typeof connectionRequestSchema>

export const ConnectionRequest =
  mongoose.models.ConnectionRequest ?? mongoose.model('ConnectionRequest', connectionRequestSchema)
