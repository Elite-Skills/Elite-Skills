import mongoose, { type InferSchemaType } from 'mongoose'

const contactSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true }
)

export type ContactSubmissionDocument = InferSchemaType<typeof contactSubmissionSchema>

export const ContactSubmission =
  mongoose.models.ContactSubmission ?? mongoose.model('ContactSubmission', contactSubmissionSchema)
