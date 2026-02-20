import mongoose, { type InferSchemaType } from 'mongoose'

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    headline: { type: String, default: '', trim: true },
    experience: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    contact: {
      email: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      linkedIn: { type: String, default: '', trim: true },
    },
    visibility: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showLinkedIn: { type: Boolean, default: true },
    },
    connectionQuestions: { type: [String], default: [] },
    recommendations: {
      type: [
        {
          authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          text: { type: String, required: true, trim: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
)

export type ProfileDocument = InferSchemaType<typeof profileSchema>

export const Profile = mongoose.models.Profile ?? mongoose.model('Profile', profileSchema)
