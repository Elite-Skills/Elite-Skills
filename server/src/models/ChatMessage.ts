import mongoose, { type InferSchemaType } from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true, index: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

chatMessageSchema.index({ connectionId: 1, createdAt: -1 })

export type ChatMessageDocument = InferSchemaType<typeof chatMessageSchema>

export const ChatMessage = mongoose.models.ChatMessage ?? mongoose.model('ChatMessage', chatMessageSchema)
