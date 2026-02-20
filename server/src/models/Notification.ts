import mongoose, { type InferSchemaType } from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
)

notificationSchema.index({ userId: 1, createdAt: -1 })

export type NotificationDocument = InferSchemaType<typeof notificationSchema>

export const Notification = mongoose.models.Notification ?? mongoose.model('Notification', notificationSchema)
