import mongoose, { type InferSchemaType } from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 254 },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

export type UserDocument = InferSchemaType<typeof userSchema>

export const User = mongoose.models.User ?? mongoose.model('User', userSchema)
