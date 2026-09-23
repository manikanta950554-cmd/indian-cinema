import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true, unique: true }, passwordHash: String, role: String, region: String, bio: String, photo: String, credits: [{ title: String, year: String, type: String }], badges: [String] }, { timestamps: true })
const postSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, content: String, image: String, likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], comments: [{ userId: mongoose.Schema.Types.ObjectId, text: String, createdAt: { type: Date, default: Date.now } }] }, { timestamps: true })
const connectionSchema = new mongoose.Schema({ requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' } }, { timestamps: true })
export const User = mongoose.model('User', userSchema)
export const Post = mongoose.model('Post', postSchema)
export const Connection = mongoose.model('Connection', connectionSchema)
